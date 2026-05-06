import { promises as fs } from 'node:fs'
import path from 'node:path'
import { flavorThemes } from '../src/remotion/flavorThemes'
import type { SpaceApeFlavor } from '../src/remotion/types'
import type { ReferenceImage } from './openaiImage'
import type {
  ShotTemplate,
  TagFilter,
  Vibe,
  Palette,
  Composition,
  Mood,
} from '../src/data/shotTemplates'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const PRODUCTS_DIR = path.join(PUBLIC_DIR, 'products')
const REFERENCES_DIR = path.join(PUBLIC_DIR, 'references')
const MANIFEST_PATH = path.resolve(process.cwd(), 'server', 'refManifest.json')

export type ProductKind = 'device' | 'packaging' | 'both' | 'none'

export interface ManifestEntry {
  kind: 'inspo' | 'brand'
  vibe: Vibe
  palette: Palette
  composition: Composition
  subjectMotifs: string[]
  mood: Mood
  contentHash?: string // SHA256 of raw file bytes, set by ingest/classify for dedup
  // Set by classifyReferences. Older entries from sync-refs lack these fields;
  // callers must default missing values to false / 'none' (treat as aesthetic-only).
  containsProduct?: boolean
  productKind?: ProductKind
}

export type RefManifest = Record<string, ManifestEntry>

let manifestCache: RefManifest | null = null
let manifestMtime = 0

async function loadManifest(): Promise<RefManifest> {
  try {
    const stat = await fs.stat(MANIFEST_PATH)
    if (manifestCache && stat.mtimeMs === manifestMtime) return manifestCache
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8')
    manifestCache = JSON.parse(raw) as RefManifest
    manifestMtime = stat.mtimeMs
    return manifestCache
  } catch {
    manifestCache = {}
    manifestMtime = 0
    return manifestCache
  }
}

// ─── Product reference (branded SKU hero) ───

export function pickProductReference(flavor: string): string | null {
  const theme = flavorThemes[flavor as SpaceApeFlavor]
  if (!theme || theme.productImages.length === 0) return null
  const all = theme.productImages
  // Prefer device-master (clean catalog shot) as the hero ref.
  return all.find((f) => f.includes('device-master')) ?? all[0]
}

// ─── Manifest-driven reference selection ───

function scoreEntry(entry: ManifestEntry, filter: TagFilter): number {
  let score = 0
  if (filter.vibe?.includes(entry.vibe)) score += 2
  if (filter.palette?.includes(entry.palette)) score += 1
  if (filter.composition?.includes(entry.composition)) score += 1
  if (filter.mood?.includes(entry.mood)) score += 2
  return score
}

function sampleWeighted<T>(pool: Array<{ item: T; weight: number }>, count: number): T[] {
  const picked: T[] = []
  const working = [...pool]
  for (let i = 0; i < count && working.length > 0; i++) {
    const total = working.reduce((a, b) => a + b.weight, 0)
    if (total <= 0) {
      // All weights zero → pick uniformly.
      const idx = Math.floor(Math.random() * working.length)
      picked.push(working[idx].item)
      working.splice(idx, 1)
      continue
    }
    let r = Math.random() * total
    for (let j = 0; j < working.length; j++) {
      r -= working[j].weight
      if (r <= 0) {
        picked.push(working[j].item)
        working.splice(j, 1)
        break
      }
    }
  }
  return picked
}

async function pickRefsOfKind(
  kind: 'inspo' | 'brand',
  filter: TagFilter,
  count: number,
): Promise<string[]> {
  if (count <= 0) return []
  const manifest = await loadManifest()
  const candidates = Object.entries(manifest).filter(([, entry]) => entry.kind === kind)
  if (candidates.length === 0) return []

  const scored = candidates.map(([filename, entry]) => ({
    item: filename,
    weight: Math.max(scoreEntry(entry, filter), 0.25), // floor so unmatched files still get a chance
  }))
  return sampleWeighted(scored, count)
}

// `template` is optional: when omitted (research-brief-driven path), refs are
// pulled uniformly at random from the manifest pool — the brief is the
// authority on aesthetics, so template tags would only fight it.
export async function pickInspoRefs(
  template: ShotTemplate | undefined,
  count = 2,
): Promise<string[]> {
  return pickRefsOfKind('inspo', template?.aestheticTags ?? {}, count)
}

// Single uniform-random brand ref for the simplified research-driven flow.
// Returns null when the brand pool is empty (e.g. local dev with no refs
// synced) — callers should treat that as "no reference image" and proceed
// with the prompt alone.
export async function pickOneRandomBrandRef(): Promise<string | null> {
  const manifest = await loadManifest()
  const brand = Object.entries(manifest)
    .filter(([, entry]) => entry.kind === 'brand')
    .map(([k]) => k)
  if (brand.length === 0) return null
  return brand[Math.floor(Math.random() * brand.length)]
}

export async function pickBrandRefs(
  template: ShotTemplate | undefined,
  count = 2,
): Promise<string[]> {
  return pickRefsOfKind('brand', template?.brandTags ?? {}, count)
}

// ─── Loading ───

function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

export async function loadProductReference(filename: string): Promise<ReferenceImage> {
  const abs = path.join(PRODUCTS_DIR, filename)
  const bytes = await fs.readFile(abs)
  return { mime: mimeFromFilename(filename), base64: bytes.toString('base64') }
}

// Manifest filenames are stored as "inspo/foo.jpg" or "brand/bar.png".
// Returns null (with a warning) when the file is missing — on Railway the reference
// images are .gitignored, so the manifest may outlive the files on disk. A missing
// inspo/brand ref shouldn't fail the whole generation; the product ref + prompt alone
// still produce a valid image.
export async function loadReferenceByManifestKey(key: string): Promise<ReferenceImage | null> {
  const abs = path.join(REFERENCES_DIR, key)
  try {
    const bytes = await fs.readFile(abs)
    return { mime: mimeFromFilename(key), base64: bytes.toString('base64') }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[refs] missing: ${key} (${msg})`)
    return null
  }
}

// ─── Unified catalog (brand + product) for the LLM picker ───

// A few flavor names to fall back to when a handler has none from the body.
// Kept in sync with the email handler's prior local list — moved here so all
// three image labs share one allowlist.
const FALLBACK_FLAVORS: SpaceApeFlavor[] = [
  'Amped Apple',
  'Blue Frenzy',
  'Blue Zlushie',
  'Dragon Drip',
  'Lemon Cherry Slam',
]

export function pickFallbackFlavor(): SpaceApeFlavor {
  return FALLBACK_FLAVORS[Math.floor(Math.random() * FALLBACK_FLAVORS.length)]
}

// Compact entry surfaced to the picker. Brand entries fill the classifier
// fields; synthetic product entries fill flavor/format/shotKind from
// flavorThemes (no Gemini call needed).
export interface CatalogEntry {
  key: string                     // "brand/foo.png" or "product/2g-lcs-device-master.png"
  source: 'brand' | 'product'
  flavor?: SpaceApeFlavor
  format?: '2G' | '4G'
  shotKind?: string               // device-master, device-angled, lifestyle-packaging-and-device, etc.
  containsProduct: boolean
  productKind: ProductKind
  // Aesthetic tags (brand entries from classifier; product entries empty).
  vibe?: Vibe
  palette?: Palette
  composition?: Composition
  mood?: Mood
  motifs?: string[]
}

function inferShotKind(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('device-master')) return 'device-master'
  if (lower.includes('device-angled')) return 'device-angled'
  if (lower.includes('lifestyle-packaging-and-device') || lower.includes('lifestyle-package-and-device')) {
    return 'lifestyle-packaging-and-device'
  }
  if (lower.includes('lifestyle-shot-device') || lower.includes('lifestyle-shott-device')) {
    return 'lifestyle-shot-device'
  }
  if (lower.includes('lifestyle-and-device') || lower.includes('lifestyle-device')) {
    return 'lifestyle-shot-device'
  }
  return 'device'
}

function inferProductKind(shotKind: string): ProductKind {
  if (shotKind.includes('packaging') || shotKind.includes('package')) return 'both'
  return 'device'
}

// Synthetic catalog entries for every file in flavorThemes[*].productImages.
// Pulls flavor/format/shotKind directly from the curated theme registry —
// no filename parsing, no IO. Cached for the process lifetime since
// flavorThemes is static.
let productCatalogCache: CatalogEntry[] | null = null

export function buildProductManifest(): CatalogEntry[] {
  if (productCatalogCache) return productCatalogCache
  const out: CatalogEntry[] = []
  for (const [flavorName, theme] of Object.entries(flavorThemes)) {
    const flavor = flavorName as SpaceApeFlavor
    for (const filename of theme.productImages) {
      const shotKind = inferShotKind(filename)
      out.push({
        key: `product/${filename}`,
        source: 'product',
        flavor,
        format: theme.format,
        shotKind,
        containsProduct: true,
        productKind: inferProductKind(shotKind),
      })
    }
  }
  productCatalogCache = out
  return out
}

// Merge of brand-pool manifest + synthetic product manifest. Used by the picker.
export async function getUnifiedCatalog(): Promise<CatalogEntry[]> {
  const manifest = await loadManifest()
  const brand: CatalogEntry[] = Object.entries(manifest)
    .filter(([, entry]) => entry.kind === 'brand')
    .map(([key, entry]) => ({
      key,
      source: 'brand' as const,
      // Brand entries don't have a flavor — they're moodboard.
      containsProduct: entry.containsProduct ?? false,
      productKind: entry.productKind ?? 'none',
      vibe: entry.vibe,
      palette: entry.palette,
      composition: entry.composition,
      mood: entry.mood,
      motifs: entry.subjectMotifs,
    }))
  return [...buildProductManifest(), ...brand]
}

// Routes "brand/foo.png" → public/references/brand/foo.png
//        "product/foo.png" → public/products/foo.png
// Drops keys that fail to load (file missing, decode error, etc.) with a warn.
export async function loadRefsByKeys(keys: string[]): Promise<ReferenceImage[]> {
  const out: ReferenceImage[] = []
  for (const key of keys) {
    if (key.startsWith('product/')) {
      const filename = key.slice('product/'.length)
      try {
        const ref = await loadProductReference(filename)
        out.push(ref)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[refs] missing product: ${filename} (${msg})`)
      }
    } else if (key.startsWith('brand/') || key.startsWith('inspo/')) {
      const ref = await loadReferenceByManifestKey(key)
      if (ref) out.push(ref)
    } else {
      console.warn(`[refs] unknown key prefix: ${key}`)
    }
  }
  return out
}
