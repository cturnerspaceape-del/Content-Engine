import type { ContentPillar } from '../../types'

export interface ReelArcSeed {
  arcId: string
  pillar: ContentPillar
  subcategory: string
}

export const REEL_ARC_SEEDS: readonly ReelArcSeed[] = [
  { arcId: 'drop-teaser', pillar: 'Product Centric', subcategory: 'New Drop Reveal' },
  { arcId: 'flavor-cinemagraph', pillar: 'Product Centric', subcategory: 'Flavor Moment' },
  { arcId: 'day-in-the-life', pillar: 'Lifestyle', subcategory: 'Cultural Moment' },
  { arcId: 'cultural-cutaway', pillar: 'Entertainment', subcategory: 'Hot Take' },
  { arcId: 'unbox-reveal', pillar: 'Product Centric', subcategory: 'Unbox Reveal' },
  { arcId: 'strain-mood', pillar: 'Brand Building', subcategory: 'Founder Story' },
] as const

export function formatReelSeedTitle(prefix: string, seed: ReelArcSeed): string {
  return `${prefix} — ${seed.pillar}: ${seed.subcategory}`
}

export function reelSeedTitles(prefix: string): string[] {
  return REEL_ARC_SEEDS.map((s) => formatReelSeedTitle(prefix, s))
}

export function findReelSeedIdxFromTitle(prefix: string, title: string): number {
  const titles = reelSeedTitles(prefix)
  const idx = titles.findIndex((t) => title.startsWith(t))
  return idx >= 0 ? idx : 0
}

export function pickDifferentReelSeedIdx(current: number): number {
  if (REEL_ARC_SEEDS.length <= 1) return 0
  let next = Math.floor(Math.random() * REEL_ARC_SEEDS.length)
  while (next === current) next = Math.floor(Math.random() * REEL_ARC_SEEDS.length)
  return next
}
