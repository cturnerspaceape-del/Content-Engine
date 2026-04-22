import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const CACHE_DIR = path.resolve(process.cwd(), 'public', 'generated', 'single-image')
const PUBLIC_PREFIX = '/generated/single-image'

export function hashKey(input: unknown): string {
  const json = stableStringify(input)
  return createHash('sha256').update(json).digest('hex').slice(0, 16)
}

export function cachePath(hash: string): { absPath: string; publicUrl: string } {
  return {
    absPath: path.join(CACHE_DIR, `${hash}.png`),
    publicUrl: `${PUBLIC_PREFIX}/${hash}.png`,
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
