import type { PlatformVariant, TunerSource } from './types'
import { truncateTo } from './types'

const TIKTOK_CHAR_LIMIT = 2200

// TikTok-flavored hashtag rotation. Keep small — TikTok's algo prefers a
// few precise tags over IG-style hashtag walls.
const TIKTOK_TAGS = [
  '#cannabisculture',
  '#vapetok',
  '#weedtok',
  '#liveresin',
  '#fyp',
  '#420',
  '#stoneroftiktok',
  '#cannabiscommunity',
] as const

function pickN<T>(arr: readonly T[], n: number): T[] {
  if (n >= arr.length) return [...arr]
  const pool = [...arr]
  const out: T[] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

export function tuneForTikTok(source: TunerSource): PlatformVariant {
  const base = source.baseCaption ?? source.baseHook ?? ''
  // Strip incoming IG hashtags — we replace with TikTok-curated set.
  const captionNoTags = base.replace(/\s*#[\w]+/g, '').trim()
  return {
    platform: 'TikTok',
    caption: truncateTo(captionNoTags, TIKTOK_CHAR_LIMIT),
    hashtags: pickN(TIKTOK_TAGS, 3),
    charLimit: TIKTOK_CHAR_LIMIT,
  }
}
