import type { PlatformVariant, TunerSource } from './types'
import { truncateTo } from './types'

const YT_TITLE_LIMIT = 100
const YT_DESC_LIMIT = 5000

// YouTube Shorts uses title + description as separate fields. Title comes
// from the hook (sharpest, most clickable line); description gets the
// fuller caption.
export function tuneForYouTube(source: TunerSource): PlatformVariant {
  const hook = source.baseHook ?? source.baseCaption ?? ''
  const fullCaption = source.baseCaption ?? hook
  const title = truncateTo(hook.replace(/\s*#[\w]+/g, '').trim(), YT_TITLE_LIMIT)
  const description = truncateTo(fullCaption, YT_DESC_LIMIT)
  return {
    platform: 'YouTube Shorts',
    caption: title, // primary user-visible text (matches caption convention)
    hashtags: [],
    charLimit: YT_TITLE_LIMIT,
    title,
    description,
  }
}
