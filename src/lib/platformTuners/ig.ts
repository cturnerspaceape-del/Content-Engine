import type { PlatformVariant, TunerSource } from './types'

const IG_CAPTION_LIMIT = 2200

// IG/FB tuner is mostly a pass-through: the upstream pillar generator
// already produces an IG-tuned caption + hashtag set. The same caption
// gets posted to Facebook via the alsoFacebook cross-post — they share
// publish logic, so they share the tuner output.
export function tuneForIGFB(source: TunerSource): PlatformVariant {
  const caption = source.baseCaption ?? source.baseHook ?? ''
  return {
    platform: 'IG/FB',
    caption: caption.slice(0, IG_CAPTION_LIMIT),
    hashtags: source.baseHashtags ?? [],
    charLimit: IG_CAPTION_LIMIT,
  }
}
