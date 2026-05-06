import type { Request, Response } from 'express'
import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { RELATED_BRANDS } from '../src/config/relatedBrands'
import type { ResearchedSeed, ResearchResult, ResearchFormat } from '../src/lib/research/types'

const MODEL = process.env.ANTHROPIC_RESEARCH_MODEL || 'claude-sonnet-4-6'
const FORMATS: readonly ResearchFormat[] = ['image', 'carousel', 'reel', 'text', 'email', 'print'] as const
const ALLOWED_PILLARS = [
  'Lifestyle',
  'Product Centric',
  'Education',
  'Entertainment',
  'Brand Building',
  'Social Proof',
] as const

// Per-lab playbook the researcher uses to scope ideas to what actually wins
// on each surface. Each entry is a multi-line directive injected as
// `FORMAT PLAYBOOK:` in the prompt — Composition / Voice / Structure /
// Winning patterns. The seeds returned must read like they were written for
// THAT surface specifically (a carousel idea references slide arcs, a reel
// idea references hook frames, etc).
const FORMAT_PLAYBOOKS: Record<ResearchFormat, string> = {
  image: `A single Instagram still post (1:1 square).
  Composition: one hero subject, ≤30% breathing room top-right for caption space, sticker-pop or editorial flat-lay anchor.
  Voice: confident one-liner energy — group-chat dispatch, not a brochure.
  Structure: one frame does the whole job — hook + payoff in a single image.
  Winning patterns: drop reveal hero, mood-board flat-lay, sticker-pop product portrait, "future cool" still life.`,
  carousel: `A multi-slide Instagram carousel arc (2-7 slides — pick the count that best fits your angle).
  Composition: cohesive palette + lighting across slides so the set reads as one shoot; anchor product hero appears in slide 1 and the payoff slide.
  Voice: group-chat narrator — short captions per slide, build a beat.
  Structure: slide 1 = pattern interrupt / hook, middle slides = build (one beat per slide), final slide = payoff / CTA. For shorter arcs (2-3 slides), collapse into hook + payoff or hook + build + payoff.
  Winning patterns: before/after reveals, day-in-the-life arcs, drop tease build-up, "5 things" / numbered list, founder annotations on a single shoot.`,
  reel: `A short vertical Instagram/TikTok reel (9:16, 7-15s).
  Composition: 9:16 portrait, captions-on by default, hook frame designed to read in 3 seconds with zero context.
  Voice: dispatch from the future — punchy, present-tense, no setup.
  Structure: 0-3s = visual hook + on-screen text, 3-10s = beat-cut build (1-2s per cut), final beat = product / drop / CTA payoff.
  Winning patterns: lookbook intercut, sticker-pop transition, founder hot-take voiceover, behind-the-glass product reveal, "POV" framing.`,
  text: `A short text post for X / Threads — no image (≤280 chars).
  Composition: one tweet, one thought. No threads, no thread-bait.
  Voice: "cool Charlie Sheen" group-chat one-liner — confident, fun, premium without trying.
  Structure: hook + payoff in a single sentence, or setup + punchline across two short lines.
  Winning patterns: drop tease, founder hot-take, group-chat-screenshot energy, "if you know you know" reference, deadpan flex.`,
  email: `A lifecycle marketing email — subject + hero + body sections + CTA.
  Composition: subject = curiosity-gap one-liner (no emoji walls), hero image at top, 2-3 short body sections, ONE clear CTA.
  Voice: founder note — first person, conversational, not corporate.
  Structure: subject line, preview text, hero, opening one-liner, 2-3 short body beats, single CTA button.
  Winning patterns: drop announcement, restock alert, lookbook send, founder dispatch, member-first early-access tease.`,
  print: `Physical print collateral — poster, brochure panel, sticker.
  Composition: high-contrast typographic hierarchy, bleed-aware layout, IRL surface implied (retail wall, sticker pack, lookbook page).
  Voice: visuals carry — minimal copy, headline + product wordmark only.
  Structure: hero subject + headline + (optional) supporting line + drop/brand mark.
  Winning patterns: lookbook spread, sticker pack, retail signage, poster drop, holographic / die-cut effect, "future cool" IRL activation.`,
}

interface ScopeArgs {
  emailType?: string
  historicalContext?: string
  // Identity of the slot requesting research. Included in the cache key so
  // each slot on a given day gets its own LLM call rather than sharing a
  // single per-format cached payload across every Daily View slot.
  slotKey?: string
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
  return `${format}|${scope.emailType ?? ''}|${histHash}|${scope.slotKey ?? ''}`
}

function isResearchFormat(s: unknown): s is ResearchFormat {
  return typeof s === 'string' && (FORMATS as readonly string[]).includes(s)
}

function buildPrompt(format: ResearchFormat, scope: ScopeArgs): string {
  const brandList = RELATED_BRANDS.map((b) => `- ${b.handle} (${b.why})`).join('\n')

  const formatLine =
    format === 'email' && scope.emailType
      ? `Format being planned: ${format} (specifically a **${scope.emailType}** email — scope your research to what's working for ${scope.emailType} emails specifically; do not return ideas that fit a different email type).`
      : `Format being planned: ${format}.`

  const formatPlaybook = `FORMAT PLAYBOOK — best-practices scope for this surface (every seed you return must read like it was written for THIS surface specifically):\n${FORMAT_PLAYBOOKS[format]}`

  const historyBlock = scope.historicalContext
    ? `\n\nPast sends from this brand (style/voice anchor — match the brand's existing flavor, do not repeat the same angle they've already shipped):\n${scope.historicalContext}`
    : ''

  // Visual formats need an executable photo brief so the image model
  // actually executes the trend's visual treatment instead of falling back
  // to the generic Space Ape moodboard. Text/email don't need it. Reel
  // gets one too since its cover frame is generated by the image model.
  const isVisualFormat =
    format === 'image' || format === 'carousel' || format === 'print' || format === 'reel'
  const shotBriefLine = isVisualFormat
    ? `,
      "shotBrief": "<1-3 short lines describing the EXACT visual treatment the image model should execute. Be specific and executable — name the scene, framing, lighting, camera/film stock, and any styling notes. Examples: 'passport-booth headshot, harsh overhead flash, neutral-blue backdrop, ID-card cropping' or '90s disposable-cam nightlife snapshot, on-camera flash, motion blur, low-saturation greens'. Do NOT use vague mood words like 'cool' or 'editorial'. This replaces the brand's default shot template, so write it as a directive, not a description.">`
    : ''

  // Carousel only: each seed defines its own arc — both length (2-7 slides)
  // and per-slide visual content. Each brief becomes the prompt for that
  // slide's image generation, so write them as executable photo directives,
  // not as captions.
  const slidesLine = format === 'carousel'
    ? `,
      "slides": [
        { "brief": "<executable photo directive for slide 1 — scene, framing, lighting, styling. Same specificity bar as shotBrief; this drives that slide's image gen prompt directly.>" }
        // 2-7 entries total. Length is YOUR choice based on the angle: tight 3-slide arcs and longer 6-7 slide build-ups are both valid. The full set must read as one cohesive shoot — same palette, lighting register, and styling logic across slides — varying scene/subject/framing per slide to build the beat described in your structure.
      ]`
    : ''

  return `You're researching trend signals for Space Ape, an ultra-premium cannabis live-resin vape brand. Their voice is "cool Charlie Sheen" — confident, fun, cosmic, sticker-pop. Founder admires these brands as creative references:

${brandList}

Your job: use web_search to find what these brands have actually been doing in the last 14 days — drops, campaigns, copywriting moves, visual treatments, social activations, collabs. Focus on signal that translates into a content idea Space Ape could remix.

${formatLine}

${formatPlaybook}${historyBlock}

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
      "sourceNotes": "<short observation from web_search: what the brand actually did, with a date or campaign name where possible>",
      "sourceUrls": ["<page URLs from your web_search results that show this trend in action — up to 3, only include URLs you actually retrieved; omit the field if none>"],
      "sourceImageUrls": ["<direct image URLs (jpg/png/webp) from your web_search results — up to 3, only include if you actually saw them in results; omit if none. These will be downloaded as visual references for image generation, so prefer hero/lookbook/campaign shots over thumbnails>"]${shotBriefLine}${slidesLine}
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
  sourceUrls?: unknown
  sourceImageUrls?: unknown
  shotBrief?: unknown
  slides?: unknown
}

const MAX_URLS_PER_SEED = 3
const CAROUSEL_MIN_SLIDES = 2
const CAROUSEL_MAX_SLIDES = 7

function normalizeSlides(raw: unknown): { brief: string }[] | null {
  if (!Array.isArray(raw)) return null
  const out: { brief: string }[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const briefRaw = (entry as { brief?: unknown }).brief
    if (typeof briefRaw !== 'string') continue
    const brief = briefRaw.trim()
    if (!brief) continue
    out.push({ brief })
    if (out.length >= CAROUSEL_MAX_SLIDES) break
  }
  if (out.length < CAROUSEL_MIN_SLIDES) return null
  return out
}

function normalizeUrlList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const trimmed = entry.trim()
    if (!trimmed) continue
    if (!/^https?:\/\//i.test(trimmed)) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
    if (out.length >= MAX_URLS_PER_SEED) break
  }
  return out
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
  const sourceUrls = normalizeUrlList(raw.sourceUrls)
  const sourceImageUrls = normalizeUrlList(raw.sourceImageUrls)
  const shotBrief = typeof raw.shotBrief === 'string' ? raw.shotBrief.trim() : ''
  const slides = normalizeSlides(raw.slides)
  return {
    pillar,
    subcategory,
    angle,
    sourceBrands,
    sourceNotes,
    ...(sourceUrls.length > 0 ? { sourceUrls } : {}),
    ...(sourceImageUrls.length > 0 ? { sourceImageUrls } : {}),
    ...(shotBrief.length > 0 ? { shotBrief } : {}),
    ...(slides ? { slides } : {}),
  }
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
      slotKey?: unknown
      nonce?: unknown
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
      slotKey:
        typeof body.slotKey === 'string' && body.slotKey.trim().length > 0
          ? body.slotKey
          : undefined,
    }
    // nonce is the Refresh-button cache buster: when present, skip the cache
    // lookup so the user gets a fresh LLM call on demand. Result still gets
    // written back so subsequent same-slot reads (without a nonce) hit cache.
    const bypassCache = body.nonce !== undefined
    const today = dayBucket()
    const key = cacheKey(format, scope)
    if (!bypassCache) {
      const cached = cache.get(key)
      if (cached && cached.day === today) {
        res.json({ ...cached.result, cached: true })
        return
      }
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
