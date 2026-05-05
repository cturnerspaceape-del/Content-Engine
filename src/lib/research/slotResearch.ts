// Per-slot research persistence. Each suggested post on a day (IG image, IG
// carousel, X text, email, etc.) gets its own picked research seed so a
// single day can run on multiple distinct trend signals.
//
// Storage key: `${dateKey}|${platform}|${format ?? ''}|${slotIndex}`
// — same shape as the slot identity used elsewhere in DayDetail.

import type { ResearchedSeed } from './types'

export interface SlotResearch {
  // Full set of seeds returned by /api/research-trends for this slot.
  // Includes the recommendation (idx 0) plus 0-2 candidates.
  seeds: ResearchedSeed[]
  // Index of the user's pick. -1 = nothing picked yet (browsing).
  pickedIdx: number
  fetchedAt: number
}

export interface SlotKeyParts {
  dateKey: string // YYYY-MM-DD
  platform: string
  format?: string
  slotIndex: number
}

const KEY_PREFIX = 'sl:scheduler:slot-research:'

export function slotKey(parts: SlotKeyParts): string {
  return `${parts.dateKey}|${parts.platform}|${parts.format ?? ''}|${parts.slotIndex}`
}

function storageKey(key: string): string {
  return `${KEY_PREFIX}${key}`
}

export function loadSlotResearch(key: string): SlotResearch | null {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (raw === null) return null
    const parsed = JSON.parse(raw) as SlotResearch
    if (!parsed || !Array.isArray(parsed.seeds)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSlotResearch(key: string, value: SlotResearch): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value))
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function clearSlotResearch(key: string): void {
  try {
    localStorage.removeItem(storageKey(key))
  } catch {
    // non-fatal
  }
}

export function pickedSeed(sr: SlotResearch | null): ResearchedSeed | null {
  if (!sr) return null
  if (sr.pickedIdx < 0 || sr.pickedIdx >= sr.seeds.length) return null
  return sr.seeds[sr.pickedIdx]
}
