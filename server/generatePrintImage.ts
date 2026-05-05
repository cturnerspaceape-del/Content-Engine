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

type PieceType = 'poster' | 'trifold-panel' | 'sticker'

interface GeneratePrintImageBody {
  pieceType: PieceType
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
  - The Space Ape product itself may carry its real label and any printed text. Headline/body copy on the print piece is allowed and encouraged where the brief calls for it.
  - No human faces. Hands, silhouettes, and body fragments are fine.
  - No third-party brand marks of any kind.
  - Photoreal product; surroundings can be photoreal or stylized as the brief dictates.
  - Full-bleed composition with no letterboxing or borders.`

const BRAND_BIBLE = `BRAND BIBLE:
Space Ape is a premium cannabis live-resin vape brand. Editorial still-life energy meets playful-pop sticker energy. Glossy photoreal product rendering with subtle specular highlights. Confident, youthful, high-saturation, clean. The product is the unambiguous focal point.`

interface SlotConfig {
  brief: string
  outputLine: string
}

const PIECE_CONFIG: Record<PieceType, SlotConfig> = {
  poster: {
    brief:
      'PRINT POSTER: a 13×19 inch portrait poster (Super B / Tabloid Extra). Strong centered hero composition with room for an integrated headline at top or bottom. High-impact, readable from across a retail floor.',
    outputLine: 'Output: one image at the largest portrait resolution available, ~13:19 aspect ratio.',
  },
  'trifold-panel': {
    brief:
      'TRIFOLD BROCHURE PANEL: tall narrow panel (~6.33×11 inches portrait). Lays out one face of a folded brochure — strong vertical composition, premium product hero with an integrated headline and body region. Reads cleanly when stacked next to two more identical copies on a 13×19 imposition sheet.',
    outputLine: 'Output: one image at the largest portrait resolution available, ~1:1.74 aspect ratio.',
  },
  sticker: {
    brief:
      'PRINT STICKER: a 3×3 inch square die-cut sticker. Bold sticker-pop graphic — playful, high-saturation, instantly readable at small physical size. Strong silhouette so it survives the cut.',
    outputLine: 'Output: one square 1:1 image, full bleed.',
  },
}

function buildImagePrompt(pieceType: PieceType, userPrompt: string, flavor: string | undefined): string {
  const cfg = PIECE_CONFIG[pieceType]
  const flavorLine = flavor ? `FLAVOR: Space Ape ${flavor}.` : ''
  return [
    `GOAL: Generate a Space Ape ${pieceType.replace('-', ' ')} print piece.`,
    'REFERENCE IMAGES ATTACHED (in order):',
    '  [1] PRODUCT HERO — reproduce its shape, label, colorway, and proportions exactly. Match the reference SKU faithfully; do not stylize or redesign it.',
    '  [2-3] AESTHETIC REFS — borrow composition, lighting, palette, and mood. Do not reproduce their subjects.',
    '  [4-5] BRAND REFS — match the overall Space Ape visual language. Treat as contact sheets of prior work.',
    BRAND_BIBLE,
    cfg.brief,
    flavorLine,
    `USER BRIEF: ${userPrompt}`,
    HARD_CONSTRAINTS,
    cfg.outputLine,
    'Text filter. Photorealism.',
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

export async function generatePrintImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GeneratePrintImageBody
    const { pieceType, prompt, variationSeed } = body
    let { flavor } = body

    if (!pieceType || !prompt) {
      res.status(400).json({ error: 'missing required fields: pieceType, prompt' })
      return
    }
    if (!PIECE_CONFIG[pieceType]) {
      res.status(400).json({ error: `unknown pieceType: ${pieceType}` })
      return
    }

    if (!flavor) flavor = pickFallbackFlavor()

    const productFile = pickProductReference(flavor)
    const inspoKeys = await pickRandomInspoRefs(2)
    const brandKeys = await pickRandomBrandRefs(2)

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      pieceType,
      prompt,
      flavor,
      productRef: productFile,
      inspoRefs: [...inspoKeys].sort(),
      brandRefs: [...brandKeys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'print-image')

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

    const fullPrompt = buildImagePrompt(pieceType, prompt, flavor)

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[generate-print-image] pieceType=${pieceType} flavor=${flavor}\n${fullPrompt.slice(0, 400)}…\n`)
    }

    const png = await generateImage({ prompt: fullPrompt, references })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash, flavor })
  } catch (err) {
    console.error('[generate-print-image]', err)
    const message = err instanceof Error ? err.message : 'print image generation failed'
    res.status(500).json({ error: message })
  }
}
