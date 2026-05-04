import type { DayOfWeek, Platform } from '../types'

export interface CadenceEntry {
  platform: Platform
  count: number
  format?: string
}

const everyDayIG: CadenceEntry[] = [
  { platform: 'Instagram', count: 1, format: 'Carousel' },
  { platform: 'Instagram', count: 1, format: 'Reel' },
]

export const WEEKLY_CADENCE: Record<DayOfWeek, CadenceEntry[]> = {
  Monday: [
    ...everyDayIG,
    { platform: 'X', count: 1 },
    { platform: 'Threads', count: 1 },
  ],
  Tuesday: [
    ...everyDayIG,
    { platform: 'Email', count: 1 },
  ],
  Wednesday: [
    ...everyDayIG,
    { platform: 'X', count: 1 },
    { platform: 'Threads', count: 1 },
  ],
  Thursday: [
    ...everyDayIG,
  ],
  Friday: [
    ...everyDayIG,
    { platform: 'X', count: 1 },
    { platform: 'Threads', count: 1 },
  ],
  Saturday: [
    ...everyDayIG,
    { platform: 'Email', count: 1 },
  ],
  Sunday: [
    ...everyDayIG,
  ],
}

export const PLATFORM_EMOJI: Record<Platform, string> = {
  Instagram: '📸',
  Email: '📧',
  X: '𝕏',
  Threads: '🧵',
  Facebook: '👍',
  'YouTube Shorts': '▶️',
  TikTok: '🎵',
  'Blog Post': '📝',
}

export const PLATFORM_COLOR: Record<Platform, string> = {
  Instagram: '#ec4899',
  Email: '#f59e0b',
  X: '#6b7280',
  Threads: '#6b7280',
  Facebook: '#1d9bf0',
  'YouTube Shorts': '#ef4444',
  TikTok: '#111827',
  'Blog Post': '#6b7280',
}

export function totalDemandForDay(day: DayOfWeek): number {
  return WEEKLY_CADENCE[day].reduce((sum, e) => sum + e.count, 0)
}
