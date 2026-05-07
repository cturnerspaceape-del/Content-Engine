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

