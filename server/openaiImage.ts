// OpenAI gpt-image-2 backend — drop-in replacement for the old gemini.ts
// generateImage() shape. Mirrors the same ReferenceImage interface so call
// sites (generateSingleImage, generateCarouselSlide, generatePrintImage,
// generateEmailImage) don't care which model is rendering.

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
  await new Promise<void>((resolve) => waiters.push(resolve))
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

export interface GenerateImageInput {
  prompt: string
  references: ReferenceImage[]
}

function extToFilename(mime: string, idx: number): string {
  const ext = mime.includes('png')
    ? 'png'
    : mime.includes('webp')
      ? 'webp'
      : mime.includes('jpeg') || mime.includes('jpg')
        ? 'jpg'
        : 'png'
  return `ref_${idx}.${ext}`
}

export async function generateImage({ prompt, references }: GenerateImageInput): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
  const size = process.env.OPENAI_IMAGE_SIZE || '1024x1024'

  // gpt-image-2 accepts up to 16 reference images via the edits endpoint.
  // Trim defensively in case a caller passes more.
  const refs = references.slice(0, 16)

  await acquire()
  try {
    const maxAttempts = 5
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
          for (let i = 0; i < refs.length; i++) {
            const ref = refs[i]
            const bytes = Buffer.from(ref.base64, 'base64')
            const blob = new Blob([bytes], { type: ref.mime })
            form.append('image[]', blob, extToFilename(ref.mime, i))
          }
          resp = await fetch(OPENAI_EDITS_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          })
        } else {
          resp = await fetch(OPENAI_GENERATIONS_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, prompt, size, n: 1 }),
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
        lastErr = err
        if (!isRetryableError(err) || attempt === maxAttempts) throw err
        const backoff = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500)
        const snippet = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
        console.warn(
          `[openaiImage.generateImage] retry ${attempt}/${maxAttempts - 1} in ${Math.round(backoff / 1000)}s: ${snippet}`,
        )
        await sleep(backoff)
      }
    }
    throw lastErr ?? new Error('OpenAI image call failed with no response')
  } finally {
    release()
  }
}
