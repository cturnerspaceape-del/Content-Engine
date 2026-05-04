import type { CadenceEntry } from './postingCadence'

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
