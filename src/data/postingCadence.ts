import type { DayOfWeek, Platform } from '../types'

export interface CadenceEntry {
  platform: Platform
  count: number
  format?: string
}

// Weekly cadence encoded day-by-day so each slot's `format` is explicit.
// Hits these target ratios across the week:
//   IG    (7 feed, 5 stories): Carousel 40 / Reel 33 / Single Image 33; story modifier 60% feed+story / 25% feed-only / 15% story-only.
//   Meta  (4/wk on IG-feed days): Image+Text 50 / Reel+Text 25 / Text 25.
//   Threads (7/wk): Text 57 / Image+Text 29 / Reel+Text 14.
//   X     (14/wk = 2/day): Text 71 / Image+Text 21 / Reel+Text 7.
// Slot order per platform must match TIME_RECOMMENDATIONS index order
// (e.g. IG slot 0 = Story midday-12:00, slot 1 = Feed evening-18:00; X slot 0
// = morning-09:00, slot 1 = afternoon-17:00).
export const WEEKLY_CADENCE: Record<DayOfWeek, CadenceEntry[]> = {
  Monday: [
    { platform: 'Instagram', count: 1, format: 'Story' },
    { platform: 'Instagram', count: 1, format: 'Carousel' },
    { platform: 'Facebook',  count: 1, format: 'Image+Text' },
    { platform: 'Threads',   count: 1, format: 'Text' },
    { platform: 'X',         count: 2, format: 'Text' },
  ],
  Tuesday: [
    { platform: 'Instagram', count: 1, format: 'Single Image' },
    { platform: 'Threads',   count: 1, format: 'Text' },
    { platform: 'X',         count: 1, format: 'Text' },
    { platform: 'X',         count: 1, format: 'Image+Text' },
  ],
  Wednesday: [
    { platform: 'Instagram', count: 1, format: 'Story' },
    { platform: 'Instagram', count: 1, format: 'Reel' },
    { platform: 'Facebook',  count: 1, format: 'Reel+Text' },
    { platform: 'Threads',   count: 1, format: 'Image+Text' },
    { platform: 'X',         count: 2, format: 'Text' },
  ],
  Thursday: [
    { platform: 'Instagram', count: 1, format: 'Single Image' },
    { platform: 'Threads',   count: 1, format: 'Text' },
    { platform: 'X',         count: 2, format: 'Text' },
  ],
  Friday: [
    { platform: 'Instagram', count: 1, format: 'Story' },
    { platform: 'Instagram', count: 1, format: 'Carousel' },
    { platform: 'Facebook',  count: 1, format: 'Image+Text' },
    { platform: 'Threads',   count: 1, format: 'Text' },
    { platform: 'X',         count: 1, format: 'Text' },
    { platform: 'X',         count: 1, format: 'Image+Text' },
  ],
  Saturday: [
    { platform: 'Instagram', count: 1, format: 'Story' },
    { platform: 'Threads',   count: 1, format: 'Image+Text' },
    { platform: 'X',         count: 1, format: 'Text' },
    { platform: 'X',         count: 1, format: 'Reel+Text' },
  ],
  Sunday: [
    { platform: 'Instagram', count: 1, format: 'Story' },
    { platform: 'Instagram', count: 1, format: 'Reel' },
    { platform: 'Facebook',  count: 1, format: 'Text' },
    { platform: 'Threads',   count: 1, format: 'Reel+Text' },
    { platform: 'X',         count: 1, format: 'Text' },
    { platform: 'X',         count: 1, format: 'Image+Text' },
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
