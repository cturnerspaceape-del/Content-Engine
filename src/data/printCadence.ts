import type { DayOfWeek } from '../types'
import { WEEKLY_CADENCE, type CadenceEntry } from './postingCadence'
import { monthlyEmailEntriesFor } from './emailCadence'

// Print pieces aren't on a weekly rhythm — the user wants a fresh sticker,
// poster, and foldable print prepped on the 1st of every month.
export const MONTHLY_PRINT_CADENCE: CadenceEntry[] = [
  { platform: 'Print', count: 1, format: 'Sticker' },
  { platform: 'Print', count: 1, format: 'Poster' },
  { platform: 'Print', count: 1, format: 'Trifold' },
]

export function monthlyEntriesFor(date: Date): CadenceEntry[] {
  return date.getDate() === 1 ? MONTHLY_PRINT_CADENCE : []
}

const DAY_ORDER: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

export function cadenceForDate(date: Date): CadenceEntry[] {
  const dow = DAY_ORDER[(date.getDay() + 6) % 7]
  return [
    ...WEEKLY_CADENCE[dow],
    ...monthlyEntriesFor(date),
    ...monthlyEmailEntriesFor(date),
  ]
}

export function totalDemandForDate(date: Date): number {
  return cadenceForDate(date).reduce((s, e) => s + e.count, 0)
}
