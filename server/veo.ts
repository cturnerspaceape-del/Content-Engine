import { GoogleGenAI, type GenerateVideosOperation } from '@google/genai'

let client: GoogleGenAI | null = null
let cachedApiKey: string | null = null

function getClient(): { ai: GoogleGenAI; apiKey: string } {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  if (client && cachedApiKey === apiKey) return { ai: client, apiKey }
  client = new GoogleGenAI({ apiKey })
  cachedApiKey = apiKey
  return { ai: client, apiKey }
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded)\b/i.test(msg)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// Veo jobs are heavy + expensive. Default to 1 concurrent.
const MAX_CONCURRENT = Number(process.env.VEO_CONCURRENCY ?? '1')
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

export interface GenerateVideoInput {
  prompt: string
  aspectRatio: '9:16' | '16:9' | '1:1'
  durationSeconds: number
  image?: { base64: string; mime: string }
}

const POLL_INTERVAL_MS = 10_000
const MAX_POLL_MS = 10 * 60 * 1000 // 10 minutes

export async function generateVideo({
  prompt,
  aspectRatio,
  durationSeconds,
  image,
}: GenerateVideoInput): Promise<Buffer> {
  const model = process.env.VEO_VIDEO_MODEL || 'veo-3.0-fast-generate-preview'
  const { ai, apiKey } = getClient()

  await acquire()
  try {
    const maxAttempts = 3
    let operation: GenerateVideosOperation | null = null
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        operation = await ai.models.generateVideos({
          model,
          prompt,
          ...(image ? { image: { imageBytes: image.base64, mimeType: image.mime } } : {}),
          config: {
            aspectRatio,
            durationSeconds,
            numberOfVideos: 1,
          },
        })
        lastErr = null
        break
      } catch (err) {
        lastErr = err
        if (!isRetryableError(err) || attempt === maxAttempts) throw err
        const backoff = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500)
        const snippet = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
        console.warn(
          `[veo.generateVideo] retry ${attempt}/${maxAttempts - 1} in ${Math.round(backoff / 1000)}s: ${snippet}`,
        )
        await sleep(backoff)
      }
    }
    if (!operation) throw lastErr ?? new Error('Veo call failed with no operation')

    const startedAt = Date.now()
    while (!operation.done) {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        throw new Error(`Veo operation timed out after ${MAX_POLL_MS / 1000}s`)
      }
      await sleep(POLL_INTERVAL_MS)
      operation = await ai.operations.getVideosOperation({ operation })
    }

    if (operation.error) {
      throw new Error(`Veo operation failed: ${JSON.stringify(operation.error)}`)
    }

    const generated = operation.response?.generatedVideos?.[0]
    if (!generated?.video) {
      const raiReasons = operation.response?.raiMediaFilteredReasons
      if (raiReasons && raiReasons.length > 0) {
        throw new Error(`Veo filtered the output: ${raiReasons.join('; ')}`)
      }
      throw new Error('Veo response missing video')
    }

    if (generated.video.videoBytes) {
      return Buffer.from(generated.video.videoBytes, 'base64')
    }
    if (generated.video.uri) {
      const url = new URL(generated.video.uri)
      if (!url.searchParams.has('key')) url.searchParams.set('key', apiKey)
      const resp = await fetch(url.toString())
      if (!resp.ok) {
        throw new Error(`Veo video download failed: HTTP ${resp.status}`)
      }
      return Buffer.from(await resp.arrayBuffer())
    }
    throw new Error('Veo response has neither videoBytes nor uri')
  } finally {
    release()
  }
}
