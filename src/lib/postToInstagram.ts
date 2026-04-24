import type {
  ContentItem,
  PostDestination,
  PostedToFacebook,
  PostedToInstagram,
} from '../types'

export interface PublishResponse {
  ok: boolean
  mediaId?: string
  permalink?: string
  error?: string
}

export interface FacebookPublishResponse {
  ok: boolean
  postId?: string
  permalink?: string
  error?: string
}

export interface SocialsResult {
  instagram: PostedToInstagram
  facebook?: PostedToFacebook
  facebookError?: string
}

function assertPostableAsset(item: ContentItem) {
  const v = item.generatedVisual
  if (!v) throw new Error('Nothing to post — generate the visual first.')
  if (v.format === 'Single Image' && !v.imageUrl) {
    throw new Error('Image is still generating — try again in a moment.')
  }
  if (v.format === 'Reel' && !v.reelUrl) {
    throw new Error('Reel is still generating — try again in a moment.')
  }
  if (v.format === 'Carousel') {
    const slides = (v.slideUrls ?? []).filter((u): u is string => typeof u === 'string' && u.length > 0)
    if (slides.length < 2) throw new Error('Carousel needs at least 2 completed slides before posting.')
  }
  return v
}

function buildPublishBody(item: ContentItem): Record<string, unknown> {
  const v = assertPostableAsset(item)
  const body: Record<string, unknown> = {
    format: v.format,
    caption: v.caption,
    hashtags: v.hashtags,
  }
  if (v.format === 'Single Image') body.imageUrl = v.imageUrl
  else if (v.format === 'Reel') body.videoUrl = v.reelUrl
  else if (v.format === 'Carousel') {
    body.slideUrls = (v.slideUrls ?? []).filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    )
  } else {
    throw new Error(`Unknown format: ${v.format}`)
  }
  return body
}

// Wraps POST /api/instagram/publish and, on success, returns the PostedToInstagram
// record the caller should merge onto the item. Throws on failure so callers can
// bubble the error message to the confirm-modal state in ContentCard.
export async function postItemToInstagram(
  item: ContentItem,
  destination: PostDestination,
): Promise<PostedToInstagram> {
  const body = buildPublishBody(item)
  body.destination = destination

  const res = await fetch('/api/instagram/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as PublishResponse
  if (!res.ok || !data.ok || !data.mediaId) {
    throw new Error(data.error || `Post failed (${res.status})`)
  }
  return {
    mediaId: data.mediaId,
    permalink: data.permalink,
    destination,
    postedAt: new Date().toISOString(),
  }
}

// Facebook cross-post. Only supports feed-style destinations (no Stories).
export async function postItemToFacebook(item: ContentItem): Promise<PostedToFacebook> {
  const body = buildPublishBody(item)
  const res = await fetch('/api/facebook/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as FacebookPublishResponse
  if (!res.ok || !data.ok || !data.postId) {
    throw new Error(data.error || `FB post failed (${res.status})`)
  }
  return {
    postId: data.postId,
    permalink: data.permalink,
    postedAt: new Date().toISOString(),
  }
}

// Orchestrator — IG is primary, FB is a best-effort cross-post. FB is only
// attempted for feed posts (not Stories) and only when alsoFacebook is true.
// FB failure does NOT fail the overall action; it surfaces as facebookError
// on the result so the card can show a non-blocking warning.
export async function postItemToSocials(
  item: ContentItem,
  destination: PostDestination,
  opts: { alsoFacebook: boolean },
): Promise<SocialsResult> {
  const instagram = await postItemToInstagram(item, destination)
  if (!opts.alsoFacebook || destination !== 'feed') {
    return { instagram }
  }
  try {
    const facebook = await postItemToFacebook(item)
    return { instagram, facebook }
  } catch (err) {
    const facebookError = err instanceof Error ? err.message : String(err)
    return { instagram, facebookError }
  }
}
