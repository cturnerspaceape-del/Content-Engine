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
export const FORMAT_PLATFORM_COMPAT: Record<
  TunerSource['format'],
  ReadonlyArray<TunerPlatform>
> = {
  image: ['IG/FB', 'X', 'Threads'],
  video: ['IG/FB', 'X', 'Threads', 'TikTok', 'YouTube Shorts'],
  carousel: ['IG/FB', 'X', 'Threads'],
  text: ['X', 'Threads'],
}

export function tuneFor(platform: TunerPlatform, source: TunerSource): PlatformVariant {
  return TUNERS[platform](source)
}
