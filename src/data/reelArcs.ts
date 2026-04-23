import type { ContentPillar } from '../types'

export type ReelDuration = 5 | 8 | 10 | 12

export interface ReelArc {
  id: string
  name: string
  pillarAffinity: ContentPillar[]
  durationSeconds: ReelDuration
  beat: string // one-line narrative brief folded into the Veo prompt
}

export const REEL_ARCS: ReelArc[] = [
  {
    id: 'drop-teaser',
    name: 'Product Drop Teaser',
    pillarAffinity: ['Product Centric', 'Brand Building'],
    durationSeconds: 5,
    beat:
      'tight macro push-in on the closed product on a clean editorial backdrop, slow subtle rotation, bold hero reveal at the end',
  },
  {
    id: 'flavor-cinemagraph',
    name: 'Flavor Vibe Cinemagraph',
    pillarAffinity: ['Product Centric', 'Brand Building', 'Lifestyle'],
    durationSeconds: 8,
    beat:
      'atmospheric still-life with product centered; one element in subtle motion — steam curl, liquid ripple, falling petal — while everything else stays calm',
  },
  {
    id: 'day-in-the-life',
    name: 'Day in the Life Moment',
    pillarAffinity: ['Lifestyle'],
    durationSeconds: 10,
    beat:
      'slice-of-life scene with the product as a natural prop — morning coffee, rooftop at golden hour, late-night desk — slow handheld drift, warm grading',
  },
  {
    id: 'cultural-cutaway',
    name: 'Cultural Cutaway',
    pillarAffinity: ['Entertainment', 'Lifestyle'],
    durationSeconds: 8,
    beat:
      'high-energy b-roll — party, street, skate, studio — product makes a natural cameo in the cut, cinematic grain, quick beats',
  },
  {
    id: 'unbox-reveal',
    name: 'Unbox Reveal',
    pillarAffinity: ['Product Centric', 'Social Proof'],
    durationSeconds: 8,
    beat:
      'overhead flat-lay on a textured surface, hands enter frame, lift product out of its packaging, set it down with confident placement',
  },
  {
    id: 'strain-mood',
    name: 'Strain Mood Ambient',
    pillarAffinity: ['Brand Building', 'Lifestyle'],
    durationSeconds: 12,
    beat:
      'abstract color-field animation in the flavor palette — smoke, silk, liquid paint — product arrives cleanly at center in the final 2 seconds',
  },
]

const BY_ID = new Map(REEL_ARCS.map((arc) => [arc.id, arc]))

export function getReelArc(id: string): ReelArc | undefined {
  return BY_ID.get(id)
}

export function pickReelArc(pillar: string): ReelArc {
  const preferred = REEL_ARCS.filter((arc) =>
    arc.pillarAffinity.includes(pillar as ContentPillar),
  )
  const pool = preferred.length > 0 ? preferred : REEL_ARCS
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Rough cost estimate at the current default rate ($0.40/sec for Veo 3 Fast). */
export function estimateReelCost(durationSeconds: number): string {
  return `$${(durationSeconds * 0.4).toFixed(2)}`
}
