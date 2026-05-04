import type { DayOfWeek, Platform } from '../types'

export interface CadenceEntry {
  platform: Platform
  count: number
  format?: string
}

const everyDay: CadenceEntry[] = [
  { platform: 'Instagram', count: 1, format: 'Carousel' },
  { platform: 'Instagram', count: 1, format: 'Reel' },
  { platform: 'Facebook', count: 1 },
]

export const WEEKLY_CADENCE: Record<DayOfWeek, CadenceEntry[]> = {
  Monday: [
    ...everyDay,
    { platform: 'X', count: 1 },
    { platform: 'Threads', count: 1 },
  ],
  Tuesday: [
    ...everyDay,
    { platform: 'Email', count: 1 },
  ],
  Wednesday: [
    ...everyDay,
    { platform: 'X', count: 1 },
    { platform: 'Threads', count: 1 },
  ],
  Thursday: [
    ...everyDay,
  ],
  Friday: [
    ...everyDay,
    { platform: 'X', count: 1 },
    { platform: 'Threads', count: 1 },
  ],
  Saturday: [
    ...everyDay,
    { platform: 'Email', count: 1 },
  ],
  Sunday: [
    ...everyDay,
  ],
}

export const PLATFORM_EMOJI: Record<Platform, string> = {
  Instagram: '📸',
  Email: '📧',
  X: '𝕏',
  Threads: '🧵',
  Facebook: '📘',
  'YouTube Shorts': '▶️',
  TikTok: '🎵',
  'Blog Post': '📝',
}

export const PLATFORM_COLOR: Record<Platform, string> = {
  Instagram: '#ec4899',
  Email: '#f59e0b',
  X: '#6b7280',
  Threads: '#6b7280',
  Facebook: '#1877f2',
  'YouTube Shorts': '#ef4444',
  TikTok: '#111827',
  'Blog Post': '#6b7280',
}

// Display label override — Facebook is shown as "Meta" since the brand
// treats FB as a Meta family-of-apps channel.
export const PLATFORM_LABEL: Record<Platform, string> = {
  Instagram: 'Instagram',
  Email: 'Email',
  X: 'X',
  Threads: 'Threads',
  Facebook: 'Meta',
  'YouTube Shorts': 'YouTube',
  TikTok: 'TikTok',
  'Blog Post': 'Blog',
}

export function totalDemandForDay(day: DayOfWeek): number {
  return WEEKLY_CADENCE[day].reduce((sum, e) => sum + e.count, 0)
}
