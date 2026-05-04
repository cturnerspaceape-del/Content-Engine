import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildCaptionMessages, safetyLint, type CaptionPlatform } from './captionVoice'
import { getProductDetails } from '../src/remotion/flavorThemes'

interface GenerateCaptionBody {
  pillar?: string
  subcategory?: string
  flavor?: string
  platform?: CaptionPlatform
  archetype?: string
  researchAngle?: string
  researchNotes?: string
}

interface CaptionResult {
  hook: string
  caption: string
  hashtags: string[]
  voiceMode: string
  cached?: boolean
}

const MODEL = process.env.ANTHROPIC_CAPTION_MODEL || 'claude-sonnet-4-6'

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  client = new Anthropic({ apiKey })
  return client
}

// 10s in-memory dedupe — coalesce duplicate concurrent regenerate clicks.
type Pending = { promise: Promise<CaptionResult>; expires: number }
const pending = new Map<string, Pending>()

function dedupeKey(b: GenerateCaptionBody): string {
  return [
    b.pillar,
    b.subcategory,
    b.flavor,
    b.platform,
    b.archetype ?? '',
    b.researchAngle ?? '',
  ].join('|')
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  const body = fenced ? fenced[1] : trimmed
  // Tolerate stray prose around the JSON object.
  const first = body.indexOf('{')
  const last = body.lastIndexOf('}')
  const sliced = first >= 0 && last > first ? body.slice(first, last + 1) : body
  return JSON.parse(sliced)
}

function normalize(parsed: unknown): { hook: string; caption: string; hashtags: string[] } {
  if (!parsed || typeof parsed !== 'object') throw new Error('caption JSON is not an object')
  const obj = parsed as Record<string, unknown>
  const hook = typeof obj.hook === 'string' ? obj.hook.trim() : ''
  const caption = typeof obj.caption === 'string' ? obj.caption.trim() : ''
  const rawTags = Array.isArray(obj.hashtags) ? obj.hashtags : []
  const hashtags = rawTags
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .slice(0, 8)
  if (!hook && !caption) throw new Error('caption JSON missing both hook and caption')
  return { hook: hook || caption, caption: caption || hook, hashtags }
}

async function callAnthropic(body: GenerateCaptionBody, retryReason?: string): Promise<CaptionResult> {
  const product = getProductDetails(body.flavor || 'Amped Apple')
  const { systemBlocks, userMessage, voiceMode } = buildCaptionMessages({
    pillar: body.pillar || 'Lifestyle',
    subcategory: body.subcategory || '',
    flavor: product.flavor,
    strainType: product.strainType,
    format: product.format,
    flavorNotes: product.flavorNotes,
    platform: body.platform || 'IG',
    archetype: body.archetype,
    researchAngle: body.researchAngle,
    researchNotes: body.researchNotes,
  })

  const userText = retryReason
    ? `${userMessage}\n\nIMPORTANT: a previous draft was rejected for: ${retryReason}. Rewrite respecting the compliance rules; do not repeat the offending phrase.`
    : userMessage

  const ai = getClient()
  const resp = await ai.messages.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0.95,
    system: systemBlocks,
    messages: [{ role: 'user', content: userText }],
  })

  const block = resp.content.find((c) => c.type === 'text')
  if (!block || block.type !== 'text') throw new Error('Anthropic returned no text content')
  const parsed = extractJson(block.text)
  const norm = normalize(parsed)

  const offending = safetyLint(`${norm.hook}\n${norm.caption}`)
  if (offending && !retryReason) {
    console.warn(`[generate-caption] safety-lint hit "${offending}" — retrying once`)
    return callAnthropic(body, `contained the phrase "${offending}"`)
  }
  if (offending) {
    throw new Error(`compliance retry still produced banned phrase: ${offending}`)
  }

  return { ...norm, voiceMode }
}

export async function generateCaptionHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateCaptionBody
    if (!body.pillar || !body.flavor || !body.platform) {
      res.status(400).json({ error: 'pillar, flavor, and platform are required' })
      return
    }

    // Coalesce identical in-flight requests for 10s.
    const key = dedupeKey(body)
    const now = Date.now()
    const existing = pending.get(key)
    if (existing && existing.expires > now) {
      const result = await existing.promise
      res.json({ ...result, cached: true })
      return
    }

    const promise = callAnthropic(body)
    pending.set(key, { promise, expires: now + 10_000 })

    try {
      const result = await promise
      res.json(result)
    } finally {
      // Remove a few seconds after settle so subsequent calls are fresh.
      setTimeout(() => {
        const cur = pending.get(key)
        if (cur && cur.promise === promise) pending.delete(key)
      }, 5_000)
    }
  } catch (err) {
    console.error('[generate-caption]', err)
    const message = err instanceof Error ? err.message : 'caption generation failed'
    res.status(500).json({ error: message })
  }
}
