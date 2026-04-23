import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const GENERATED_ROOT = path.resolve(process.cwd(), 'public', 'generated')

export type CacheKind = 'single-image' | 'carousel-slide' | 'reel'

const EXT: Record<CacheKind, string> = {
  'single-image': 'png',
  'carousel-slide': 'png',
  reel: 'mp4',
}

export function hashKey(input: unknown): string {
  const json = stableStringify(input)
  return createHash('sha256').update(json).digest('hex').slice(0, 16)
}

export function cachePath(
  hash: string,
  kind: CacheKind = 'single-image',
): { absPath: string; publicUrl: string } {
  const ext = EXT[kind]
  return {
    absPath: path.join(GENERATED_ROOT, kind, `${hash}.${ext}`),
    publicUrl: `/generated/${kind}/${hash}.${ext}`,
  }
}

export async function exists(absPath: string): Promise<boolean> {
  try {
    await fs.access(absPath)
    return true
  } catch {
    return false
  }
}

export async function writePng(absPath: string, data: Buffer): Promise<void> {
  await writeBytes(absPath, data)
}

export async function writeMp4(absPath: string, data: Buffer): Promise<void> {
  await writeBytes(absPath, data)
}

async function writeBytes(absPath: string, data: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(absPath), { recursive: true })
  const tmp = `${absPath}.tmp`
  await fs.writeFile(tmp, data)
  await fs.rename(tmp, absPath)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value as Record<string, unknown>).sort()
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
  return `{${entries.join(',')}}`
}
