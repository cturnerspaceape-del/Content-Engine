import type { ContentPillar } from '../../types'

export interface CarouselArcSeed {
  arcId: string
  pillar: ContentPillar
  subcategory: string
}

// Seed pool mirrors the nine carousel arcs from src/data/carouselArcs.ts.
// arcId is the source of truth for slide structure; pillar + subcategory
// drive caption/hashtag pools via the IG generator.
export const CAROUSEL_ARC_SEEDS: readonly CarouselArcSeed[] = [
  { arcId: 'drop-story', pillar: 'Product Centric', subcategory: 'New Drop Reveal' },
  { arcId: 'flavor-breakdown', pillar: 'Education', subcategory: 'Flavor Breakdown' },
  { arcId: 'day-in-the-life', pillar: 'Lifestyle', subcategory: 'Cultural Moment' },
  { arcId: 'before-after', pillar: 'Entertainment', subcategory: 'Hot Take' },
  { arcId: 'product-features', pillar: 'Product Centric', subcategory: 'Feature Tour' },
  { arcId: 'strain-mood-board', pillar: 'Brand Building', subcategory: 'Founder Story' },
  { arcId: 'campaign-teaser', pillar: 'Product Centric', subcategory: 'Campaign Teaser' },
  { arcId: 'day-to-night', pillar: 'Lifestyle', subcategory: 'Day to Night' },
  { arcId: 'full-story-arc', pillar: 'Brand Building', subcategory: 'Full Story' },
] as const

export function formatCarouselSeedTitle(prefix: string, seed: CarouselArcSeed): string {
  return `${prefix} — ${seed.pillar}: ${seed.subcategory}`
}

export function carouselSeedTitles(prefix: string): string[] {
  return CAROUSEL_ARC_SEEDS.map((s) => formatCarouselSeedTitle(prefix, s))
}

export function findCarouselSeedIdxFromTitle(prefix: string, title: string): number {
  const titles = carouselSeedTitles(prefix)
  const idx = titles.findIndex((t) => title.startsWith(t))
  return idx >= 0 ? idx : 0
}

export function pickDifferentCarouselSeedIdx(current: number): number {
  if (CAROUSEL_ARC_SEEDS.length <= 1) return 0
  let next = Math.floor(Math.random() * CAROUSEL_ARC_SEEDS.length)
  while (next === current) next = Math.floor(Math.random() * CAROUSEL_ARC_SEEDS.length)
  return next
}
