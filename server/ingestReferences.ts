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
const INSPO_DIR = path.join(REFERENCES_DIR, 'inspo')
const BRAND_DIR = path.join(REFERENCES_DIR, 'brand')
const REVIEW_DIR = path.join(REFERENCES_DIR, '_review')
const MANIFEST_PATH = path.resolve(process.cwd(), 'server', 'refManifest.json')

const DEFAULT_SOURCE = path.resolve('C:/Users/cturn/OneDrive/Pictures/INSPO')
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const SKIP_EXTS = new Set(['.heic', '.heif'])
const INTER_CALL_DELAY_MS = 250

type Confidence = 'low' | 'medium' | 'high'

interface ClassifyResult {
  tags: AestheticTags
  isBrand: boolean
  brandConfidence: Confidence
  brandReason: string
}

interface ReviewSidecar {
  tags: AestheticTags
  brandGuess: boolean
  brandConfidence: Confidence
  brandReason: string
  contentHash: string
  originalFilename: string
}

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

function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

// Strip " - Copy", " - Copy (N)", and " (N)" patterns from base filename.
function cleanFilename(original: string): string {
  const ext = path.extname(original).toLowerCase()
  const base = path.basename(original, path.extname(original))
  const cleaned = base
    .replace(/(\s-\sCopy)+/g, '')
    .replace(/\s\(\d+\)/g, '')
    .trim()
  return `${cleaned}${ext}`
}

async function ensureUniquePath(
  targetDir: string,
  filename: string,
  hash: string,
): Promise<string> {
  let candidate = path.join(targetDir, filename)
  try {
    await fs.access(candidate)
  } catch {
    return candidate // does not exist
  }
  // Collision: append short hash before extension.
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  candidate = path.join(targetDir, `${base}-${hash.slice(0, 6)}${ext}`)
  return candidate
}

function buildIngestPrompt(): string {
  return `You are classifying a reference image for a cannabis vape brand's content pipeline.

The brand is "Space Ape" — a premium cannabis live-resin vape maker. Their products are glossy colorful 2G and 4G vape pen devices with bold flavor-named packaging. Their branded assets typically show: the Space Ape logo/wordmark, the distinctive vape device silhouette, flavor-themed packaging (Amped Apple, Blue Frenzy, Dragon Drip, Lemon Cherry Slam, etc.), or space/ape mascot motifs.

Return ONLY a JSON object (no markdown, no prose) with EXACTLY these keys:
{
  "isBrand":         boolean — does this image show Space Ape branding, logo, packaging, or one of their vape devices? Other cannabis brands do NOT count as brand.
  "brandConfidence": one of ["low","medium","high"] — how sure are you about isBrand?
  "brandReason":     short single-sentence justification (under 100 chars).
${aestheticTagsSchemaBlock()}
}

Pick the single best value for each enum field. Be decisive about aesthetic tags. Only pick "high" confidence for brand if you can clearly identify Space Ape-specific signals.`
}

function validateIngestResponse(raw: string): ClassifyResult | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFences(raw))
  } catch {
    return null
  }
  const tags = validateAestheticTags(parsed)
  if (!tags) return null
  const p = parsed as Record<string, unknown>
  if (typeof p.isBrand !== 'boolean') return null
  const conf = p.brandConfidence as Confidence
  if (conf !== 'low' && conf !== 'medium' && conf !== 'high') return null
  const reason = typeof p.brandReason === 'string' ? p.brandReason.trim().slice(0, 200) : ''
  return { tags, isBrand: p.isBrand, brandConfidence: conf, brandReason: reason }
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  // Gemini SDK surfaces upstream HTTP errors as thrown Error with the JSON body in the message.
  return /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded)\b/i.test(msg)
}

async function classifyOneWithRetry(
  ai: GoogleGenAI,
  model: string,
  absPath: string,
  ext: string,
  maxAttempts = 5,
): Promise<ClassifyResult | null> {
  const bytes = await fs.readFile(absPath)
  const mime = mimeFromExt(ext)
  let lastErr: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildIngestPrompt() },
              { inlineData: { mimeType: mime, data: bytes.toString('base64') } },
            ],
          },
        ],
        config: { responseMimeType: 'application/json' },
      })
      const text = response.text ?? ''
      return validateIngestResponse(text)
    } catch (err) {
      lastErr = err
      if (!isRetryableError(err) || attempt === maxAttempts) throw err
      // Backoff: 2s, 4s, 8s, 16s (with small jitter). Flash overload usually clears quickly.
      const backoff = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500)
      process.stdout.write(`retry ${attempt}/${maxAttempts - 1} in ${Math.round(backoff / 1000)}s... `)
      await sleep(backoff)
    }
  }
  throw lastErr
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

interface ReviewItem {
  filename: string
  brandGuess: boolean
  brandConfidence: Confidence
  brandReason: string
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env')
    process.exit(1)
  }

  const sourceArg = process.argv[2]
  const sourceDir = sourceArg ? path.resolve(sourceArg) : DEFAULT_SOURCE
  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash'
  const ai = new GoogleGenAI({ apiKey })

  // Ensure target dirs exist.
  for (const d of [INSPO_DIR, BRAND_DIR, REVIEW_DIR]) {
    await fs.mkdir(d, { recursive: true })
  }

  const manifest = await loadManifest()
  const existingHashes = new Set<string>()
  for (const entry of Object.values(manifest)) {
    if (entry.contentHash) existingHashes.add(entry.contentHash)
  }

  let sourceFiles: string[] = []
  try {
    sourceFiles = await fs.readdir(sourceDir)
  } catch (err) {
    console.error(`could not read source dir ${sourceDir}:`, err)
    process.exit(1)
  }

  const seenHashes = new Set<string>()
  const counts = {
    scanned: 0,
    skippedExt: 0,
    skippedHeic: 0,
    deduped: 0,
    toInspo: 0,
    toBrand: 0,
    toReview: 0,
    failed: 0,
  }
  const reviewList: ReviewItem[] = []

  console.log(`[ingest] source: ${sourceDir}`)
  console.log(`[ingest] ${sourceFiles.length} entries found, model: ${model}`)
  console.log(`[ingest] ${existingHashes.size} content hashes already in manifest`)
  console.log('')

  const imageFiles: string[] = []
  for (const f of sourceFiles) {
    const ext = path.extname(f).toLowerCase()
    if (SKIP_EXTS.has(ext)) {
      counts.skippedHeic++
      continue
    }
    if (!IMAGE_EXTS.has(ext)) {
      counts.skippedExt++
      continue
    }
    imageFiles.push(f)
  }
  counts.scanned = imageFiles.length + counts.skippedHeic + counts.skippedExt

  let processed = 0
  let checkpointCounter = 0

  for (const original of imageFiles) {
    const absSrc = path.join(sourceDir, original)
    const ext = path.extname(original).toLowerCase()
    let bytes: Buffer
    try {
      bytes = await fs.readFile(absSrc)
    } catch (err) {
      console.log(`[${++processed}/${imageFiles.length}] ${original} — READ ERROR: ${err instanceof Error ? err.message : String(err)}`)
      counts.failed++
      continue
    }
    const hash = sha256Hex(bytes)

    if (seenHashes.has(hash) || existingHashes.has(hash)) {
      counts.deduped++
      processed++
      continue
    }
    seenHashes.add(hash)

    process.stdout.write(`[${++processed}/${imageFiles.length}] ${original} ... `)

    let result: ClassifyResult | null = null
    try {
      result = await classifyOneWithRetry(ai, model, absSrc, ext)
    } catch (err) {
      console.log(`CLASSIFY ERROR: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`)
      counts.failed++
      if (processed < imageFiles.length) await sleep(INTER_CALL_DELAY_MS)
      continue
    }
    if (!result) {
      console.log('INVALID RESPONSE')
      counts.failed++
      if (processed < imageFiles.length) await sleep(INTER_CALL_DELAY_MS)
      continue
    }

    const cleaned = cleanFilename(original)
    const highConf = result.brandConfidence === 'high'

    if (highConf && result.isBrand) {
      const dst = await ensureUniquePath(BRAND_DIR, cleaned, hash)
      await fs.writeFile(dst, bytes)
      const manifestKey = `brand/${path.basename(dst)}`
      manifest[manifestKey] = {
        kind: 'brand',
        vibe: result.tags.vibe,
        palette: result.tags.palette,
        composition: result.tags.composition,
        mood: result.tags.mood,
        subjectMotifs: result.tags.subjectMotifs,
        contentHash: hash,
      }
      existingHashes.add(hash)
      counts.toBrand++
      console.log(`→ brand (${result.tags.vibe}/${result.tags.mood})`)
    } else if (highConf && !result.isBrand) {
      const dst = await ensureUniquePath(INSPO_DIR, cleaned, hash)
      await fs.writeFile(dst, bytes)
      const manifestKey = `inspo/${path.basename(dst)}`
      manifest[manifestKey] = {
        kind: 'inspo',
        vibe: result.tags.vibe,
        palette: result.tags.palette,
        composition: result.tags.composition,
        mood: result.tags.mood,
        subjectMotifs: result.tags.subjectMotifs,
        contentHash: hash,
      }
      existingHashes.add(hash)
      counts.toInspo++
      console.log(`→ inspo (${result.tags.vibe}/${result.tags.mood})`)
    } else {
      // Low/medium confidence → parking lot
      const dst = await ensureUniquePath(REVIEW_DIR, cleaned, hash)
      await fs.writeFile(dst, bytes)
      const sidecarPath = path.join(
        REVIEW_DIR,
        `${path.basename(dst, path.extname(dst))}.tags.json`,
      )
      const sidecar: ReviewSidecar = {
        tags: result.tags,
        brandGuess: result.isBrand,
        brandConfidence: result.brandConfidence,
        brandReason: result.brandReason,
        contentHash: hash,
        originalFilename: original,
      }
      await fs.writeFile(sidecarPath, JSON.stringify(sidecar, null, 2), 'utf8')
      existingHashes.add(hash)
      counts.toReview++
      reviewList.push({
        filename: path.basename(dst),
        brandGuess: result.isBrand,
        brandConfidence: result.brandConfidence,
        brandReason: result.brandReason,
      })
      console.log(`→ review (${result.brandConfidence} brand=${result.isBrand})`)
    }

    // Checkpoint after every successful routing so an abort never strands files.
    await writeManifest(manifest)
    checkpointCounter++
    if (processed < imageFiles.length) await sleep(INTER_CALL_DELAY_MS)
  }

  await writeManifest(manifest)

  console.log('')
  console.log('============================================================')
  console.log('Ingest complete')
  console.log('============================================================')
  console.log(`  Scanned:         ${counts.scanned}`)
  console.log(`  Skipped (HEIC):  ${counts.skippedHeic}`)
  console.log(`  Skipped (other): ${counts.skippedExt}`)
  console.log(`  Duplicates:      ${counts.deduped}`)
  console.log(`  → inspo:         ${counts.toInspo}`)
  console.log(`  → brand:         ${counts.toBrand}`)
  console.log(`  → review:        ${counts.toReview}`)
  console.log(`  Failed:          ${counts.failed}`)
  console.log('')

  if (reviewList.length > 0) {
    console.log(`${reviewList.length} file(s) need your review in public/references/_review/:`)
    console.log('(drag each into inspo/ or brand/ based on your judgment, then run: npm run classify-refs)')
    console.log('')
    for (const item of reviewList) {
      const flag = item.brandGuess ? '[?brand]' : '[?inspo]'
      console.log(
        `  ${flag} (${item.brandConfidence.padEnd(6)}) ${item.filename}  —  ${item.brandReason}`,
      )
    }
  } else {
    console.log('No review items. You can run `npm run dev` and start generating.')
  }
}

main().catch((err) => {
  console.error('[ingest] fatal:', err)
  process.exit(1)
})
