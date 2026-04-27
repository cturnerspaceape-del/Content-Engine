import type { ContentPillar } from '../../types'

export interface PillarImageSeed {
  pillar: ContentPillar
  subcategory: string
}

export const PILLAR_IMAGE_SEEDS: readonly PillarImageSeed[] = [
  { pillar: 'Lifestyle', subcategory: 'Cultural Moment' },
  { pillar: 'Product Centric', subcategory: 'New Drop Reveal' },
  { pillar: 'Education', subcategory: 'Flavor Breakdown' },
  { pillar: 'Entertainment', subcategory: 'Hot Take' },
  { pillar: 'Brand Building', subcategory: 'Founder Story' },
  { pillar: 'Social Proof', subcategory: 'First Timer Reaction' },
] as const

export function formatPillarSeedTitle(prefix: string, seed: PillarImageSeed): string {
  return `${prefix} — ${seed.pillar}: ${seed.subcategory}`
}

export function pillarSeedTitles(prefix: string): string[] {
  return PILLAR_IMAGE_SEEDS.map((s) => formatPillarSeedTitle(prefix, s))
}

export function findPillarSeedIdxFromTitle(prefix: string, title: string): number {
  const titles = pillarSeedTitles(prefix)
  const idx = titles.findIndex((t) => title.startsWith(t))
  return idx >= 0 ? idx : 0
}

export function pickDifferentPillarSeedIdx(current: number): number {
  if (PILLAR_IMAGE_SEEDS.length <= 1) return 0
  let next = Math.floor(Math.random() * PILLAR_IMAGE_SEEDS.length)
  while (next === current) next = Math.floor(Math.random() * PILLAR_IMAGE_SEEDS.length)
  return next
}
