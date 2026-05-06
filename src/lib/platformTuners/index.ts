import type { PlatformVariant, TunerPlatform, TunerSource } from './types'
import { tuneForIGFB } from './ig'
import { tuneForX } from './x'
import { tuneForThreads } from './threads'
import { tuneForTikTok } from './tiktok'
import { tuneForYouTube } from './youtube'

export type { PlatformVariant, TunerPlatform, TunerSource, TunerFormat } from './types'
export { tuneForIGFB, tuneForX, tuneForThreads, tuneForTikTok, tuneForYouTube }

const TUNERS: Record<TunerPlatform, (source: TunerSource) => PlatformVariant> = {
  'IG/FB': tuneForIGFB,
  X: tuneForX,
  Threads: tuneForThreads,
  TikTok: tuneForTikTok,
  'YouTube Shorts': tuneForYouTube,
}

// Format → platforms compatible with that format. Used by PlatformPicker
// to grey out non-applicable destinations.
// Text supports IG/FB as a *cross-post target* (clipboard copy → user pastes
// into Meta apps). Generation happens once; the IG/FB checkbox just adds it
// to the cross-post set.
export const FORMAT_PLATFORM_COMPAT: Record<
  TunerSource['format'],
  ReadonlyArray<TunerPlatform>
> = {
  image: ['IG/FB', 'X', 'Threads'],
  video: ['IG/FB', 'X', 'Threads', 'TikTok', 'YouTube Shorts'],
  carousel: ['IG/FB', 'X', 'Threads'],
  text: ['X', 'Threads', 'IG/FB'],
}

export function tuneFor(platform: TunerPlatform, source: TunerSource): PlatformVariant {
  return TUNERS[platform](source)
}

// Async variant. For text-only X/Threads posts we call /api/generate-caption so
// the line is product-aware and on-voice. For everything else we fall through
// to the synchronous tuner (IG image cross-posts, video, carousel, etc.).
export async function tuneForAsync(
  platform: TunerPlatform,
  source: TunerSource,
): Promise<PlatformVariant> {
  if (source.format === 'text' && (platform === 'X' || platform === 'Threads')) {
    try {
      const charLimit = platform === 'X' ? 280 : 500
      const resp = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillar: 'Lifestyle', // not used by Raw voice — kept for API contract
          subcategory: source.archetype || '',
          flavor: 'Tang Exotic', // any flavor — LLM picks how much to surface
          platform,
          archetype: source.archetype,
          researchAngle: source.researchAngle,
          researchNotes: source.researchNotes,
        }),
      })
      if (!resp.ok) throw new Error(`/api/generate-caption ${resp.status}`)
      const data = (await resp.json()) as { caption?: string; hook?: string; error?: string }
      if (data.error) throw new Error(data.error)
      const text = (data.caption || data.hook || '').trim()
      if (!text) throw new Error('empty caption')
      const capped = text.length <= charLimit ? text : text.slice(0, charLimit - 1).trimEnd() + '…'
      return { platform, caption: capped, hashtags: [], charLimit }
    } catch (err) {
      console.warn('[tuneForAsync] falling back to static pool —', err)
      return TUNERS[platform](source)
    }
  }
  return TUNERS[platform](source)
}
