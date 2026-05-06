// Adapters that turn a ResearchedSeed into the seed shapes each lab already
// expects. Lets the Research button drop into the existing flow with no
// changes to PlatformPicker / Generate / ContentCard.

import type { PillarImageSeed } from '../seeds/pillarImage'
import type { CarouselArcSeed } from '../seeds/carouselArc'
import { TEXT_ARCHETYPES, type TextArchetype } from '../seeds/textArchetype'
import { CAROUSEL_ARCS } from '../../data/carouselArcs'
import type { EmailType } from '../email/types'
import type { ResearchedSeed } from './types'

export function toPillarImageSeed(rs: ResearchedSeed): PillarImageSeed {
  return { pillar: rs.pillar, subcategory: rs.subcategory }
}

// Build a carousel seed from a ResearchedSeed. When the seed carries a
// per-slide `slides` array, that defines the arc — both length and content
// come from research. Otherwise fall back to picking a static arc by
// pillar affinity (legacy path, kept as defensive default).
export function toCarouselArcSeed(rs: ResearchedSeed): CarouselArcSeed {
  if (rs.slides && rs.slides.length >= 2) {
    return {
      arcId: 'research-driven',
      pillar: rs.pillar,
      subcategory: rs.subcategory,
      slides: rs.slides,
    }
  }
  const matching = CAROUSEL_ARCS.find((a) => a.pillarAffinity.includes(rs.pillar))
  const arcId = matching?.id ?? CAROUSEL_ARCS[0].id
  return { arcId, pillar: rs.pillar, subcategory: rs.subcategory }
}

// Map a free-text subcategory onto the closed TEXT_ARCHETYPES enum. Looks
// for the archetype name as a substring (case-insensitive); falls back to
// 'Hot Take' so Generate always has a working source.
export function toTextArchetype(rs: ResearchedSeed): TextArchetype {
  const haystack = `${rs.subcategory} ${rs.angle}`.toLowerCase()
  for (const a of TEXT_ARCHETYPES) {
    if (haystack.includes(a.toLowerCase())) return a
  }
  // Light heuristic mapping for non-literal matches
  if (/announce|drop|launch|restock|release/.test(haystack)) return 'Drop Announce'
  if (/\?|question|ask/.test(haystack)) return 'Question'
  if (/shoutout|thanks|thank you|appreciation/.test(haystack)) return 'Shoutout'
  if (/meme|joke|punchline/.test(haystack)) return 'Meme Line'
  if (/hook|grab|attention/.test(haystack)) return 'Hook'
  return 'Hot Take'
}

// Map a researched seed to one of the existing email types. Heuristic match
// on subcategory + angle. Defaults to 'newsletter'.
export function toEmailType(rs: ResearchedSeed): EmailType {
  const haystack = `${rs.subcategory} ${rs.angle}`.toLowerCase()
  if (/welcome|first|onboard/.test(haystack)) return 'welcome'
  if (/educat|teach|explain|how it works/.test(haystack)) return 'education'
  if (/restock|reorder|replenish|back in stock/.test(haystack)) return 'replenishment'
  if (/promo|sale|discount|drop|launch|offer/.test(haystack)) return 'promo'
  if (/win.?back|reengage|come back|miss you/.test(haystack)) return 'reengagement'
  return 'newsletter'
}
