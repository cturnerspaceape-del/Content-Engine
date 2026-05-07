// OpenAI gpt-image-1 backend — drop-in replacement for the old gemini.ts
// generateImage() shape. Mirrors the same ReferenceImage interface so call
// sites (generateSingleImage, generateCarouselSlide, generatePrintImage,
// generateEmailImage) don't care which model is rendering.

import sharp from 'sharp'

const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits'
const OPENAI_GENERATIONS_URL = 'https://api.openai.com/v1/images/generations'

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(408|429|500|502|503|504|UNAVAILABLE|RESOURCE_EXHAUSTED|timeout|ETIMEDOUT|ECONNRESET)\b/i.test(msg)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const MAX_CONCURRENT = Number(process.env.OPENAI_IMAGE_CONCURRENCY ?? '4')
let inFlight = 0
const waiters: Array<() => void> = []

async function acquire(): Promise<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight++
    return
  }
  // Bounded wait so a single hung in-flight request can't permanently
  // wedge the lab. If we can't get a slot in 2 min, fail loudly instead
  // of queueing forever.
  await new Promise<void>((resolve, reject) => {
    const tid = setTimeout(() => {
      const idx = waiters.indexOf(waiter)
      if (idx >= 0) waiters.splice(idx, 1)
      reject(new Error('timeout: openai image concurrency slot not available within 120s'))
    }, 120_000)
    const waiter = () => {
      clearTimeout(tid)
      resolve()
    }
    waiters.push(waiter)
  })
  inFlight++
}

function release(): void {
  inFlight--
  const next = waiters.shift()
  if (next) next()
}

export interface ReferenceImage {
  mime: string
  base64: string
}

export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | '2048x2048' | 'auto'
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto'
export type ImageBackground = 'transparent' | 'opaque' | 'auto'
export type ImageOutputFormat = 'png' | 'jpeg' | 'webp'
export type ImageInputFidelity = 'high' | 'low'
export type ImageModeration = 'auto' | 'low'

export interface GenerateImageInput {
  prompt: string
  references: ReferenceImage[]
  // All optional — undefined = current behavior (server-side defaults).
  size?: ImageSize
  quality?: ImageQuality
  background?: ImageBackground
  outputFormat?: ImageOutputFormat
  // 0–100. Only meaningful when outputFormat is jpeg or webp.
  outputCompression?: number
  inputFidelity?: ImageInputFidelity
  moderation?: ImageModeration
  // PNG with alpha=0 = regions to edit, alpha=255 = preserve.
  // Only honored when references contain at least one image.
  mask?: ReferenceImage
}

// OpenAI's /v1/images/edits 400s on anything it can't decode cleanly: AVIF,
// animated WebP/GIF, CMYK JPEGs, or bytes whose actual format doesn't match
// the multipart filename/MIME. Sharp ignores the claimed MIME, decodes from
// raw bytes, takes the first frame of any animation, normalizes to sRGB
// RGB(A), caps dimensions, re-encodes as PNG.
async function normalizeReferenceForOpenAI(ref: ReferenceImage): Promise<ReferenceImage | null> {
  try {
    const bytes = Buffer.from(ref.base64, 'base64')
    const png = await sharp(bytes, { failOn: 'none', animated: false })
      .rotate()
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .png()
      .toBuffer()
    return { mime: 'image/png', base64: png.toString('base64') }
  } catch (err) {
    console.warn(
      '[openaiImage] dropped unreadable reference:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

export async function generateImage({
  prompt,
  references,
  size: sizeOverride,
  quality,
  background,
  outputFormat,
  outputCompression,
  inputFidelity,
  moderation,
  mask,
}: GenerateImageInput): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
  const size = sizeOverride || process.env.OPENAI_IMAGE_SIZE || '1024x1024'

  // gpt-image-2 accepts up to 16 reference images via the edits endpoint.
  // Trim defensively, then transcode each to clean sRGB PNG so OpenAI
  // doesn't 400 on exotic formats / mislabeled bytes. Refs that fail to
  // decode are dropped; if every ref drops, we fall through to /generations.
  const trimmed = references.slice(0, 16)
  const refs = (await Promise.all(trimmed.map(normalizeReferenceForOpenAI))).filter(
    (r): r is ReferenceImage => r !== null,
  )

  // Mask is only honored when at least one source ref survives normalization;
  // /v1/images/edits requires `image[]` to make a mask meaningful.
  const normalizedMask = mask && refs.length > 0 ? await normalizeReferenceForOpenAI(mask) : null

  await acquire()
  try {
    // 3 attempts (was 5) — the 5-attempt budget was inherited from Gemini
    // and routinely blew past the frontend's 180s total budget. Per-attempt
    // 75s AbortController keeps the server failing slightly before the
    // client's 90s/attempt timeout, so the user sees a real error instead
    // of a stalled spinner. Backoff capped at 8s to bound total wall time.
    const maxAttempts = 3
    const PER_ATTEMPT_TIMEOUT_MS = 75_000
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ctrl = new AbortController()
      const tid = setTimeout(() => ctrl.abort(), PER_ATTEMPT_TIMEOUT_MS)
      try {
        // Endpoint branch: /edits requires at least one reference image
        // (`image[]`). When refs is empty, fall back to /generations so the
        // call doesn't 400 with "Missing required parameter: 'image'".
        let resp: Response
        if (refs.length > 0) {
          // Rebuild FormData each attempt — Blob streams are single-use.
          const form = new FormData()
          form.set('model', model)
          form.set('prompt', prompt)
          form.set('size', size)
          form.set('n', '1')
          if (quality) form.set('quality', quality)
          if (background) form.set('background', background)
          if (outputFormat) form.set('output_format', outputFormat)
          if (typeof outputCompression === 'number') {
            form.set('output_compression', String(outputCompression))
          }
          if (inputFidelity) form.set('input_fidelity', inputFidelity)
          if (moderation) form.set('moderation', moderation)
          for (let i = 0; i < refs.length; i++) {
            const ref = refs[i]
            const bytes = Buffer.from(ref.base64, 'base64')
            const blob = new Blob([bytes], { type: 'image/png' })
            form.append('image[]', blob, `ref_${i}.png`)
          }
          if (normalizedMask) {
            const maskBytes = Buffer.from(normalizedMask.base64, 'base64')
            const maskBlob = new Blob([maskBytes], { type: 'image/png' })
            form.append('mask', maskBlob, 'mask.png')
          }
          resp = await fetch(OPENAI_EDITS_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
            signal: ctrl.signal,
          })
        } else {
          const body: Record<string, unknown> = { model, prompt, size, n: 1 }
          if (quality) body.quality = quality
          if (background) body.background = background
          if (outputFormat) body.output_format = outputFormat
          if (typeof outputCompression === 'number') {
            body.output_compression = outputCompression
          }
          if (moderation) body.moderation = moderation
          resp = await fetch(OPENAI_GENERATIONS_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: ctrl.signal,
          })
        }

        if (!resp.ok) {
          const text = await resp.text().catch(() => '')
          const endpoint = refs.length > 0 ? 'edits' : 'generations'
          throw new Error(
            `OpenAI ${resp.status} ${resp.statusText} (${endpoint}): ${text.slice(0, 400)}`,
          )
        }

        const json = (await resp.json()) as {
          data?: Array<{ b64_json?: string }>
          error?: { message?: string }
        }
        if (json.error?.message) throw new Error(`OpenAI error: ${json.error.message}`)
        const b64 = json.data?.[0]?.b64_json
        if (!b64) throw new Error('OpenAI response contained no b64_json image data')
        return Buffer.from(b64, 'base64')
      } catch (err) {
        // Map AbortError → retryable timeout so isRetryableError catches it.
        const aborted = err instanceof Error && err.name === 'AbortError'
        const mapped = aborted
          ? new Error(`timeout: OpenAI image call exceeded ${PER_ATTEMPT_TIMEOUT_MS / 1000}s`)
          : err
        lastErr = mapped
        if (!isRetryableError(mapped) || attempt === maxAttempts) throw mapped
        const backoff = Math.min(8000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500)
        const snippet =
          mapped instanceof Error ? mapped.message.slice(0, 200) : String(mapped).slice(0, 200)
        console.warn(
          `[openaiImage.generateImage] retry ${attempt}/${maxAttempts - 1} in ${Math.round(backoff / 1000)}s: ${snippet}`,
        )
        await sleep(backoff)
      } finally {
        clearTimeout(tid)
      }
    }
    throw lastErr ?? new Error('OpenAI image call failed with no response')
  } finally {
    release()
  }
}
