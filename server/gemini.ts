import { GoogleGenAI } from '@google/genai'

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (client) return client
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  client = new GoogleGenAI({ apiKey })
  return client
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded)\b/i.test(msg)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// Cap concurrent Gemini image calls so burst clicks don't trigger rate-limit cascades.
// Acquire before the retry loop; release in the outer finally so retries hold the slot.
const MAX_CONCURRENT = Number(process.env.GEMINI_IMAGE_CONCURRENCY ?? '2')
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

export async function generateImage({ prompt, references }: GenerateImageInput): Promise<Buffer> {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'
  const temperature = Number(process.env.GEMINI_IMAGE_TEMPERATURE ?? '0.7')
  const ai = getClient()

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
    ...references.map((ref) => ({
      inlineData: { mimeType: ref.mime, data: ref.base64 },
    })),
  ]

  await acquire()
  try {
    const maxAttempts = 5
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: { temperature },
        })
        lastErr = null
        break
      } catch (err) {
        lastErr = err
        if (!isRetryableError(err) || attempt === maxAttempts) throw err
        const backoff = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500)
        const snippet = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
        console.warn(
          `[gemini.generateImage] retry ${attempt}/${maxAttempts - 1} in ${Math.round(backoff / 1000)}s: ${snippet}`,
        )
        await sleep(backoff)
      }
    }
    if (!response) throw lastErr ?? new Error('Gemini call failed with no response')

    const candidates = response.candidates ?? []
    for (const candidate of candidates) {
      const candidateParts = candidate.content?.parts ?? []
      for (const part of candidateParts) {
        const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData
        if (inline?.data) {
          return Buffer.from(inline.data, 'base64')
        }
      }
    }

    const feedback = (response as { promptFeedback?: { blockReason?: string; blockReasonMessage?: string } })
      .promptFeedback
    if (feedback?.blockReason) {
      const extra = feedback.blockReasonMessage ? ` - ${feedback.blockReasonMessage}` : ''
      throw new Error(`Gemini blocked prompt: ${feedback.blockReason}${extra}`)
    }
    const finishReason = candidates[0]?.finishReason
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`Gemini returned no image (finishReason: ${finishReason})`)
    }
    throw new Error('Gemini response contained no image data')
  } finally {
    release()
  }
}
