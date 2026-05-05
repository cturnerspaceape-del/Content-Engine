// Resolves research-supplied URLs into ReferenceImage[] for the image model.
// Two URL kinds flow in from /api/research-trends:
//   - sourceImageUrls: direct image URLs (jpg/png/webp). Tried first since
//     no HTML hop is needed.
//   - sourceUrls: page URLs. Fetched, og:image / twitter:image / image_src
//     extracted, then the resolved image URL is downloaded.
//
// Failures are silent — every URL is tried under a short timeout and
// per-URL try/catch. The handler returns whatever it could resolve, up to
// `max`. If nothing resolves, the caller falls back to the static inspo
// pool from refManifest.json. This keeps generation robust when Claude's
// suggested URLs are paywalled, blocked, or simply gone.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { ReferenceImage } from './openaiImage'

const RESEARCH_INSPO_ROOT = path.resolve(process.cwd(), 'public', 'research-inspo')
const FETCH_TIMEOUT_MS = 6000
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const USER_AGENT =
  'Mozilla/5.0 (compatible; SpaceApeBot/1.0; +https://spaceape.com)'

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

interface ResolveOpts {
  sourceImageUrls?: string[]
  sourceUrls?: string[]
  /** How many references to return at most. Default 2. */
  max?: number
}

interface CachedImage {
  bytes: Buffer
  mime: string
}

export async function resolveResearchInspo(opts: ResolveOpts): Promise<ReferenceImage[]> {
  const max = Math.max(1, opts.max ?? 2)
  const direct = (opts.sourceImageUrls ?? []).slice(0, 8)
  const pages = (opts.sourceUrls ?? []).slice(0, 8)
  const results: ReferenceImage[] = []
  const seenHashes = new Set<string>()

  // 1) direct image URLs first — cheapest path
  for (const url of direct) {
    if (results.length >= max) break
    const cached = await tryResolveDirect(url).catch(() => null)
    if (cached && !seenHashes.has(hashBytes(cached.bytes))) {
      seenHashes.add(hashBytes(cached.bytes))
      results.push({ mime: cached.mime, base64: cached.bytes.toString('base64') })
    }
  }

  // 2) page URLs — fetch HTML, find og:image, download
  for (const url of pages) {
    if (results.length >= max) break
    const cached = await tryResolvePage(url).catch(() => null)
    if (cached && !seenHashes.has(hashBytes(cached.bytes))) {
      seenHashes.add(hashBytes(cached.bytes))
      results.push({ mime: cached.mime, base64: cached.bytes.toString('base64') })
    }
  }

  return results
}

async function tryResolveDirect(url: string): Promise<CachedImage | null> {
  return fetchAndCacheImage(url)
}

async function tryResolvePage(url: string): Promise<CachedImage | null> {
  const html = await fetchText(url)
  if (!html) return null
  const found = extractOgImage(html, url)
  if (!found) return null
  return fetchAndCacheImage(found)
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, { redirect: 'follow' })
    if (!res || !res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html') && !ct.includes('xhtml')) return null
    // Cap HTML size — meta tags are in <head>, no need to read megabytes.
    const text = await res.text()
    return text.slice(0, 256 * 1024)
  } catch {
    return null
  }
}

async function fetchAndCacheImage(url: string): Promise<CachedImage | null> {
  // Cache key by URL — different URLs hit different files.
  const key = createHash('sha256').update(url).digest('hex').slice(0, 16)
  const cached = await readCached(key)
  if (cached) return cached
  const fetched = await downloadImage(url)
  if (!fetched) return null
  const ext = EXT_BY_MIME[fetched.mime] ?? 'png'
  const absPath = path.join(RESEARCH_INSPO_ROOT, `${key}.${ext}`)
  await writeBytes(absPath, fetched.bytes)
  return fetched
}

async function readCached(key: string): Promise<CachedImage | null> {
  for (const [mime, ext] of Object.entries(EXT_BY_MIME)) {
    const candidate = path.join(RESEARCH_INSPO_ROOT, `${key}.${ext}`)
    try {
      const bytes = await fs.readFile(candidate)
      return { bytes, mime }
    } catch {
      // try next ext
    }
  }
  return null
}

async function downloadImage(url: string): Promise<CachedImage | null> {
  try {
    const res = await fetchWithTimeout(url, { redirect: 'follow' })
    if (!res || !res.ok) return null
    const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    let mime = ct
    if (!mime || !mime.startsWith('image/')) {
      // Some hosts mislabel; try inferring from extension.
      mime = inferMimeFromUrl(url) ?? ''
      if (!mime) return null
    }
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null
    // Normalize unknown image types to png — Gemini accepts the common four.
    const finalMime = EXT_BY_MIME[mime] ? mime : 'image/png'
    return { bytes, mime: finalMime }
  } catch {
    return null
  }
}

function inferMimeFromUrl(url: string): string | null {
  const m = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/)
  if (!m) return null
  return MIME_BY_EXT[m[1]] ?? null
}

function extractOgImage(html: string, baseUrl: string): string | null {
  const probes = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ]
  for (const re of probes) {
    const m = html.match(re)
    if (m && m[1]) {
      try {
        return new URL(m[1], baseUrl).toString()
      } catch {
        continue
      }
    }
  }
  return null
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function writeBytes(absPath: string, data: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(absPath), { recursive: true })
  const tmp = `${absPath}.tmp`
  await fs.writeFile(tmp, data)
  await fs.rename(tmp, absPath)
}

function hashBytes(b: Buffer): string {
  return createHash('sha256').update(b).digest('hex').slice(0, 16)
}
