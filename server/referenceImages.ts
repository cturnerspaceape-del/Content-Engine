import { promises as fs } from 'node:fs'
import path from 'node:path'
import { flavorThemes } from '../src/remotion/flavorThemes'
import type { SpaceApeFlavor } from '../src/remotion/types'
import type { ReferenceImage } from './gemini'
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

export interface ManifestEntry {
  kind: 'inspo' | 'brand'
  vibe: Vibe
  palette: Palette
  composition: Composition
  subjectMotifs: string[]
  mood: Mood
  contentHash?: string // SHA256 of raw file bytes, set by ingest/classify for dedup
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

export async function pickInspoRefs(template: ShotTemplate, count = 2): Promise<string[]> {
  return pickRefsOfKind('inspo', template.aestheticTags, count)
}

export async function pickBrandRefs(template: ShotTemplate, count = 2): Promise<string[]> {
  return pickRefsOfKind('brand', template.brandTags, count)
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
export async function loadReferenceByManifestKey(key: string): Promise<ReferenceImage> {
  const abs = path.join(REFERENCES_DIR, key)
  const bytes = await fs.readFile(abs)
  return { mime: mimeFromFilename(key), base64: bytes.toString('base64') }
}
