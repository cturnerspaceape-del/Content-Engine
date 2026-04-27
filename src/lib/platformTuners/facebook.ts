import type { PlatformVariant, TunerSource } from './types'
import { truncateTo } from './types'

const FB_CAPTION_LIMIT = 5000

// Facebook posts allow much longer captions than IG (~63k chars), but the
// algorithm rewards concise posts. We re-use the upstream IG caption,
// trim hashtags down (FB hashtags barely move; 1–2 is plenty), and cap
// at a comfortable 5000 chars.
export function tuneForFacebook(source: TunerSource): PlatformVariant {
  const caption = source.baseCaption ?? source.baseHook ?? ''
  // Keep the first hashtag only — FB feeds look cleaner without an IG-style
  // wall of tags.
  const hashtags = (source.baseHashtags ?? []).slice(0, 2)
  return {
    platform: 'Facebook',
    caption: truncateTo(caption, FB_CAPTION_LIMIT),
    hashtags,
    charLimit: FB_CAPTION_LIMIT,
  }
}
