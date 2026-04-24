// Shared by the confirm-modal preview (frontend) and the Graph API client
// (server) so what the user previews is exactly what Instagram receives.
// IG caption limit: 2200 chars. Hashtag limit: 30.

const MAX_CAPTION_LENGTH = 2200
const MAX_HASHTAGS = 30

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
