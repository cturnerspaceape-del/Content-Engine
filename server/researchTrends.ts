import type { Request, Response } from 'express'
import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { RELATED_BRANDS } from '../src/config/relatedBrands'
import type { ResearchedSeed, ResearchResult, ResearchFormat } from '../src/lib/research/types'

const MODEL = process.env.ANTHROPIC_RESEARCH_MODEL || 'claude-sonnet-4-6'
const FORMATS: readonly ResearchFormat[] = ['image', 'carousel', 'text', 'email', 'print'] as const
const ALLOWED_PILLARS = [
  'Lifestyle',
  'Product Centric',
  'Education',
  'Entertainment',
  'Brand Building',
  'Social Proof',
] as const

const FORMAT_HINTS: Record<ResearchFormat, string> = {
  image:
    'A single Instagram still post. Look for visual moments, drop reveals, mood-board energy, sticker-pop product shots.',
  carousel:
    'A multi-slide Instagram carousel arc. Look for storytelling sequences, before/after reveals, day-in-the-life formats, build-up posts.',
  text:
    'A short text post for X/Threads — no image. Look for hot takes, drop announcements, group-chat one-liners, hooks, founder voice.',
  email:
    'A lifecycle marketing email — subject + sections. Look for newsletter formats, drop announcements, restock alerts, founder notes.',
  print:
    'Physical print collateral — poster, brochure, sticker. Look for retail/IRL activations, lookbook drops, sticker-pop visual treatments.',
}

interface ScopeArgs {
  emailType?: string
  historicalContext?: string
}

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  client = new Anthropic({ apiKey })
  return client
}

// In-memory cache keyed by format + scope + UTC day bucket. Research signal
// is fresh at the day granularity. Email research is scoped by email type +
// the brand's historical-context hash so a 'promo' run and a 'newsletter'
// run don't collide, and changing past-sends history busts the cache.
type CacheEntry = { day: string; result: ResearchResult }
const cache = new Map<string, CacheEntry>()

function dayBucket(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10) // YYYY-MM-DD UTC
}

function cacheKey(format: ResearchFormat, scope: ScopeArgs): string {
  const histHash = scope.historicalContext
    ? createHash('sha256').update(scope.historicalContext).digest('hex').slice(0, 8)
    : ''
  return `${format}|${scope.emailType ?? ''}|${histHash}`
}

function isResearchFormat(s: unknown): s is ResearchFormat {
  return typeof s === 'string' && (FORMATS as readonly string[]).includes(s)
}

function buildPrompt(format: ResearchFormat, scope: ScopeArgs): string {
  const brandList = RELATED_BRANDS.map((b) => `- ${b.handle} (${b.why})`).join('\n')

  const formatLine =
    format === 'email' && scope.emailType
      ? `Format being planned: ${format} (specifically a **${scope.emailType}** email — scope your research to what's working for ${scope.emailType} emails specifically; do not return ideas that fit a different email type) — ${FORMAT_HINTS[format]}`
      : `Format being planned: ${format} — ${FORMAT_HINTS[format]}`

  const historyBlock = scope.historicalContext
    ? `\n\nPast sends from this brand (style/voice anchor — match the brand's existing flavor, do not repeat the same angle they've already shipped):\n${scope.historicalContext}`
    : ''

  return `You're researching trend signals for Space Ape, an ultra-premium cannabis live-resin vape brand. Their voice is "cool Charlie Sheen" — confident, fun, cosmic, sticker-pop. Founder admires these brands as creative references:

${brandList}

Your job: use web_search to find what these brands have actually been doing in the last 14 days — drops, campaigns, copywriting moves, visual treatments, social activations, collabs. Focus on signal that translates into a content idea Space Ape could remix.

${formatLine}${historyBlock}

Output exactly 3 trend-driven content seeds Space Ape could ship next week, ordered with the strongest first. The first seed is your top recommendation.

Each seed must map onto Space Ape's existing content pillar taxonomy. Pillar MUST be exactly one of: Lifestyle, Product Centric, Education, Entertainment, Brand Building, Social Proof. Subcategory is a short noun phrase (3-6 words) describing the angle (e.g. "Drop Hype Snippet", "Day-to-Night Edit", "Founder Hot Take").

Return ONLY a JSON object with this exact shape (no markdown fences, no commentary):

{
  "seeds": [
    {
      "pillar": "<one of the allowed pillars>",
      "subcategory": "<short noun phrase>",
      "angle": "<1-2 sentences telling Space Ape's caption writer how to frame the post>",
      "sourceBrands": ["<which admired brand inspired this — pick from the list above, can be multiple>"],
      "sourceNotes": "<short observation from web_search: what the brand actually did, with a date or campaign name where possible>"
    }
  ]
}`
}

interface RawSeed {
  pillar?: unknown
  subcategory?: unknown
  angle?: unknown
  sourceBrands?: unknown
  sourceNotes?: unknown
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  const body = fenced ? fenced[1] : trimmed
  const first = body.indexOf('{')
  const last = body.lastIndexOf('}')
  const sliced = first >= 0 && last > first ? body.slice(first, last + 1) : body
  return JSON.parse(sliced)
}

function normalizeSeed(raw: RawSeed): ResearchedSeed | null {
  const pillarRaw = typeof raw.pillar === 'string' ? raw.pillar.trim() : ''
  const pillar = (ALLOWED_PILLARS as readonly string[]).includes(pillarRaw)
    ? (pillarRaw as ResearchedSeed['pillar'])
    : null
  const subcategory = typeof raw.subcategory === 'string' ? raw.subcategory.trim() : ''
  const angle = typeof raw.angle === 'string' ? raw.angle.trim() : ''
  const sourceNotes = typeof raw.sourceNotes === 'string' ? raw.sourceNotes.trim() : ''
  const sourceBrandsRaw = Array.isArray(raw.sourceBrands) ? raw.sourceBrands : []
  const sourceBrands = sourceBrandsRaw
    .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
    .map((b) => b.trim())

  if (!pillar || !subcategory || !angle) return null
  return { pillar, subcategory, angle, sourceBrands, sourceNotes }
}

async function callAnthropic(format: ResearchFormat, scope: ScopeArgs): Promise<ResearchResult> {
  const ai = getClient()
  const resp = await ai.messages.create({
    model: MODEL,
    max_tokens: 4000,
    temperature: 0.7,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 6,
      },
    ],
    messages: [{ role: 'user', content: buildPrompt(format, scope) }],
  })

  // Final text block holds the JSON. Earlier blocks may be tool_use /
  // tool_result for the web_search calls — we only care about the last text.
  const textBlocks = resp.content.filter((c): c is Anthropic.TextBlock => c.type === 'text')
  const last = textBlocks[textBlocks.length - 1]
  if (!last) throw new Error('Anthropic returned no text content')

  const parsed = extractJson(last.text) as { seeds?: unknown }
  const seedsRaw = Array.isArray(parsed.seeds) ? parsed.seeds : []
  const seeds = seedsRaw
    .map((s) => normalizeSeed(s as RawSeed))
    .filter((s): s is ResearchedSeed => s !== null)

  if (seeds.length === 0) throw new Error('research returned no usable seeds')

  return {
    recommendation: seeds[0],
    candidates: seeds.slice(1),
    fetchedAt: Date.now(),
  }
}

export async function researchTrendsHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as {
      format?: unknown
      emailType?: unknown
      historicalContext?: unknown
    }
    if (!isResearchFormat(body.format)) {
      res.status(400).json({ error: `format must be one of ${FORMATS.join(', ')}` })
      return
    }
    const format = body.format
    const scope: ScopeArgs = {
      emailType: typeof body.emailType === 'string' ? body.emailType : undefined,
      historicalContext:
        typeof body.historicalContext === 'string' && body.historicalContext.trim().length > 0
          ? body.historicalContext
          : undefined,
    }
    const today = dayBucket()
    const key = cacheKey(format, scope)
    const cached = cache.get(key)
    if (cached && cached.day === today) {
      res.json({ ...cached.result, cached: true })
      return
    }
    const result = await callAnthropic(format, scope)
    cache.set(key, { day: today, result })
    res.json(result)
  } catch (err) {
    console.error('[research-trends]', err)
    const message = err instanceof Error ? err.message : 'research failed'
    res.status(500).json({ error: message })
  }
}
