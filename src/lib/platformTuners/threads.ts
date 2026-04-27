import type { PlatformVariant, TunerSource } from './types'
import { truncateTo, stripHashtags } from './types'
import { tuneForX } from './x'

const THREADS_CHAR_LIMIT = 500

// Threads = a longer X. Same voice/archetype pool, just more breathing room.
// For text format we delegate to the X archetype pool (which is voice-aligned)
// then optionally extend; for image/video we truncate the IG caption to 500.
export function tuneForThreads(source: TunerSource): PlatformVariant {
  if (source.format === 'text') {
    // Reuse X's text generation, then re-cap at 500.
    const xVariant = tuneForX(source)
    return {
      platform: 'Threads',
      caption: xVariant.caption,
      hashtags: [],
      charLimit: THREADS_CHAR_LIMIT,
    }
  }
  const base = source.baseCaption ?? source.baseHook ?? ''
  return {
    platform: 'Threads',
    caption: truncateTo(stripHashtags(base), THREADS_CHAR_LIMIT),
    hashtags: [],
    charLimit: THREADS_CHAR_LIMIT,
  }
}
