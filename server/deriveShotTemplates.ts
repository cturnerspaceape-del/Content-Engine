import 'dotenv/config'
import { promises as fs } from 'node:fs'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import {
  VIBES,
  PALETTES,
  COMPOSITIONS,
  MOODS,
} from '../src/data/shotTemplates'
import { stripJsonFences } from './classifySchema'
import type { RefManifest, ManifestEntry } from './referenceImages'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const REFERENCES_DIR = path.join(PUBLIC_DIR, 'references')
const MANIFEST_PATH = path.resolve(process.cwd(), 'server', 'refManifest.json')
const OUTPUT_PATH = path.resolve(process.cwd(), 'src', 'data', 'shotTemplates.json')

const MAX_IMAGES = 25
const MIN_INSPO = 10
const MIN_RECIPES = 8
const MAX_RECIPES = 15

// Pillars the derived recipes can be assigned to.
const PILLARS = [
  'Lifestyle',
  'Product Centric',
  'Entertainment',
  'Social Proof',
  'Brand Building',
  'Education',
] as const

function mimeFromExt(ext: string): string {
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

async function loadManifest(): Promise<RefManifest> {
  const raw = await fs.readFile(MANIFEST_PATH, 'utf8')
  return JSON.parse(raw) as RefManifest
}

// Stratified sample: group inspo entries by (vibe, palette), pick up to 2 per group.
function stratifiedSample(manifest: RefManifest, target: number): string[] {
  const inspo: Array<[string, ManifestEntry]> = Object.entries(manifest).filter(
    ([, e]) => e.kind === 'inspo',
  )
  const buckets = new Map<string, Array<[string, ManifestEntry]>>()
  for (const entry of inspo) {
    const [, e] = entry
    const key = `${e.vibe}|${e.palette}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(entry)
  }

  const picked: string[] = []
  const rrBuckets = [...buckets.values()]
  // Shuffle each bucket's internal order once for variety.
  for (const b of rrBuckets) b.sort(() => Math.random() - 0.5)
  // Round-robin take up to 2 per bucket until we hit the target.
  let round = 0
  while (picked.length < target) {
    let anyTaken = false
    for (const b of rrBuckets) {
      if (round < b.length && picked.length < target) {
        picked.push(b[round][0])
        anyTaken = true
      }
    }
    if (!anyTaken || round >= 2) break
    round++
  }
  return picked
}

async function readImagePart(manifestKey: string) {
  const abs = path.join(REFERENCES_DIR, manifestKey)
  const bytes = await fs.readFile(abs)
  return {
    inlineData: {
      mimeType: mimeFromExt(path.extname(manifestKey).toLowerCase()),
      data: bytes.toString('base64'),
    },
  }
}

function buildDerivationPrompt(imageCount: number): string {
  return `You are designing a shot template library for Space Ape — a premium cannabis live-resin vape brand.

I am attaching ${imageCount} reference images that collectively define the aesthetic direction we want our generated product photography to match.

Your task: analyze the attached images and propose ${MIN_RECIPES}-${MAX_RECIPES} distinct shot recipes (one per visual archetype you see). Each recipe will later be rendered into a prompt sent to Gemini's image generator along with additional product and brand reference images.

Return ONLY a JSON array (no markdown fence, no prose) of recipe objects. Each object must have EXACTLY these keys:

{
  "id":           kebab-case short id, e.g. "frosted-marble" (must be unique within the array)
  "name":         human-readable 2-4 word display name
  "scene":        one sentence describing subject placement + environment
  "lighting":     one sentence describing light direction, quality, color temp
  "camera":       one sentence describing angle, lens feel, framing, DOF
  "palette":      one sentence describing the palette treatment
  "post":         one sentence describing grain, grade, finish (editorial / commercial / etc.)
  "aestheticTags": {
    "vibe":        array of 1-3 from [${VIBES.join(', ')}]
    "palette":     array of 0-2 from [${PALETTES.join(', ')}]
    "composition": array of 0-2 from [${COMPOSITIONS.join(', ')}]
    "mood":        array of 1-3 from [${MOODS.join(', ')}]
  }
  "brandTags": {
    "vibe":        array of 1-3 from [${VIBES.join(', ')}]
    "palette":     array of 0-2 from [${PALETTES.join(', ')}]
    "composition": array of 0-2 from [${COMPOSITIONS.join(', ')}]
  }
  "pillarAffinity": array of 1-4 from [${PILLARS.join(', ')}]
  "subcategoryBoost": array of 0-3 Instagram content subcategory names this recipe fits especially well (e.g. "New Drop Reveal", "Hardware Feature", "Flavor Breakdown", "Retail Partner Spotlight", "First Timer Reaction", "Founder Story", "Quality Process", "How It's Made", "Hot Take", "Would You Rather", "Cultural Moment") — empty array if nothing fits.
}

Guidelines:
  - Recipes should be visually DISTINCT from each other. If two images suggest the same shot setup, produce one recipe that covers both.
  - Prefer recipes grounded in what you actually SEE in the refs over generic product-photography tropes.
  - Recipes must work for a single product hero (a colorful 2G or 4G vape pen device). Do not propose setups that require multiple products or humans as the focal point.
  - Keep each field to ONE sentence. Be concrete and specific (lens focal length feel, color temperature, shadow direction, surface material) — Gemini's image model responds well to that.
  - Every recipe must be renderable without adding text, logos, or people's faces.

Return the JSON array only. Nothing else.`
}

interface DerivedRecipe {
  id: string
  name: string
  scene: string
  lighting: string
  camera: string
  palette: string
  post: string
  aestheticTags: { vibe: string[]; palette?: string[]; composition?: string[]; mood: string[] }
  brandTags: { vibe: string[]; palette?: string[]; composition?: string[] }
  pillarAffinity: string[]
  subcategoryBoost?: string[]
}

function validateRecipe(x: unknown): DerivedRecipe | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  const strFields = ['id', 'name', 'scene', 'lighting', 'camera', 'palette', 'post']
  for (const k of strFields) {
    if (typeof r[k] !== 'string' || !(r[k] as string).trim()) return null
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id as string)) return null
  if (!r.aestheticTags || typeof r.aestheticTags !== 'object') return null
  if (!r.brandTags || typeof r.brandTags !== 'object') return null
  const at = r.aestheticTags as Record<string, unknown>
  const bt = r.brandTags as Record<string, unknown>
  if (!Array.isArray(at.vibe) || !Array.isArray(at.mood)) return null
  if (!Array.isArray(bt.vibe)) return null
  if (!Array.isArray(r.pillarAffinity)) return null

  // Best-effort: clamp enum values. Drop invalids rather than rejecting the whole recipe.
  const filterToEnum = (arr: unknown, allowed: readonly string[]): string[] => {
    if (!Array.isArray(arr)) return []
    return arr.filter((x): x is string => typeof x === 'string' && allowed.includes(x))
  }
  const recipe: DerivedRecipe = {
    id: r.id as string,
    name: r.name as string,
    scene: r.scene as string,
    lighting: r.lighting as string,
    camera: r.camera as string,
    palette: r.palette as string,
    post: r.post as string,
    aestheticTags: {
      vibe: filterToEnum(at.vibe, VIBES),
      palette: filterToEnum(at.palette, PALETTES),
      composition: filterToEnum(at.composition, COMPOSITIONS),
      mood: filterToEnum(at.mood, MOODS),
    },
    brandTags: {
      vibe: filterToEnum(bt.vibe, VIBES),
      palette: filterToEnum(bt.palette, PALETTES),
      composition: filterToEnum(bt.composition, COMPOSITIONS),
    },
    pillarAffinity: filterToEnum(r.pillarAffinity, PILLARS),
    subcategoryBoost: Array.isArray(r.subcategoryBoost)
      ? (r.subcategoryBoost as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
  }
  // Require at least one vibe, one mood, and one pillar survived enum filtering.
  if (recipe.aestheticTags.vibe.length === 0) return null
  if (recipe.aestheticTags.mood.length === 0) return null
  if (recipe.pillarAffinity.length === 0) return null
  return recipe
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({ input: stdin, output: stdout })
  const answer = (await rl.question(prompt)).trim().toLowerCase()
  rl.close()
  return answer === 'y' || answer === 'yes'
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env')
    process.exit(1)
  }

  const autoYes = process.argv.includes('--yes') || process.argv.includes('-y')

  const manifest = await loadManifest()
  const inspoCount = Object.values(manifest).filter((e) => e.kind === 'inspo').length
  if (inspoCount < MIN_INSPO) {
    console.error(`Only ${inspoCount} inspo entries in manifest (need ≥${MIN_INSPO}). Run ingest/classify first.`)
    process.exit(1)
  }

  const sample = stratifiedSample(manifest, MAX_IMAGES)
  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash'

  console.log(`[derive-shots] manifest has ${inspoCount} inspo entries`)
  console.log(`[derive-shots] stratified sample: ${sample.length} images across (vibe, palette) buckets`)
  console.log(`[derive-shots] model: ${model} (TEXT tier, NOT image model)`)
  console.log(`[derive-shots] estimated cost: ~$0.01 for this single multi-image call`)
  console.log(`[derive-shots] output: ${OUTPUT_PATH}`)
  console.log('')

  if (!autoYes) {
    const proceed = await confirm('Proceed? [y/N] ')
    if (!proceed) {
      console.log('Aborted. No API call made.')
      return
    }
  } else {
    console.log('[derive-shots] --yes flag set; skipping confirmation.')
  }

  console.log(`[derive-shots] loading ${sample.length} image parts...`)
  const imageParts = await Promise.all(sample.map(readImagePart))
  const prompt = buildDerivationPrompt(sample.length)

  console.log('[derive-shots] calling Gemini... (single call, may take ~20-40s)')
  const ai = new GoogleGenAI({ apiKey })

  const isRetryable = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err)
    return /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|Deadline)\b/i.test(msg)
  }

  const MAX_ATTEMPTS = 6
  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
        config: { responseMimeType: 'application/json' },
      })
      break
    } catch (err) {
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) throw err
      const backoff = 2000 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000)
      console.log(`[derive-shots] retry ${attempt}/${MAX_ATTEMPTS - 1}: waiting ${Math.round(backoff / 1000)}s... (${err instanceof Error ? err.message.slice(0, 80) : ''})`)
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  if (!response) throw new Error('unreachable: no response after retry loop')

  const text = response.text ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFences(text))
  } catch (err) {
    console.error('[derive-shots] failed to parse Gemini response:', err)
    console.error('--- raw response ---')
    console.error(text.slice(0, 2000))
    process.exit(1)
  }

  if (!Array.isArray(parsed)) {
    console.error('[derive-shots] Gemini response was not a JSON array')
    console.error(text.slice(0, 2000))
    process.exit(1)
  }

  const recipes: DerivedRecipe[] = []
  const ids = new Set<string>()
  let skipped = 0
  for (const candidate of parsed) {
    const validated = validateRecipe(candidate)
    if (!validated) {
      skipped++
      continue
    }
    if (ids.has(validated.id)) {
      skipped++
      continue
    }
    ids.add(validated.id)
    recipes.push(validated)
  }

  if (recipes.length === 0) {
    console.error('[derive-shots] no valid recipes in response')
    console.error(text.slice(0, 2000))
    process.exit(1)
  }

  console.log('')
  console.log(`[derive-shots] derived ${recipes.length} recipes (${skipped} skipped as invalid):`)
  for (const r of recipes) {
    console.log(`  - ${r.id.padEnd(28)} ${r.name}  [${r.aestheticTags.vibe.join('/')}]`)
  }
  console.log('')

  if (!autoYes) {
    const confirmWrite = await confirm(`Write these ${recipes.length} recipes to ${path.relative(process.cwd(), OUTPUT_PATH)}? [y/N] `)
    if (!confirmWrite) {
      console.log('Not written. Re-run if you want to keep them.')
      return
    }
  }

  const backup = OUTPUT_PATH + '.bak'
  try {
    await fs.copyFile(OUTPUT_PATH, backup)
    console.log(`[derive-shots] backed up existing file → ${path.relative(process.cwd(), backup)}`)
  } catch {
    // No existing file, nothing to back up.
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(recipes, null, 2) + '\n', 'utf8')
  console.log(`[derive-shots] wrote ${recipes.length} recipes.`)
  console.log('[derive-shots] done. Restart the API server to pick up the new templates.')
}

main().catch((err) => {
  console.error('[derive-shots] fatal:', err)
  process.exit(1)
})
