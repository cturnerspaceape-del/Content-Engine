import {
  VIBES,
  PALETTES,
  COMPOSITIONS,
  MOODS,
  type Vibe,
  type Palette,
  type Composition,
  type Mood,
} from '../src/data/shotTemplates'

export interface AestheticTags {
  vibe: Vibe
  palette: Palette
  composition: Composition
  mood: Mood
  subjectMotifs: string[]
}

export function aestheticTagsSchemaBlock(): string {
  return `  "vibe":        one of [${VIBES.join(', ')}],
  "palette":     one of [${PALETTES.join(', ')}],
  "composition": one of [${COMPOSITIONS.join(', ')}],
  "mood":        one of [${MOODS.join(', ')}],
  "subjectMotifs": array of up to 5 short lowercase noun phrases describing distinctive subjects (e.g. "marble", "liquid splash", "neon sign", "smoke"). May be an empty array.`
}

export function validateAestheticTags(parsed: unknown): AestheticTags | null {
  if (!parsed || typeof parsed !== 'object') return null
  const p = parsed as Record<string, unknown>
  const vibe = p.vibe as Vibe
  const palette = p.palette as Palette
  const composition = p.composition as Composition
  const mood = p.mood as Mood
  const motifs = Array.isArray(p.subjectMotifs)
    ? (p.subjectMotifs as unknown[])
        .filter((x): x is string => typeof x === 'string')
        .slice(0, 5)
        .map((s) => s.toLowerCase().trim())
        .filter(Boolean)
    : []

  if (!(VIBES as readonly string[]).includes(vibe)) return null
  if (!(PALETTES as readonly string[]).includes(palette)) return null
  if (!(COMPOSITIONS as readonly string[]).includes(composition)) return null
  if (!(MOODS as readonly string[]).includes(mood)) return null
  return { vibe, palette, composition, mood, subjectMotifs: motifs }
}

export function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
}
