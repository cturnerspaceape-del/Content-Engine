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
}

export interface ResearchResult {
  recommendation: ResearchedSeed
  candidates: ResearchedSeed[]
  fetchedAt: number
}
