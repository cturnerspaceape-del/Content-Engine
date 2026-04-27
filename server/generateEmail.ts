import type { Request, Response } from 'express'
import { promises as fs } from 'node:fs'
import { GoogleGenAI } from '@google/genai'
import { cachePath, exists, hashKey } from './cache'
import { buildEmailPrompt } from './emailPrompt'

interface GenerateEmailBody {
  emailType: string
  emailTypeLabel: string
  emailTypeIntent: string
  audience: 'existing' | 'inactive'
  audienceLabel: string
  audienceTone: string
  audienceCtaStyle: string
  defaultSections: string[]
  flavorHint?: string
  campaignNote?: string
  variationSeed?: number
}

const CACHE_VERSION = 1

let textClient: GoogleGenAI | null = null
function getClient(): GoogleGenAI {
  if (textClient) return textClient
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  textClient = new GoogleGenAI({ apiKey })
  return textClient
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded)\b/i.test(msg)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function extractJson(raw: string): unknown {
  // Strip ```json fences if Gemini ignores the no-fence rule.
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  const body = fenced ? fenced[1] : trimmed
  return JSON.parse(body)
}

function normalizeEmail(parsed: unknown, defaultSections: string[]): {
  subject: string
  preheader: string
  sections: Array<{ id: string; kind: string; data: Record<string, unknown> }>
} {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Email JSON is not an object')
  }
  const obj = parsed as Record<string, unknown>
  const subject = typeof obj.subject === 'string' ? obj.subject : ''
  const preheader = typeof obj.preheader === 'string' ? obj.preheader : ''
  const rawSections = Array.isArray(obj.sections) ? obj.sections : []
  const allowed = new Set(defaultSections)
  const sections = rawSections
    .filter(
      (s): s is { kind: string; data: unknown } =>
        s != null &&
        typeof s === 'object' &&
        typeof (s as { kind?: unknown }).kind === 'string',
    )
    .filter((s) => allowed.has(s.kind))
    .map((s, idx) => ({
      id: `${s.kind}-${idx}`,
      kind: s.kind,
      data: (s.data && typeof s.data === 'object' ? s.data : {}) as Record<string, unknown>,
    }))
  return { subject, preheader, sections }
}

export async function generateEmailHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateEmailBody
    const {
      emailType,
      emailTypeLabel,
      emailTypeIntent,
      audience,
      audienceLabel,
      audienceTone,
      audienceCtaStyle,
      defaultSections,
      flavorHint,
      campaignNote,
      variationSeed,
    } = body

    if (
      !emailType ||
      !emailTypeLabel ||
      !audience ||
      !audienceLabel ||
      !Array.isArray(defaultSections) ||
      defaultSections.length === 0
    ) {
      res.status(400).json({
        error:
          'missing required fields: emailType, emailTypeLabel, audience, audienceLabel, defaultSections',
      })
      return
    }

    const hash = hashKey({
      v: CACHE_VERSION,
      emailType,
      audience,
      defaultSections: [...defaultSections].sort(),
      flavorHint: flavorHint ?? null,
      campaignNote: campaignNote ?? null,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath } = cachePath(hash, 'email-json')

    if (await exists(absPath)) {
      const raw = await fs.readFile(absPath, 'utf8')
      res.json({ cached: true, hash, email: JSON.parse(raw) })
      return
    }

    const prompt = buildEmailPrompt({
      emailType,
      emailTypeLabel,
      emailTypeIntent: emailTypeIntent ?? '',
      audience,
      audienceLabel,
      audienceTone: audienceTone ?? '',
      audienceCtaStyle: audienceCtaStyle ?? '',
      defaultSections,
      flavorHint,
      campaignNote,
    })

    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
    const ai = getClient()

    const maxAttempts = 4
    let textOut: string | null = null
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.85,
            responseMimeType: 'application/json',
          },
        })
        const candidates = response.candidates ?? []
        const parts = candidates[0]?.content?.parts ?? []
        const textPart = parts.find(
          (p): p is { text: string } => typeof (p as { text?: unknown }).text === 'string',
        )
        textOut = textPart?.text ?? null
        if (!textOut) throw new Error('Gemini returned no text content for email JSON')
        break
      } catch (err) {
        lastErr = err
        if (!isRetryableError(err) || attempt === maxAttempts) throw err
        const backoff = 800 * Math.pow(2, attempt) + Math.floor(Math.random() * 400)
        const snippet = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
        console.warn(
          `[generate-email] retry ${attempt}/${maxAttempts - 1} in ${Math.round(backoff / 1000)}s: ${snippet}`,
        )
        await sleep(backoff)
      }
    }
    if (!textOut) throw lastErr ?? new Error('Email generation failed with no response')

    const parsed = extractJson(textOut)
    const email = normalizeEmail(parsed, defaultSections)

    if (!email.subject || email.sections.length === 0) {
      throw new Error('Gemini returned an empty or invalid email')
    }

    // Persist alongside images so reloads + audience flips can re-hydrate.
    const dir = absPath.replace(/[^/\\]+$/, '')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(absPath, JSON.stringify(email, null, 2), 'utf8')

    res.json({ cached: false, hash, email })
  } catch (err) {
    console.error('[generate-email]', err)
    const message = err instanceof Error ? err.message : 'email generation failed'
    res.status(500).json({ error: message })
  }
}
