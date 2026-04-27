import type { PlatformVariant, TunerSource } from './types'

const IG_CAPTION_LIMIT = 2200

// IG tuner is mostly a pass-through: the upstream pillar generator already
// produces an IG-tuned caption + hashtag set. We just normalize into the
// PlatformVariant shape and enforce the char limit as a safety.
export function tuneForInstagram(source: TunerSource): PlatformVariant {
  const caption = source.baseCaption ?? source.baseHook ?? ''
  return {
    platform: 'Instagram',
    caption: caption.slice(0, IG_CAPTION_LIMIT),
    hashtags: source.baseHashtags ?? [],
    charLimit: IG_CAPTION_LIMIT,
  }
}
