// In-place image edit — wraps OpenAI gpt-image-2 /v1/images/edits with the
// originally generated image as the single reference, an edit prompt, and a
// cache key derived from {sourceUrl, editPrompt, variationSeed}. Used by the
// "✏️ Edit" affordance in Image Lab, Carousel Lab (per slide), and Email Lab.
//
// Two modes via the same endpoint:
//   - Edit: editPrompt is a non-empty instruction ("make the sky purple",
//     "remove the bottle"). The model rewrites the source guided by it.
//   - Variation: editPrompt is empty. We send a generic "fresh variation,
//     same subject and composition" prompt so the model produces a new take
//     while keeping the source as the dominant reference.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import {
  generateImage,
  type ImageBackground,
  type ImageInputFidelity,
  type ImageOutputFormat,
  type ImageQuality,
  type ImageSize,
  type ReferenceImage,
} from './openaiImage'

const MAX_USER_REFS = 4

interface UserRef {
  mime: string
  base64: string
}

interface EditImageBody {
  // The image to edit. Accepts a same-origin path like "/generated/.../foo.png"
  // (mapped to disk under public/) OR a fully-qualified http(s) URL (fetched).
  imageUrl?: string
  // Free-text edit instruction. Empty/missing → variation mode.
  editPrompt?: string
  // Optional surface label so cache buckets stay aligned with the calling
  // lab's other generated assets ('single-image' default).
  kind?: 'single-image' | 'carousel-slide' | 'email-image'
  // When the user clicks Edit/Variation a second time on the same source +
  // prompt, the cache would hand back the prior result. Pass a fresh seed
  // (e.g. Date.now()) to force a new generation.
  variationSeed?: number
  // Up to MAX_USER_REFS extra composition refs (style/pose/color hints).
  userRefs?: UserRef[]
  // PNG (alpha=0 = edit, alpha=255 = preserve). Combined with imageUrl source.
  maskBase64?: string
  // Forwarded straight through to OpenAI.
  size?: ImageSize
  quality?: ImageQuality
  background?: ImageBackground
  outputFormat?: ImageOutputFormat
  outputCompression?: number
  inputFidelity?: ImageInputFidelity
}

const VARIATION_PROMPT =
  'Produce a fresh variation of the reference image: keep the subject, composition, palette, and visual treatment, but vary the small details (pose, framing, lighting nuance, secondary props). Photorealistic.'

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public')

function inferMime(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

async function loadSource(imageUrl: string): Promise<ReferenceImage> {
  if (/^https?:\/\//i.test(imageUrl)) {
    const resp = await fetch(imageUrl)
    if (!resp.ok) throw new Error(`source image fetch failed: ${resp.status}`)
    const buf = Buffer.from(await resp.arrayBuffer())
    const ct = resp.headers.get('content-type') || inferMime(imageUrl)
    return { mime: ct.split(';')[0]!.trim(), base64: buf.toString('base64') }
  }
  // Same-origin path — strip query, normalize, resolve under public/.
  const cleaned = imageUrl.split('?')[0]!.replace(/^\/+/, '')
  const abs = path.resolve(PUBLIC_ROOT, cleaned)
  // Guard against path traversal — abs must stay inside public/.
  if (!abs.startsWith(PUBLIC_ROOT + path.sep) && abs !== PUBLIC_ROOT) {
    throw new Error('imageUrl resolves outside public/')
  }
  const data = await fs.readFile(abs)
  return { mime: inferMime(abs), base64: data.toString('base64') }
}

function sanitizeUserRefs(input: unknown): UserRef[] {
  if (!Array.isArray(input)) return []
  const out: UserRef[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const mime = (item as { mime?: unknown }).mime
    const base64 = (item as { base64?: unknown }).base64
    if (typeof mime !== 'string' || typeof base64 !== 'string') continue
    if (!base64) continue
    out.push({ mime, base64 })
    if (out.length >= MAX_USER_REFS) break
  }
  return out
}

// Cheap fingerprint for user refs / mask — full base64 in the hash key blows
// out cache-key length. First 32 chars + length is plenty to disambiguate.
function refFingerprint(r: { base64: string }): string {
  return `${r.base64.slice(0, 32)}:${r.base64.length}`
}

export async function editImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as EditImageBody
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
    const rawEdit = typeof body.editPrompt === 'string' ? body.editPrompt.trim() : ''
    const kind = body.kind ?? 'single-image'
    const {
      variationSeed,
      maskBase64,
      size,
      quality,
      background,
      outputFormat,
      outputCompression,
      inputFidelity,
    } = body
    const userRefs = sanitizeUserRefs(body.userRefs)

    if (!imageUrl) {
      res.status(400).json({ error: 'missing required field: imageUrl' })
      return
    }

    const isVariation = rawEdit.length === 0
    const fullPrompt = isVariation
      ? VARIATION_PROMPT
      : `Reference image is the source to edit. Apply this change: ${rawEdit}\n\nKeep everything else identical to the reference. Photorealistic.`

    const hash = hashKey({
      v: 2,
      op: 'edit',
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      kind,
      sourceUrl: imageUrl,
      editPrompt: rawEdit, // empty string for variation — kept distinct from null
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
      ...(maskBase64 ? { mask: refFingerprint({ base64: maskBase64 }) } : {}),
      ...(userRefs.length > 0 ? { userRefs: userRefs.map(refFingerprint) } : {}),
      ...(size ? { size } : {}),
      ...(quality ? { quality } : {}),
      ...(background ? { background } : {}),
      ...(outputFormat ? { outputFormat } : {}),
      ...(typeof outputCompression === 'number' ? { outputCompression } : {}),
      ...(inputFidelity ? { inputFidelity } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, kind)

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash })
      return
    }

    const source = await loadSource(imageUrl)
    const references: ReferenceImage[] = [source, ...userRefs.map((r) => ({ mime: r.mime, base64: r.base64 }))]

    const mask: ReferenceImage | undefined = maskBase64
      ? { mime: 'image/png', base64: maskBase64 }
      : undefined

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[edit-image] kind=${kind} mode=${isVariation ? 'variation' : 'edit'}\nsource=${imageUrl}\nedit=${rawEdit || '(none)'}\nuserRefs=${userRefs.length} mask=${mask ? 'yes' : 'no'} size=${size || 'default'} quality=${quality || 'default'} bg=${background || 'default'} fmt=${outputFormat || 'default'} fidelity=${inputFidelity || 'default'}\n`,
      )
    }

    const png = await generateImage({
      prompt: fullPrompt,
      references,
      mask,
      size,
      quality,
      background,
      outputFormat,
      outputCompression,
      inputFidelity,
    })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash })
  } catch (err) {
    console.error('[edit-image]', err)
    const message = err instanceof Error ? err.message : 'edit failed'
    res.status(500).json({ error: message })
  }
}
