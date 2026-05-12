import type { Request, Response } from 'express'
import { GoogleGenAI } from '@google/genai'
import { cachePath, exists, hashKey, writeVideo } from './cache'

// Veo 3.1 standard (with native audio + first/last frame interpolation).
// Fast variant is also wired below in case we ever want a cheap-mode toggle.
const VEO_MODEL = process.env.VEO_MODEL || 'veo-3.1-generate-preview'

type AspectRatio = '9:16' | '16:9' | '1:1'
type Duration = 4 | 6 | 8

interface FramePayload {
  mime: string // e.g. "image/png"
  base64: string // raw base64 (no data: prefix)
}

interface GenerateVeoBody {
  prompt?: string
  startFrame?: FramePayload
  endFrame?: FramePayload
  aspectRatio?: AspectRatio
  durationSeconds?: Duration
  cameraMotion?: string // free-text or preset label
  vibe?: string // style preset label
  negativePrompt?: string
  variationSeed?: number
}

const CACHE_VERSION = 1

const CAMERA_HINTS: Record<string, string> = {
  static: 'Camera: locked-off static tripod shot, no movement.',
  'dolly-in': 'Camera: slow cinematic dolly in toward the subject.',
  'dolly-out': 'Camera: slow cinematic dolly out, revealing the scene.',
  'pan-left': 'Camera: smooth horizontal pan from right to left.',
  'pan-right': 'Camera: smooth horizontal pan from left to right.',
  orbit: 'Camera: smooth 180-degree orbit around the subject.',
  handheld: 'Camera: organic handheld movement with subtle natural shake.',
  'zoom-in': 'Camera: smooth optical zoom in.',
  'zoom-out': 'Camera: smooth optical zoom out.',
}

const VIBE_HINTS: Record<string, string> = {
  cinematic: 'Style: cinematic, anamorphic lens, shallow depth of field, color graded teal & orange.',
  dreamy: 'Style: dreamy, soft hazy bloom, pastel palette, slow motion feel.',
  neon: 'Style: neon-noir, saturated magenta and cyan lighting, wet reflective surfaces.',
  'slow-mo': 'Style: high frame rate slow motion, hyper-detailed micro movements.',
  'film-grain': 'Style: 35mm film grain, warm halation, vintage analog look.',
  anime: 'Style: anime cel-shading, hand-drawn linework, expressive motion lines.',
  'space-ape': 'Style: Space Ape brand — playful, high-saturation, glossy product hero energy, @starface inspired.',
}

let client: GoogleGenAI | null = null
function getClient(): GoogleGenAI {
  if (client) return client
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  client = new GoogleGenAI({ apiKey })
  return client
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function buildFullPrompt(body: GenerateVeoBody): string {
  const parts: string[] = []
  if (body.prompt) parts.push(body.prompt.trim())
  if (body.cameraMotion) {
    const hint = CAMERA_HINTS[body.cameraMotion] || `Camera: ${body.cameraMotion}.`
    parts.push(hint)
  }
  if (body.vibe) {
    const hint = VIBE_HINTS[body.vibe] || `Style: ${body.vibe}.`
    parts.push(hint)
  }
  return parts.join('\n\n')
}

function validateFrame(frame: FramePayload | undefined, label: string): FramePayload {
  if (!frame || typeof frame.base64 !== 'string' || !frame.base64) {
    throw new Error(`${label} is required (expected { mime, base64 })`)
  }
  const mime = typeof frame.mime === 'string' && frame.mime ? frame.mime : 'image/png'
  return { mime, base64: frame.base64 }
}

export async function generateVeoHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateVeoBody
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      res.status(400).json({ error: 'missing required field: prompt' })
      return
    }

    let startFrame: FramePayload
    let endFrame: FramePayload
    try {
      startFrame = validateFrame(body.startFrame, 'startFrame')
      endFrame = validateFrame(body.endFrame, 'endFrame')
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
      return
    }

    const aspectRatio: AspectRatio = body.aspectRatio ?? '9:16'
    const durationSeconds: Duration = body.durationSeconds ?? 8
    const negativePrompt = typeof body.negativePrompt === 'string' ? body.negativePrompt.trim() : ''

    const fullPrompt = buildFullPrompt(body)

    // Hash includes frame bytes so swapping a frame busts the cache. We hash
    // the base64 directly — sha-trim happens inside hashKey().
    const hash = hashKey({
      v: CACHE_VERSION,
      model: VEO_MODEL,
      fullPrompt,
      aspectRatio,
      durationSeconds,
      negativePrompt,
      startFrame: startFrame.base64,
      endFrame: endFrame.base64,
      ...(typeof body.variationSeed === 'number' ? { variationSeed: body.variationSeed } : {}),
    })

    const { absPath, publicUrl } = cachePath(hash, 'veo-video')
    if (await exists(absPath)) {
      console.log(`[generate-veo] cache-hit hash=${hash}`)
      res.json({ url: publicUrl, cached: true, hash })
      return
    }

    const reqId = Math.random().toString(36).slice(2, 8)
    const t0 = Date.now()
    console.log(
      `[generate-veo ${reqId}] starting model=${VEO_MODEL} aspect=${aspectRatio} duration=${durationSeconds}s`,
    )

    const ai = getClient()

    // Kick off the long-running video op. Veo 3.1 supports first+last frame
    // interpolation via `image` (first) + `lastFrame` config.
    let operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt: fullPrompt,
      image: { imageBytes: startFrame.base64, mimeType: startFrame.mime },
      config: {
        aspectRatio,
        durationSeconds,
        numberOfVideos: 1,
        ...(negativePrompt ? { negativePrompt } : {}),
        lastFrame: { imageBytes: endFrame.base64, mimeType: endFrame.mime },
        personGeneration: 'allow_all',
      } as Record<string, unknown>,
    } as Parameters<typeof ai.models.generateVideos>[0])

    // Poll. Veo typically takes 30–90s for 8s @ 9:16.
    const MAX_WAIT_MS = 5 * 60 * 1000
    const POLL_INTERVAL_MS = 8000
    const deadline = Date.now() + MAX_WAIT_MS
    while (!operation.done) {
      if (Date.now() > deadline) throw new Error('veo generation timed out after 5 minutes')
      await sleep(POLL_INTERVAL_MS)
      operation = await ai.operations.getVideosOperation({ operation })
      console.log(`[generate-veo ${reqId}] poll done=${operation.done} elapsed=${Date.now() - t0}ms`)
    }

    const generated = operation.response?.generatedVideos?.[0]
    const videoFile = generated?.video
    if (!videoFile) {
      throw new Error('veo returned no video (safety block or empty response)')
    }

    // Download the mp4 by fetching the file URI with the API key appended —
    // Gemini's video files API serves the bytes from a signed-style URL that
    // accepts the standard `key=` query param.
    const uri = (videoFile as { uri?: string }).uri
    if (!uri) throw new Error('veo video file missing uri')
    const sep = uri.includes('?') ? '&' : '?'
    const dlRes = await fetch(`${uri}${sep}key=${process.env.GEMINI_API_KEY}`)
    if (!dlRes.ok) throw new Error(`video download failed: HTTP ${dlRes.status}`)
    const videoBuffer = Buffer.from(await dlRes.arrayBuffer())

    await writeVideo(absPath, videoBuffer)
    const total = Date.now() - t0
    console.log(`[generate-veo ${reqId}] complete bytes=${videoBuffer.length} total=${total}ms hash=${hash}`)

    res.json({ url: publicUrl, cached: false, hash })
  } catch (err) {
    console.error('[generate-veo]', err)
    const message = err instanceof Error ? err.message : 'veo generation failed'
    res.status(500).json({ error: message })
  }
}
