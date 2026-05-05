import type { FlavorTheme } from '../src/remotion/types'
import type { ShotTemplate } from '../src/data/shotTemplates'
import { extractMoodWords } from '../src/data/moodWords'

export interface SlideContext {
  index: number // 1-based
  total: number
  role: string
  brief: string
  carouselSeed: number
}

export interface BuildPromptInput {
  flavor: string
  hook: string
  caption: string
  pillar: string
  subcategory: string
  theme: FlavorTheme
  shotTemplate: ShotTemplate
  inspoRefCount: number
  brandRefCount: number
  variationSeed?: number
  slideContext?: SlideContext
  // Picked research seed (Research Lab → fetchTrends). When present, anchors
  // the visual to a specific trend signal so Gemini doesn't fall back to the
  // generic Space Ape moodboard.
  researchAngle?: string
  researchNotes?: string
  // Executable photo brief from the picked research seed. When present, it
  // REPLACES the body of the SHOT BRIEF section so the trend's specific
  // visual treatment (e.g. "passport-booth headshot") wins over the generic
  // shot template's scene/lighting/camera defaults.
  researchShotBrief?: string
}

// ─── Fixed sections ───

const BRAND_BIBLE = `Space Ape is a premium cannabis live-resin vape brand. Every image should feel like a frame from the same ongoing editorial shoot:
  - Editorial still-life energy meets playful-pop sticker energy. Think Starface / Glossier / Fenty, never a dispensary menu.
  - Glossy photoreal product rendering with subtle specular highlights. Medium-format-camera feel with fine grain.
  - The product is always the unambiguous focal point; everything else supports it.
  - Confident, youthful, high-saturation, clean.`

const HARD_CONSTRAINTS = [
  'Square 1:1 framing, 1080x1080, full bleed.',
  'NO text, NO words, NO letters, NO numbers, NO logos — except what is physically printed on the product itself.',
  'No human faces. Hands, silhouettes, and body fragments are fine when the scene calls for it.',
  'No third-party brand marks of any kind.',
  'Photoreal product; surroundings may be photoreal or illustrated as the shot brief dictates.',
]

// ─── Helpers ───

function buildReferenceKey(inspoRefCount: number, brandRefCount: number): string {
  const lines: string[] = []
  lines.push('  [1] PRODUCT HERO — this is the subject. Reproduce its shape, label, colorway, and proportions exactly. Match the reference SKU faithfully; do not stylize or redesign it.')
  if (inspoRefCount > 0) {
    const idx = inspoRefCount === 1 ? '[2]' : `[2-${1 + inspoRefCount}]`
    lines.push(`  ${idx} AESTHETIC REFS — borrow composition, lighting, palette, and mood. DO NOT reproduce their subjects. If a ref shows a different product, person, or object, ignore that content and extract only its visual language.`)
  }
  if (brandRefCount > 0) {
    const start = 2 + inspoRefCount
    const idx = brandRefCount === 1 ? `[${start}]` : `[${start}-${start + brandRefCount - 1}]`
    lines.push(`  ${idx} BRAND REFS — match the overall Space Ape visual language, finish, and identity signals. Treat these as contact sheets of prior Space Ape work, not subjects to recreate.`)
  }
  return lines.join('\n')
}

function buildShotBrief(t: ShotTemplate): string {
  return [
    `  SCENE:    ${t.scene}`,
    `  LIGHTING: ${t.lighting}`,
    `  CAMERA:   ${t.camera}`,
    `  PALETTE:  ${t.palette}`,
    `  POST:     ${t.post}`,
  ].join('\n')
}

// ─── Main export ───

export function buildPrompt({
  flavor,
  hook,
  caption,
  pillar,
  subcategory,
  theme,
  shotTemplate,
  inspoRefCount,
  brandRefCount,
  variationSeed,
  slideContext,
  researchAngle,
  researchNotes,
  researchShotBrief,
}: BuildPromptInput): string {
  const strain = theme.strainType || 'Hybrid'
  const mood = extractMoodWords(hook, caption, pillar, subcategory).join(', ')

  const sections: string[] = []

  // 1. GOAL (one line)
  sections.push(
    `GOAL: Generate a 1080x1080 Instagram post for Space Ape executing the shot brief "${shotTemplate.name}".`,
  )

  // 1b. CAROUSEL CONTEXT (only present for Carousel Lounge slides)
  if (slideContext) {
    sections.push(
      [
        `CAROUSEL CONTEXT: slide ${slideContext.index} of ${slideContext.total} in a cohesive post.`,
        `  Role: ${slideContext.role}`,
        `  Narrative beat: ${slideContext.brief}`,
        `  Maintain visual consistency with the other slides — same palette, lighting mood, and production value so the set reads as one shoot.`,
        `  Carousel anchor: ${slideContext.carouselSeed}`,
      ].join('\n'),
    )
  }

  // 2. REFERENCE KEY (front-loaded — most important thing Nano Banana needs to know)
  sections.push(`REFERENCE IMAGES ATTACHED (in order):\n${buildReferenceKey(inspoRefCount, brandRefCount)}`)

  // 3. BRAND BIBLE (identical across every call — builds cross-post consistency)
  sections.push(`BRAND BIBLE:\n${BRAND_BIBLE}`)

  // 4. TREND CONTEXT (picked research seed). Now placed BEFORE the shot
  // brief so the angle frames the brief instead of trailing it.
  if (researchAngle && researchAngle.trim().length > 0) {
    const lines = [
      'TREND CONTEXT (anchor the visual to this trend signal — do NOT default to the generic Space Ape moodboard):',
      `  Angle: ${researchAngle.trim()}`,
    ]
    if (researchNotes && researchNotes.trim().length > 0) {
      lines.push(`  Signal: ${researchNotes.trim()}`)
    }
    sections.push(lines.join('\n'))
  }

  // 5. SHOT BRIEF — research-driven when the picked seed supplied a
  // shotBrief, otherwise the brand's default template. Research takes
  // priority because the trend's visual treatment (e.g. "passport-booth
  // headshot, harsh flash") must dominate the generic template; the
  // template only fills in when no research brief is available.
  const trimmedResearchBrief =
    typeof researchShotBrief === 'string' ? researchShotBrief.trim() : ''
  if (trimmedResearchBrief.length > 0) {
    sections.push(
      `SHOT BRIEF (research-driven — execute this exact treatment, override any conflicting defaults):\n  ${trimmedResearchBrief.replace(/\n+/g, '\n  ')}`,
    )
  } else {
    sections.push(`SHOT BRIEF — "${shotTemplate.name}":\n${buildShotBrief(shotTemplate)}`)
  }

  // 5. FLAVOR
  sections.push(
    `FLAVOR: Space Ape ${flavor} (${strain}). Brand palette — primary ${theme.primaryColor}, accent ${theme.accentColor}, background ${theme.backgroundColor}. Let these hues read in the scene without overpowering the product's own colorway.`,
  )

  // 6. MOOD (extracted adjectives only; keep the raw hook/caption out of the visible prompt)
  sections.push(
    `MOOD: ${mood}. Pillar: ${pillar}. Subcategory: ${subcategory}.`,
  )

  // 7. HARD CONSTRAINTS
  sections.push(`HARD CONSTRAINTS:\n${HARD_CONSTRAINTS.map((c) => `  - ${c}`).join('\n')}`)

  // 8. REINFORCE the reference discipline (repetition at end lifts adherence)
  if (inspoRefCount > 0) {
    sections.push(
      'REMEMBER: the aesthetic references are there for composition, lighting, palette, and mood ONLY. Do not let their subject matter leak into the final image. The product hero is the only subject.',
    )
  }

  // 9. Output spec
  sections.push('Output: one 1080x1080 image.')

  // Throwaway variation token — only present when caller wants a fresh generation.
  // Gemini treats this as low-signal context but it nudges sampling to a different path.
  if (typeof variationSeed === 'number') {
    sections.push(`Variation token: ${variationSeed}`)
  }

  return sections.join('\n\n')
}
