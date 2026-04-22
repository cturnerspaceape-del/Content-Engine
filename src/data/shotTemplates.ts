import type { ContentPillar } from '../types'
import rawTemplates from './shotTemplates.json' with { type: 'json' }

// ─── Tag vocabularies (must match server/classifySchema.ts) ───

export const VIBES = [
  'minimal',
  'maximalist',
  'editorial',
  'playful',
  'retro',
  'surreal',
  'clinical',
  'luxe',
  'grungy',
  'dreamy',
] as const
export type Vibe = (typeof VIBES)[number]

export const PALETTES = [
  'warm',
  'cool',
  'monochrome',
  'pastel',
  'high-contrast',
  'earthy',
  'neon',
] as const
export type Palette = (typeof PALETTES)[number]

export const COMPOSITIONS = [
  'centered-hero',
  'rule-of-thirds',
  'flat-lay',
  'macro',
  'environmental',
  'abstract',
] as const
export type Composition = (typeof COMPOSITIONS)[number]

export const MOODS = [
  'calm',
  'energetic',
  'mysterious',
  'fun',
  'premium',
  'cozy',
] as const
export type Mood = (typeof MOODS)[number]

// ─── Shot template definition (v2: structured shot brief) ───

export interface TagFilter {
  vibe?: Vibe[]
  palette?: Palette[]
  composition?: Composition[]
  mood?: Mood[]
}

export interface ShotTemplate {
  id: string
  name: string
  // Structured shot brief — labeled lines rendered into the prompt.
  scene: string
  lighting: string
  camera: string
  palette: string
  post: string
  // Tag filters used to pick manifest-matching refs at generation time.
  aestheticTags: TagFilter
  brandTags: TagFilter
  // Which pillars this shot fits. Empty array = any pillar.
  pillarAffinity: ContentPillar[]
  // Subcategory matches get doubled weight in pickShotTemplate.
  subcategoryBoost?: string[]
}

// ─── Data (loaded from shotTemplates.json — edit that file, not this one) ───

export const shotTemplates: ShotTemplate[] = rawTemplates as ShotTemplate[]

// ─── Selection helpers ───

export function pickShotTemplate(pillar: string, subcategory?: string): ShotTemplate {
  if (shotTemplates.length === 0) {
    throw new Error('shotTemplates.json is empty — run `npm run derive-shots` to generate recipes.')
  }
  const candidates = shotTemplates.filter(
    (t) => t.pillarAffinity.length === 0 || (t.pillarAffinity as string[]).includes(pillar),
  )
  const pool = candidates.length > 0 ? candidates : shotTemplates

  const weights = pool.map((t) =>
    subcategory && t.subcategoryBoost?.includes(subcategory) ? 2 : 1,
  )
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export function getShotTemplate(id: string): ShotTemplate | undefined {
  return shotTemplates.find((t) => t.id === id)
}
