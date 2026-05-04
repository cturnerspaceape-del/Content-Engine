// Curated list of admired brands the Research button mines for fresh inspo.
// Pulled from the founder questionnaire (Apr 2026) — these are the aesthetic
// and voice references Space Ape benchmarks against, not direct competitors.

export interface RelatedBrand {
  handle: string
  why: string
}

export const RELATED_BRANDS: readonly RelatedBrand[] = [
  { handle: 'Supreme', why: 'drop strategy + hype' },
  { handle: 'Scotch and Soda', why: 'voice reference' },
  { handle: 'Chomps', why: 'voice reference' },
  { handle: '@starface', why: 'aesthetic + Gen-Z tone reference' },
] as const
