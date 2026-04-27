import type {
  ContentItem,
  PostDestination,
  PostedToFacebook,
  PostedToInstagram,
  PostedToThreads,
  PostedToYouTube,
} from '../types'
import type { TunerPlatform } from './platformTuners'

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

export interface ThreadsPublishResponse {
  ok: boolean
  mediaId?: string
  permalink?: string
  error?: string
}

export interface YouTubePublishResponse {
  ok: boolean
  videoId?: string
  permalink?: string
  error?: string
}

export interface SocialsResult {
  instagram: PostedToInstagram
  facebook?: PostedToFacebook
  facebookError?: string
  threads?: PostedToThreads
  threadsError?: string
  youtube?: PostedToYouTube
  youtubeError?: string
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

// Threads cross-post. Supports image/video/carousel; uses the same generated
// asset as IG. Caption-tuner truncation (500 chars) happens server-side.
export async function postItemToThreads(item: ContentItem): Promise<PostedToThreads> {
  const body = buildPublishBody(item)
  const res = await fetch('/api/threads/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as ThreadsPublishResponse
  if (!res.ok || !data.ok || !data.mediaId) {
    throw new Error(data.error || `Threads post failed (${res.status})`)
  }
  return {
    mediaId: data.mediaId,
    permalink: data.permalink,
    postedAt: new Date().toISOString(),
  }
}

// YouTube Shorts cross-post. Reel format only — backend will reject other
// formats with a 400.
export async function postItemToYouTubeShorts(item: ContentItem): Promise<PostedToYouTube> {
  const body = buildPublishBody(item)
  const res = await fetch('/api/youtube/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as YouTubePublishResponse
  if (!res.ok || !data.ok || !data.videoId || !data.permalink) {
    throw new Error(data.error || `YouTube post failed (${res.status})`)
  }
  return {
    videoId: data.videoId,
    permalink: data.permalink,
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

// Orchestrator — IG is primary; FB / Threads / YouTube are best-effort
// cross-posts. Only IG failure aborts the flow; cross-post failures surface
// as per-platform `*Error` fields without blocking each other.
//
// Stories are IG-only — Threads has no stories, YouTube isn't ephemeral, and
// FB stories aren't supported by the current FB integration. So when
// destination is 'story' we skip every cross-post regardless of selection.
//
// X and TikTok are intentionally clipboard-only (no public posting API the
// project is willing to depend on). Their checkboxes drive copy-to-clipboard
// in the lab pages, not network calls here.
export async function postItemToSocials(
  item: ContentItem,
  destination: PostDestination,
  opts: { alsoFacebook: boolean; selectedCrossPosts?: TunerPlatform[] },
): Promise<SocialsResult> {
  const instagram = await postItemToInstagram(item, destination)
  const result: SocialsResult = { instagram }

  if (destination !== 'feed') return result

  const selected = new Set<TunerPlatform>(opts.selectedCrossPosts ?? [])
  const wantThreads = selected.has('Threads')
  const wantYouTube
    = selected.has('YouTube Shorts') && item.generatedVisual?.format === 'Reel'

  const tasks: Array<Promise<void>> = []

  if (opts.alsoFacebook) {
    tasks.push(
      postItemToFacebook(item)
        .then((facebook) => {
          result.facebook = facebook
        })
        .catch((err) => {
          result.facebookError = err instanceof Error ? err.message : String(err)
        }),
    )
  }

  if (wantThreads) {
    tasks.push(
      postItemToThreads(item)
        .then((threads) => {
          result.threads = threads
        })
        .catch((err) => {
          result.threadsError = err instanceof Error ? err.message : String(err)
        }),
    )
  }

  if (wantYouTube) {
    tasks.push(
      postItemToYouTubeShorts(item)
        .then((youtube) => {
          result.youtube = youtube
        })
        .catch((err) => {
          result.youtubeError = err instanceof Error ? err.message : String(err)
        }),
    )
  }

  if (tasks.length > 0) await Promise.all(tasks)
  return result
}

// Builds a one-line toast summary from a SocialsResult — IG is always success
// (otherwise postItemToSocials would have thrown). Each cross-post platform
// adds a " · X ✓" or " · X failed: <msg>" segment.
export function summarizeSocialsResult(result: SocialsResult): {
  text: string
  hasError: boolean
} {
  const parts: string[] = ['IG ✓']
  let hasError = false
  if (result.facebook) parts.push('FB ✓')
  if (result.facebookError) {
    parts.push(`FB failed: ${result.facebookError}`)
    hasError = true
  }
  if (result.threads) parts.push('Threads ✓')
  if (result.threadsError) {
    parts.push(`Threads failed: ${result.threadsError}`)
    hasError = true
  }
  if (result.youtube) parts.push('Shorts ✓')
  if (result.youtubeError) {
    parts.push(`Shorts failed: ${result.youtubeError}`)
    hasError = true
  }
  return { text: parts.join(' · '), hasError }
}
