import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import {
  pickProductReference,
  loadProductReference,
  loadReferenceByManifestKey,
} from './referenceImages'
import { promises as fs } from 'node:fs'
import path from 'node:path'

interface GenerateEmailImageBody {
  slot: 'hero' | 'product'
  prompt: string
  flavor?: string
  variationSeed?: number
}

const CACHE_VERSION = 2 // bumped for gpt-image-2 backend swap
const MANIFEST_PATH = path.resolve(process.cwd(), 'server', 'refManifest.json')

interface ManifestEntry {
  kind: 'inspo' | 'brand'
}

let manifestCache: Record<string, ManifestEntry> | null = null
async function loadManifestRaw(): Promise<Record<string, ManifestEntry>> {
  if (manifestCache) return manifestCache
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8')
    manifestCache = JSON.parse(raw) as Record<string, ManifestEntry>
  } catch {
    manifestCache = {}
  }
  return manifestCache
}

async function pickRandomBrandRefs(count: number): Promise<string[]> {
  const manifest = await loadManifestRaw()
  const brand = Object.entries(manifest)
    .filter(([, e]) => e.kind === 'brand')
    .map(([k]) => k)
  return shuffle(brand).slice(0, count)
}

async function pickRandomInspoRefs(count: number): Promise<string[]> {
  const manifest = await loadManifestRaw()
  const inspo = Object.entries(manifest)
    .filter(([, e]) => e.kind === 'inspo')
    .map(([k]) => k)
  return shuffle(inspo).slice(0, count)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const HARD_CONSTRAINTS = `
HARD CONSTRAINTS:
  - NO text, NO words, NO letters, NO numbers, NO logos — except what is physically printed on the product itself.
  - No human faces. Hands, silhouettes, body fragments are fine when the scene calls for it.
  - No third-party brand marks of any kind.
  - Photoreal product; surroundings may be photoreal or illustrated as the brief dictates.
  - 1080x1080 square, full bleed, no letterboxing, no borders.`

const BRAND_BIBLE = `BRAND BIBLE:
Space Ape is a premium cannabis live-resin vape brand. Editorial still-life energy meets playful-pop sticker energy. Glossy photoreal product rendering with subtle specular highlights. Confident, youthful, high-saturation, clean. The product is the unambiguous focal point.`

function buildImagePrompt(slot: 'hero' | 'product', userPrompt: string, flavor: string | undefined): string {
  const slotBrief =
    slot === 'hero'
      ? 'EMAIL HERO: a banner-ready Space Ape still life. Strong centered composition that crops well to 16:9, dramatic lighting, premium editorial mood.'
      : 'EMAIL PRODUCT CELL: tight product portrait, clean background, balanced negative space for a square crop. Reads at small size in a 2-up grid.'
  const flavorLine = flavor ? `FLAVOR: Space Ape ${flavor}.` : ''
  return [
    `GOAL: Generate a Space Ape marketing email image (${slot}).`,
    'REFERENCE IMAGES ATTACHED (in order):',
    '  [1] PRODUCT HERO — reproduce its shape, label, colorway, and proportions exactly. Match the reference SKU faithfully; do not stylize or redesign it.',
    '  [2-3] AESTHETIC REFS — borrow composition, lighting, palette, and mood. Do not reproduce their subjects.',
    '  [4-5] BRAND REFS — match the overall Space Ape visual language. Treat as contact sheets of prior work.',
    BRAND_BIBLE,
    slotBrief,
    flavorLine,
    `USER BRIEF: ${userPrompt}`,
    HARD_CONSTRAINTS,
    'Output: one 1080x1080 image.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

const FALLBACK_FLAVORS = [
  'Amped Apple',
  'Blue Frenzy',
  'Blue Zlushie',
  'Dragon Drip',
  'Lemon Cherry Slam',
] as const

function pickFallbackFlavor(): string {
  return FALLBACK_FLAVORS[Math.floor(Math.random() * FALLBACK_FLAVORS.length)]
}

export async function generateEmailImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateEmailImageBody
    const { slot, prompt, variationSeed } = body
    let { flavor } = body

    if (!slot || !prompt) {
      res.status(400).json({ error: 'missing required fields: slot, prompt' })
      return
    }

    if (!flavor) flavor = pickFallbackFlavor()

    const productFile = pickProductReference(flavor)
    const inspoKeys = await pickRandomInspoRefs(2)
    const brandKeys = await pickRandomBrandRefs(2)

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      slot,
      prompt,
      flavor,
      productRef: productFile,
      inspoRefs: [...inspoKeys].sort(),
      brandRefs: [...brandKeys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'email-image')

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash, flavor })
      return
    }

    const references: ReferenceImage[] = []
    if (productFile) references.push(await loadProductReference(productFile))
    const loadedInspo = await Promise.all(inspoKeys.map(loadReferenceByManifestKey))
    references.push(...loadedInspo.filter((r): r is ReferenceImage => r !== null))
    const loadedBrand = await Promise.all(brandKeys.map(loadReferenceByManifestKey))
    references.push(...loadedBrand.filter((r): r is ReferenceImage => r !== null))

    const fullPrompt = buildImagePrompt(slot, prompt, flavor)

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[generate-email-image] slot=${slot} flavor=${flavor}\n${fullPrompt.slice(0, 400)}…\n`)
    }

    const png = await generateImage({ prompt: fullPrompt, references })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash, flavor })
  } catch (err) {
    console.error('[generate-email-image]', err)
    const message = err instanceof Error ? err.message : 'email image generation failed'
    res.status(500).json({ error: message })
  }
}
