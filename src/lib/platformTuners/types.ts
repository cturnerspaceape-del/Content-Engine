import type { ContentPillar } from '../../types'
import type { TextArchetype } from '../seeds/textArchetype'

// 'IG/FB' is one cross-post destination representing both Meta apps. They
// share publish logic (postItemToSocials always cross-posts IG → FB when
// alsoFacebook=true) and the FB feed receives the IG caption verbatim, so
// surfacing two separate chips would be misleading. The underlying
// ContentItem.platform stays as 'Instagram' for storage; this is the
// UI-level cross-post abstraction.
export type TunerPlatform =
  | 'IG/FB'
  | 'X'
  | 'Threads'
  | 'TikTok'
  | 'YouTube Shorts'

export type TunerFormat = 'image' | 'video' | 'carousel' | 'text'

export interface TunerSource {
  format: TunerFormat
  pillar?: ContentPillar
  archetype?: TextArchetype
  // Base text produced by the upstream asset generator (e.g. IG pools).
  // Tuners adapt these for their platform's char limit / voice.
  baseHook?: string
  baseCaption?: string
  baseHashtags?: string[]
  // Multi-slide bodies (carousel) — used for X-thread variant.
  slideBriefs?: string[]
}

export interface PlatformVariant {
  platform: TunerPlatform
  // Primary user-visible text — caption / tweet.
  caption: string
  hashtags: string[]
  charLimit: number
  // YouTube-only:
  title?: string
  description?: string
  // Carousel → X/Threads thread:
  threadParts?: string[]
}

export function truncateTo(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

export function stripHashtags(text: string): string {
  return text.replace(/\s*#[\w]+/g, '').replace(/\s+/g, ' ').trim()
}
