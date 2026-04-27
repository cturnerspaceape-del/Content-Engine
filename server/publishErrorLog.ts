import { promises as fs } from 'node:fs'
import path from 'node:path'

// Tiny shared error log used by the IG/Threads/YouTube debug endpoints.
// Production logs on Railway truncate fast, so this gives a stable tail of
// the last failed publish attempts that survives restarts.

interface ErrorEntry {
  ts: string
  platform: string
  format?: string
  destination?: string
  message: string
}

const LOG_PATH = path.resolve(process.cwd(), 'server', '.publish-errors.jsonl')
const MAX_ENTRIES = 50

let lastError: ErrorEntry | null = null

export function getLastPublishError(platform?: string): ErrorEntry | null {
  if (!lastError) return null
  if (platform && lastError.platform !== platform) return null
  return lastError
}

export async function recordPublishError(entry: Omit<ErrorEntry, 'ts'>): Promise<void> {
  const full: ErrorEntry = { ts: new Date().toISOString(), ...entry }
  lastError = full
  try {
    await fs.appendFile(LOG_PATH, JSON.stringify(full) + '\n', 'utf8')
  } catch {
    // Best-effort — don't let logging failures cascade.
  }
}

export async function readRecentPublishErrors(limit = 5, platform?: string): Promise<ErrorEntry[]> {
  let raw: string
  try {
    raw = await fs.readFile(LOG_PATH, 'utf8')
  } catch {
    return []
  }
  const lines = raw.split('\n').filter((l) => l.trim().length > 0)
  const tail = lines.slice(-MAX_ENTRIES)
  const parsed: ErrorEntry[] = []
  for (const line of tail) {
    try {
      parsed.push(JSON.parse(line))
    } catch {
      // skip malformed lines
    }
  }
  const filtered = platform ? parsed.filter((e) => e.platform === platform) : parsed
  return filtered.slice(-limit)
}
