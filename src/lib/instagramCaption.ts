// Shared by the confirm-modal preview (frontend) and the Graph API client
// (server) so what the user previews is exactly what Instagram receives.
// IG caption limit: 2200 chars. Hashtag limit: 30.

export const MAX_CAPTION_LENGTH = 2200
const MAX_HASHTAGS = 30

// Parses a space / comma / newline separated hashtag string into a normalized
// array. Drops empty tokens, strips leading # so storage stays consistent with
// how the generator writes hashtags.
export function parseHashtagInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#+/, ''))
    .filter((t) => t.length > 0)
}

export function formatHashtagsForInput(tags: string[] | undefined): string {
  return (tags ?? [])
    .filter((t) => typeof t === 'string' && t.length > 0)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ')
}

export function buildCaption({
  caption,
  hashtags,
}: {
  caption: string
  hashtags?: string[]
}): string {
  const cleanTags = (hashtags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_HASHTAGS)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))

  const body = caption.trim()
  const tagLine = cleanTags.join(' ')
  const combined = tagLine ? `${body}\n\n${tagLine}` : body

  if (combined.length <= MAX_CAPTION_LENGTH) return combined

  const room = MAX_CAPTION_LENGTH - (tagLine ? tagLine.length + 2 : 0) - 1
  const truncatedBody = body.slice(0, Math.max(0, room)).trimEnd() + '…'
  return tagLine ? `${truncatedBody}\n\n${tagLine}` : truncatedBody
}
