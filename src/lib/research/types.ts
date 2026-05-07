import type { ContentPillar } from '../../types'

export type ResearchFormat = 'image' | 'carousel' | 'text' | 'email' | 'print'

export interface ResearchedSeed {
  pillar: ContentPillar
  subcategory: string
  // 1-2 sentence creative direction. Fed to /api/generate-caption so the LLM
  // anchors copy to this angle instead of falling back to its template defaults.
  angle: string
  sourceBrands: string[]
  // Raw observation Claude pulled from web_search. Kept verbatim so users can
  // see *why* this angle was recommended.
  sourceNotes: string
  // Page URLs (≤3) Claude saw in its web_search results. Server resolves
  // these to og:image at generation time so the image model gets actual
  // trend imagery instead of the default local moodboard.
  sourceUrls?: string[]
  // Direct image URLs (≤3) Claude lifted from search results — used first
  // because no HTML resolution hop is needed.
  sourceImageUrls?: string[]
  // Executable photo direction — 1-3 short lines covering scene / framing /
  // lighting / camera / styling. When present, this REPLACES the generic
  // shot template in the image prompt's SHOT BRIEF section so the trend's
  // visual treatment dominates the brand's default moodboard. Only seeded
  // for visual formats (image, carousel, print).
  shotBrief?: string
  // Carousel-only: per-slide visual briefs (length 2-7). When present, the
  // selected ResearchedSeed defines both the carousel's slide count and what
  // each slide visually depicts — supersedes the static carouselArcs.ts
  // template lookup.
  slides?: { brief: string }[]
}

export interface ResearchResult {
  recommendation: ResearchedSeed
  candidates: ResearchedSeed[]
  fetchedAt: number
}
