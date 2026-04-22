import 'dotenv/config'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import {
  aestheticTagsSchemaBlock,
  validateAestheticTags,
  stripJsonFences,
  type AestheticTags,
} from './classifySchema'
import type { ManifestEntry, RefManifest } from './referenceImages'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const REFERENCES_DIR = path.join(PUBLIC_DIR, 'references')
const MANIFEST_PATH = path.resolve(process.cwd(), 'server', 'refManifest.json')

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const INTER_CALL_DELAY_MS = 250

function mimeFromExt(ext: string): string {
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

async function loadManifest(): Promise<RefManifest> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8')
    return JSON.parse(raw) as RefManifest
  } catch {
    return {}
  }
}

async function writeManifest(manifest: RefManifest): Promise<void> {
  const sorted: RefManifest = {}
  for (const key of Object.keys(manifest).sort()) sorted[key] = manifest[key]
  const tmp = `${MANIFEST_PATH}.tmp`
  await fs.writeFile(tmp, JSON.stringify(sorted, null, 2) + '\n', 'utf8')
  await fs.rename(tmp, MANIFEST_PATH)
}

async function listImages(kind: 'inspo' | 'brand'): Promise<string[]> {
  const dir = path.join(REFERENCES_DIR, kind)
  try {
    const entries = await fs.readdir(dir)
    return entries
      .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .map((f) => `${kind}/${f}`)
  } catch {
    return []
  }
}

function buildClassifyPrompt(): string {
  return `You are classifying a reference image for a cannabis vape brand's content pipeline.

Return ONLY a JSON object (no markdown, no prose) with EXACTLY these keys:
{
${aestheticTagsSchemaBlock()}
}

Pick the single best value for each enum field. Be decisive.`
}

function sha256HexOfFile(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

// Look for <basename>.tags.json sibling sidecar preserving tags from ingest.
async function readSidecarTags(absImagePath: string): Promise<AestheticTags | null> {
  const dir = path.dirname(absImagePath)
  const base = path.basename(absImagePath, path.extname(absImagePath))
  const sidecarPath = path.join(dir, `${base}.tags.json`)
  try {
    const raw = await fs.readFile(sidecarPath, 'utf8')
    const parsed = JSON.parse(raw) as { tags?: unknown }
    const tags = validateAestheticTags(parsed.tags)
    return tags
  } catch {
    return null
  }
}

async function deleteSidecar(absImagePath: string): Promise<void> {
  const dir = path.dirname(absImagePath)
  const base = path.basename(absImagePath, path.extname(absImagePath))
  const sidecarPath = path.join(dir, `${base}.tags.json`)
  try {
    await fs.unlink(sidecarPath)
  } catch {
    /* ignore */
  }
}

async function classifyOne(
  ai: GoogleGenAI,
  model: string,
  absPath: string,
  ext: string,
): Promise<AestheticTags | null> {
  const bytes = await fs.readFile(absPath)
  const mime = mimeFromExt(ext)
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { text: buildClassifyPrompt() },
          { inlineData: { mimeType: mime, data: bytes.toString('base64') } },
        ],
      },
    ],
    config: { responseMimeType: 'application/json' },
  })
  const text = response.text ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFences(text))
  } catch {
    return null
  }
  return validateAestheticTags(parsed)
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env')
    process.exit(1)
  }
  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  const manifest = await loadManifest()
  const startCount = Object.keys(manifest).length

  const inspoFiles = await listImages('inspo')
  const brandFiles = await listImages('brand')
  const allFiles: Array<{ key: string; kind: 'inspo' | 'brand' }> = [
    ...inspoFiles.map((key) => ({ key, kind: 'inspo' as const })),
    ...brandFiles.map((key) => ({ key, kind: 'brand' as const })),
  ]

  // Prune manifest entries whose files no longer exist.
  let pruned = 0
  for (const key of Object.keys(manifest)) {
    if (!allFiles.some((f) => f.key === key)) {
      delete manifest[key]
      pruned++
    }
  }
  if (pruned > 0) console.log(`[classify] pruned ${pruned} stale manifest entries`)

  const toClassify = allFiles.filter(({ key }) => !manifest[key])
  console.log(`[classify] ${allFiles.length} files on disk, ${toClassify.length} new to classify (model: ${model})`)

  let done = 0
  let failed = 0
  let fromSidecar = 0
  for (const { key, kind } of toClassify) {
    const absPath = path.join(REFERENCES_DIR, key)
    process.stdout.write(`[classify] ${done + 1}/${toClassify.length} ${key} ... `)
    try {
      const bytes = await fs.readFile(absPath)
      const contentHash = sha256HexOfFile(bytes)

      // Prefer sidecar tags (moved out of _review/) to avoid re-querying Gemini.
      const sidecarTags = await readSidecarTags(absPath)
      let tags: AestheticTags | null = sidecarTags
      if (tags) {
        fromSidecar++
        console.log(`sidecar (${tags.vibe}/${tags.palette}/${tags.composition}/${tags.mood})`)
      } else {
        tags = await classifyOne(ai, model, absPath, path.extname(key).toLowerCase())
        if (!tags) {
          console.log('SKIPPED (invalid response)')
          failed++
          done++
          if (done < toClassify.length) await sleep(INTER_CALL_DELAY_MS)
          continue
        }
        console.log(`ok (${tags.vibe}/${tags.palette}/${tags.composition}/${tags.mood})`)
      }

      const entry: ManifestEntry = {
        kind,
        vibe: tags.vibe,
        palette: tags.palette,
        composition: tags.composition,
        mood: tags.mood,
        subjectMotifs: tags.subjectMotifs,
        contentHash,
      }
      manifest[key] = entry
      if (sidecarTags) await deleteSidecar(absPath)

      if ((done + 1) % 10 === 0) await writeManifest(manifest)
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
    done++
    // Only sleep when we actually called Gemini (sidecar path is free).
    if (done < toClassify.length) await sleep(INTER_CALL_DELAY_MS)
  }

  await writeManifest(manifest)
  const endCount = Object.keys(manifest).length
  console.log(
    `[classify] done. manifest: ${startCount} → ${endCount} entries (${fromSidecar} from sidecars, ${failed} failed)`,
  )
}

main().catch((err) => {
  console.error('[classify] fatal:', err)
  process.exit(1)
})
