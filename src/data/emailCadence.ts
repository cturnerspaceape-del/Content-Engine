import type { CadenceEntry } from './postingCadence'

// Email moved off the weekly rhythm to 2 sends per month, ~14 days apart,
// always on a Tuesday (within the 9-11am Tue-Thu sweet spot).
// Picks: 2nd and 4th Tuesday of each month.

function tuesdayOrdinal(date: Date): number {
  // 1..5 for which Tuesday of the month this is, 0 if not a Tuesday.
  if (date.getDay() !== 2) return 0
  return Math.ceil(date.getDate() / 7)
}

export function monthlyEmailEntriesFor(date: Date): CadenceEntry[] {
  const ord = tuesdayOrdinal(date)
  return ord === 2 || ord === 4 ? [{ platform: 'Email', count: 1 }] : []
}
