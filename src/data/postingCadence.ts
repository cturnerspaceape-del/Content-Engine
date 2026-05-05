import type { DayOfWeek, Platform } from '../types'

export interface CadenceEntry {
  platform: Platform
  count: number
  format?: string
}

// Daily baseline runs every day: 1 IG Story, 1 Threads post, 2 X posts.
// IG feed (Carousel/Reel) + Meta layer in on Mon/Wed/Fri/Sun (4/wk each).
// Email moved to monthly cadence — see emailCadence.ts.
const dailyBaseline: CadenceEntry[] = [
  { platform: 'Instagram', count: 1, format: 'Story' },
  { platform: 'Threads', count: 1 },
  { platform: 'X', count: 2 },
]

const igFeedDay = (format: 'Carousel' | 'Reel'): CadenceEntry[] => [
  { platform: 'Instagram', count: 1, format },
  { platform: 'Facebook', count: 1 },
]

export const WEEKLY_CADENCE: Record<DayOfWeek, CadenceEntry[]> = {
  Monday:    [...dailyBaseline, ...igFeedDay('Carousel')],
  Tuesday:   [...dailyBaseline],
  Wednesday: [...dailyBaseline, ...igFeedDay('Reel')],
  Thursday:  [...dailyBaseline],
  Friday:    [...dailyBaseline, ...igFeedDay('Carousel')],
  Saturday:  [...dailyBaseline],
  Sunday:    [...dailyBaseline, ...igFeedDay('Reel')],
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
  Print: '🖨️',
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
  Print: '#0ea5e9',
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
  Print: 'Print',
}

export function totalDemandForDay(day: DayOfWeek): number {
  return WEEKLY_CADENCE[day].reduce((sum, e) => sum + e.count, 0)
}

// Recommended posting times in local 24h "HH:mm" — one entry per demanded slot
// where order matches typical engagement peaks for that platform.
// Slot order matches WEEKLY_CADENCE entry order per platform.
// Instagram: [0]=Story (midday casual scroll), [1]=Feed (evening peak).
// X: [0]=morning primary, [1]=optional 5pm.
export const TIME_RECOMMENDATIONS: Record<Platform, string[]> = {
  Instagram: ['12:00', '18:00'],
  Facebook: ['13:00'],
  Threads: ['09:00'],
  X: ['09:00', '17:00'],
  Email: ['10:00'],
  'YouTube Shorts': ['17:00', '20:00'],
  TikTok: ['18:00', '21:00'],
  'Blog Post': ['09:00'],
  Print: ['09:00'],
}

// Editorial themes by day-of-week — sourced from instagramContentGenerator.ts
// to keep DayDetail aligned with the existing IG planner copy.
export const DAY_THEMES: Record<DayOfWeek, string> = {
  Monday: 'Fresh Start',
  Tuesday: 'Engage & Educate',
  Wednesday: 'Mid-Week Push',
  Thursday: 'Throwback / Proof',
  Friday: 'Fun & Relatable',
  Saturday: 'Showcase',
  Sunday: 'Reflect & Plan',
}
