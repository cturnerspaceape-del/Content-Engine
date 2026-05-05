// Per-day research persistence. The Scheduler weekly view lets a user pick
// one of 3 trend seeds for a given day; that pick is stored here keyed by
// YYYY-MM-DD so the day-detail page can route the same angle into every
// platform's Generate button (IG image/carousel, X/Threads/Facebook text,
// Email).
//
// Data shape: a single JSON blob per day with all 3 candidates plus the
// picked one. Keeping the candidates around lets the user re-pick from the
// already-fetched set without burning another web_search call.

import type { ResearchedSeed } from './types'

export interface DayResearch {
  // The full set of seeds returned by /api/research-trends for this day.
  // Includes the recommendation (index 0) plus candidates.
  seeds: ResearchedSeed[]
  // Index into `seeds` of the user's picked seed. -1 means none picked yet.
  pickedIdx: number
  fetchedAt: number
}

const KEY_PREFIX = 'sl:scheduler:research:'

function keyFor(dateKey: string): string {
  return `${KEY_PREFIX}${dateKey}`
}

export function loadDayResearch(dateKey: string): DayResearch | null {
  try {
    const raw = localStorage.getItem(keyFor(dateKey))
    if (raw === null) return null
    const parsed = JSON.parse(raw) as DayResearch
    if (!parsed || !Array.isArray(parsed.seeds)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveDayResearch(dateKey: string, value: DayResearch): void {
  try {
    localStorage.setItem(keyFor(dateKey), JSON.stringify(value))
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function clearDayResearch(dateKey: string): void {
  try {
    localStorage.removeItem(keyFor(dateKey))
  } catch {
    // non-fatal
  }
}

export function pickedSeed(dr: DayResearch | null): ResearchedSeed | null {
  if (!dr) return null
  if (dr.pickedIdx < 0 || dr.pickedIdx >= dr.seeds.length) return null
  return dr.seeds[dr.pickedIdx]
}
