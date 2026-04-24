import { buildCaption } from '../src/lib/instagramCaption'
import { GRAPH_BASE, absolutize, graphFetch, requireEnv } from './graph'

interface PublishResult {
  postId: string
  permalink?: string
}

let cachedPageId: string | null = null
let cachedPageToken: string | null = null
let cachedPageName: string | null = null

function getUserToken(): string {
  // Same long-lived user token used for IG. /me/accounts on this token returns
  // Pages with per-Page access tokens attached.
  return requireEnv('INSTAGRAM_ACCESS_TOKEN')
}

async function resolvePageFromUserToken(): Promise<{ id: string; token: string; name: string }> {
  const pages = await graphFetch('/me/accounts', {
    method: 'GET',
    token: getUserToken(),
    params: { fields: 'id,name,access_token,instagram_business_account' },
  })
  const data: Array<{
    id: string
    name: string
    access_token?: string
    instagram_business_account?: { id: string }
  }> = pages.data ?? []
  // Prefer the Page that already has an IG business account attached — that's
  // the one the user is actively posting to via IG, so cross-posting to the
  // same Page is the expected behavior.
  const preferred = data.find((p) => p.instagram_business_account?.id) ?? data[0]
  if (!preferred) {
    throw new Error(
      'No Facebook Pages on this token. Create a Page for the brand and make sure it is admin-accessible to the token owner.',
    )
  }
  if (!preferred.access_token) {
    throw new Error(
      `Page "${preferred.name}" has no access_token on /me/accounts — the token is missing pages_show_list or pages_read_engagement scope.`,
    )
  }
  return { id: preferred.id, token: preferred.access_token, name: preferred.name }
}

export async function getFacebookPageId(): Promise<string> {
  if (cachedPageId) return cachedPageId
  const envId = process.env.FACEBOOK_PAGE_ID
  if (envId) {
    cachedPageId = envId
    return envId
  }
  const page = await resolvePageFromUserToken()
  cachedPageId = page.id
  cachedPageToken = page.token
  cachedPageName = page.name
  return cachedPageId
}

export async function getFacebookPageToken(): Promise<string> {
  if (cachedPageToken) return cachedPageToken
  const envToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  if (envToken) {
    cachedPageToken = envToken
    return envToken
  }
  const page = await resolvePageFromUserToken()
  cachedPageId = page.id
  cachedPageToken = page.token
  cachedPageName = page.name
  return cachedPageToken
}

export async function getFacebookPageName(): Promise<string | null> {
  if (cachedPageName) return cachedPageName
  try {
    const pageId = await getFacebookPageId()
    const token = await getFacebookPageToken()
    const info = await graphFetch(`/${pageId}`, {
      method: 'GET',
      token,
      params: { fields: 'name' },
    })
    cachedPageName = info.name ?? null
    return cachedPageName
  } catch {
    return null
  }
}

async function fetchPermalink(objectId: string, token: string): Promise<string | undefined> {
  try {
    const info = await graphFetch(`/${objectId}`, {
      method: 'GET',
      token,
      params: { fields: 'permalink_url' },
    })
    return info.permalink_url
  } catch {
    return undefined
  }
}

export async function publishFacebookPhoto(args: {
  imageUrl: string
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const pageId = await getFacebookPageId()
  const token = await getFacebookPageToken()
  const caption = buildCaption({ caption: args.caption, hashtags: args.hashtags })
  const res = await graphFetch(`/${pageId}/photos`, {
    method: 'POST',
    token,
    body: {
      url: absolutize(args.imageUrl),
      caption,
      published: 'true',
    },
  })
  const postId = (res.post_id ?? res.id) as string | undefined
  if (!postId) throw new Error('Graph API did not return a post id for Facebook photo')
  const permalink = await fetchPermalink(postId, token)
  return { postId, permalink }
}

export async function publishFacebookMultiPhoto(args: {
  imageUrls: string[]
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  if (args.imageUrls.length < 2) {
    throw new Error(`Facebook multi-photo posts need at least 2 images (got ${args.imageUrls.length}).`)
  }
  const pageId = await getFacebookPageId()
  const token = await getFacebookPageToken()
  const caption = buildCaption({ caption: args.caption, hashtags: args.hashtags })
  // Upload each photo unpublished to get media fbids.
  const mediaIds = await Promise.all(
    args.imageUrls.map(async (url) => {
      const res = await graphFetch(`/${pageId}/photos`, {
        method: 'POST',
        token,
        body: {
          url: absolutize(url),
          published: 'false',
        },
      })
      if (!res.id) throw new Error('Graph API did not return a media id for Facebook multi-photo upload')
      return res.id as string
    }),
  )
  // attached_media must be JSON array — encode via body (URLSearchParams will handle escaping).
  const attached = JSON.stringify(mediaIds.map((id) => ({ media_fbid: id })))
  const feedRes = await graphFetch(`/${pageId}/feed`, {
    method: 'POST',
    token,
    body: {
      message: caption,
      attached_media: attached,
    },
  })
  const postId = feedRes.id as string | undefined
  if (!postId) throw new Error('Graph API did not return a post id for Facebook multi-photo feed post')
  const permalink = await fetchPermalink(postId, token)
  return { postId, permalink }
}

async function startReel(pageId: string, token: string): Promise<{ videoId: string; uploadUrl: string }> {
  const res = await graphFetch(`/${pageId}/video_reels`, {
    method: 'POST',
    token,
    body: { upload_phase: 'start' },
  })
  const videoId = res.video_id as string | undefined
  const uploadUrl = res.upload_url as string | undefined
  if (!videoId || !uploadUrl) {
    throw new Error('Graph API start-phase response missing video_id or upload_url')
  }
  return { videoId, uploadUrl }
}

async function transferReelByUrl(uploadUrl: string, pageToken: string, videoUrl: string): Promise<void> {
  // Hosted-file upload: rupload.facebook.com accepts a file_url header and fetches
  // the MP4 from our PUBLIC_BASE_URL. Body is empty.
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${pageToken}`,
      file_url: videoUrl,
    },
  })
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } }
  if (!res.ok || json.error || json.success === false) {
    throw new Error(json.error?.message || `Reel upload transfer failed (${res.status})`)
  }
}

async function waitForReelReady(videoId: string, token: string, timeoutMs = 300_000): Promise<void> {
  const started = Date.now()
  let delay = 3_000
  while (Date.now() - started < timeoutMs) {
    const info = await graphFetch(`/${videoId}`, {
      method: 'GET',
      token,
      params: { fields: 'status' },
    })
    const status = info?.status as { video_status?: string; uploading_phase?: { status?: string } } | undefined
    const videoStatus = status?.video_status
    if (videoStatus === 'ready' || videoStatus === 'upload_complete') return
    if (videoStatus === 'error' || videoStatus === 'expired') {
      throw new Error(`Facebook Reel status: ${videoStatus}`)
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.2, 8_000)
  }
  throw new Error('Timed out waiting for Facebook to process the Reel (5 min).')
}

async function finishReel(
  pageId: string,
  token: string,
  videoId: string,
  description: string,
): Promise<void> {
  // Finish phase uses query params, not body, per the Reels API docs.
  const url = new URL(`${GRAPH_BASE}/${pageId}/video_reels`)
  url.searchParams.set('access_token', token)
  url.searchParams.set('upload_phase', 'finish')
  url.searchParams.set('video_id', videoId)
  url.searchParams.set('video_state', 'PUBLISHED')
  if (description) url.searchParams.set('description', description)
  const res = await fetch(url.toString(), { method: 'POST' })
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    error?: { message?: string }
  }
  if (!res.ok || json.error || json.success === false) {
    throw new Error(json.error?.message || `Reel finish failed (${res.status})`)
  }
}

export async function publishFacebookReel(args: {
  videoUrl: string
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const pageId = await getFacebookPageId()
  const token = await getFacebookPageToken()
  const description = buildCaption({ caption: args.caption, hashtags: args.hashtags })
  const absoluteVideoUrl = absolutize(args.videoUrl)
  const { videoId, uploadUrl } = await startReel(pageId, token)
  await transferReelByUrl(uploadUrl, token, absoluteVideoUrl)
  await waitForReelReady(videoId, token)
  await finishReel(pageId, token, videoId, description)
  const permalink = await fetchPermalink(videoId, token)
  return { postId: videoId, permalink }
}
