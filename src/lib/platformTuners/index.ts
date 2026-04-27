import type { PlatformVariant, TunerPlatform, TunerSource } from './types'
import { tuneForInstagram } from './ig'
import { tuneForFacebook } from './facebook'
import { tuneForX } from './x'
import { tuneForThreads } from './threads'
import { tuneForTikTok } from './tiktok'
import { tuneForYouTube } from './youtube'
import { tuneForEmail } from './email'

export type { PlatformVariant, TunerPlatform, TunerSource, TunerFormat } from './types'
export {
  tuneForInstagram,
  tuneForFacebook,
  tuneForX,
  tuneForThreads,
  tuneForTikTok,
  tuneForYouTube,
  tuneForEmail,
}

const TUNERS: Record<TunerPlatform, (source: TunerSource) => PlatformVariant> = {
  Instagram: tuneForInstagram,
  Facebook: tuneForFacebook,
  X: tuneForX,
  Threads: tuneForThreads,
  TikTok: tuneForTikTok,
  'YouTube Shorts': tuneForYouTube,
  Email: tuneForEmail,
}

// Format → platforms compatible with that format. Used by PlatformPicker
// to grey out non-applicable destinations.
export const FORMAT_PLATFORM_COMPAT: Record<
  TunerSource['format'],
  ReadonlyArray<TunerPlatform>
> = {
  image: ['Instagram', 'Facebook', 'X', 'Threads', 'Email'],
  video: ['Instagram', 'Facebook', 'X', 'TikTok', 'YouTube Shorts'],
  carousel: ['Instagram', 'Facebook', 'X', 'Threads', 'Email'],
  text: ['X', 'Threads', 'Email'],
}

export function tuneFor(platform: TunerPlatform, source: TunerSource): PlatformVariant {
  return TUNERS[platform](source)
}
