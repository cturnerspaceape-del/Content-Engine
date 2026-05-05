// One-shot tool that takes a source folder of reference images and:
//   1. sanitizes filenames (lowercase, replace spaces / "- copy" markers)
//   2. copies them into public/references/brand/  (replaces existing pool)
//   3. regenerates server/refManifest.json with one brand entry per file
//   4. writes a gzipped tarball to public/refs.tar.gz for upload to R2
//
// Usage:
//   npm run sync-refs -- "<source folder>"
//   npm run sync-refs -- "C:/Users/cturn/OneDrive/Pictures/INSPO"
//
// After running, upload public/refs.tar.gz to your R2 bucket (public mode)
// and set REFS_TARBALL_URL on Railway. The Dockerfile pulls it at build.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const BRAND_DIR = path.join(PUBLIC_DIR, 'references', 'brand')
const INSPO_DIR = path.join(PUBLIC_DIR, 'references', 'inspo')
const MANIFEST_PATH = path.resolve(process.cwd(), 'server', 'refManifest.json')
const TARBALL_PATH = path.join(PUBLIC_DIR, 'refs.tar.gz')

const VALID_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

function sanitize(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const base = path.basename(filename, path.extname(filename))
  const cleaned = base
    .toLowerCase()
    .replace(/\s*-\s*copy\b/g, '-copy')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${cleaned}${ext}`
}

async function emptyDirContents(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
  const entries = await fs.readdir(dir)
  for (const e of entries) {
    if (e === '.gitkeep') continue
    await fs.rm(path.join(dir, e), { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  const src = process.argv[2]
  if (!src) {
    console.error('usage: npm run sync-refs -- "<source folder>"')
    process.exit(2)
  }

  // 1. wipe existing pools (gitignored — only .gitkeep stays)
  console.log(`[sync-refs] clearing ${BRAND_DIR}`)
  await emptyDirContents(BRAND_DIR)
  console.log(`[sync-refs] clearing ${INSPO_DIR}`)
  await emptyDirContents(INSPO_DIR)

  // 2. copy + sanitize
  const srcEntries = await fs.readdir(src, { withFileTypes: true })
  const usedNames = new Set<string>()
  const manifestKeys: string[] = []
  let copied = 0
  for (const entry of srcEntries) {
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (!VALID_EXT.has(ext)) continue
    let name = sanitize(entry.name)
    let dedupe = 1
    while (usedNames.has(name)) {
      const e = path.extname(name)
      const b = name.slice(0, -e.length)
      name = `${b}-${dedupe}${e}`
      dedupe += 1
    }
    usedNames.add(name)
    await fs.copyFile(path.join(src, entry.name), path.join(BRAND_DIR, name))
    manifestKeys.push(`brand/${name}`)
    copied += 1
  }
  console.log(`[sync-refs] copied ${copied} files → ${BRAND_DIR}`)

  // 3. regenerate manifest. Every entry is kind:'brand' with neutral tags
  // (the new pool is product shots / logos only — no aesthetic intent — so
  // tag-based weighting collapses to uniform random, which is the goal).
  const manifest: Record<string, unknown> = {}
  for (const key of manifestKeys.sort()) {
    manifest[key] = {
      kind: 'brand',
      vibe: 'minimal',
      palette: 'high-contrast',
      composition: 'centered-hero',
      mood: 'premium',
      subjectMotifs: ['vape device', 'logo'],
    }
  }
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`[sync-refs] wrote manifest with ${manifestKeys.length} entries → ${MANIFEST_PATH}`)

  // 4. tarball — relative to public/ so the archive contains references/brand/<file>.
  // Dockerfile extracts into public/.
  console.log(`[sync-refs] building tarball → ${TARBALL_PATH}`)
  // --force-local: GNU tar on Windows treats Cygwin-style absolute paths
  // (C:\...) as remote hosts otherwise.
  const tar = spawnSync(
    'tar',
    ['--force-local', '-czf', TARBALL_PATH, '-C', PUBLIC_DIR, 'references/brand'],
    { stdio: 'inherit' },
  )
  if (tar.status !== 0) {
    console.error('[sync-refs] tar failed — install tar (Git Bash / WSL ships it) or run on a Unix host')
    process.exit(1)
  }
  const stat = await fs.stat(TARBALL_PATH)
  console.log(`[sync-refs] tarball ready (${(stat.size / 1024 / 1024).toFixed(1)} MB)`)

  console.log(`\nNext steps:`)
  console.log(`  1. Upload ${TARBALL_PATH} to your R2 bucket (e.g. as refs.tar.gz)`)
  console.log(`  2. Make the bucket public OR generate a presigned URL`)
  console.log(`  3. Set REFS_TARBALL_URL on Railway to the public URL`)
  console.log(`  4. Push — Dockerfile fetches + extracts at build time`)
}

void main().catch((err) => {
  console.error(err)
  process.exit(1)
})
