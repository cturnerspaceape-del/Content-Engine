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

export const PRODUCT_KINDS = ['device', 'packaging', 'both', 'none'] as const
export type ProductKind = (typeof PRODUCT_KINDS)[number]

export interface AestheticTags {
  vibe: Vibe
  palette: Palette
  composition: Composition
  mood: Mood
  subjectMotifs: string[]
  containsProduct: boolean
  productKind: ProductKind
}

export function aestheticTagsSchemaBlock(): string {
  return `  "vibe":        one of [${VIBES.join(', ')}],
  "palette":     one of [${PALETTES.join(', ')}],
  "composition": one of [${COMPOSITIONS.join(', ')}],
  "mood":        one of [${MOODS.join(', ')}],
  "subjectMotifs": array of up to 5 short lowercase noun phrases describing distinctive subjects (e.g. "marble", "liquid splash", "neon sign", "smoke"). May be an empty array.
  "containsProduct": boolean. true ONLY if the image clearly shows a Space Ape vape device (sleek 2g/4g cylindrical/rectangular pen with branding) or its branded packaging/box. false for moodboard / aesthetic / lifestyle imagery without a real Space Ape product visible.
  "productKind": one of [${PRODUCT_KINDS.join(', ')}]. "device" if only a vape device is visible, "packaging" if only a box/packaging, "both" if both are visible, "none" if neither (must be "none" when containsProduct=false).`
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
  const containsProduct = typeof p.containsProduct === 'boolean' ? p.containsProduct : false
  const rawKind = typeof p.productKind === 'string' ? p.productKind : 'none'
  const productKind: ProductKind = (PRODUCT_KINDS as readonly string[]).includes(rawKind)
    ? (rawKind as ProductKind)
    : 'none'
  // Coherence: if no product, force productKind to 'none'.
  const finalKind = containsProduct ? productKind : 'none'

  if (!(VIBES as readonly string[]).includes(vibe)) return null
  if (!(PALETTES as readonly string[]).includes(palette)) return null
  if (!(COMPOSITIONS as readonly string[]).includes(composition)) return null
  if (!(MOODS as readonly string[]).includes(mood)) return null
  return {
    vibe,
    palette,
    composition,
    mood,
    subjectMotifs: motifs,
    containsProduct,
    productKind: finalKind,
  }
}

export function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
}
