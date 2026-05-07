import { absolutize, requireEnv } from './graph'

// Threads has its own Graph host — separate from graph.facebook.com — and a
// separate access token (scopes: threads_basic, threads_content_publish).
// Shape mirrors the IG container → publish flow but the host and field names
// differ enough that we don't reuse server/graph.ts's graphFetch directly.

export const THREADS_GRAPH_BASE = 'https://graph.threads.net/v1.0'

const THREADS_CHAR_LIMIT = 500

interface PublishResult {
  mediaId: string
  permalink?: string
}

interface ThreadsError {
  error?: { message?: string; type?: string; code?: number }
}

let cachedUserId: string | null = null
let cachedUsername: string | null = null

function getToken(): string {
  return requireEnv('THREADS_ACCESS_TOKEN')
}

function buildThreadsText(caption: string, hashtags?: string[]): string {
  const cleanTags = (hashtags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
  const body = caption.trim()
  const tagLine = cleanTags.join(' ')
  const combined = tagLine ? `${body}\n\n${tagLine}` : body
  if (combined.length <= THREADS_CHAR_LIMIT) return combined
  const room = THREADS_CHAR_LIMIT - (tagLine ? tagLine.length + 2 : 0) - 1
  const truncatedBody = body.slice(0, Math.max(0, room)).trimEnd() + '…'
  return tagLine ? `${truncatedBody}\n\n${tagLine}` : truncatedBody
}

async function threadsFetch(
  endpoint: string,
  init: {
    method: 'GET' | 'POST'
    token: string
    params?: Record<string, string | undefined>
    body?: Record<string, string | undefined>
  },
): Promise<any> {
  const url = new URL(`${THREADS_GRAPH_BASE}${endpoint}`)
  if (init.method === 'GET') {
    url.searchParams.set('access_token', init.token)
    for (const [k, v] of Object.entries(init.params ?? {})) {
      if (v !== undefined) url.searchParams.set(k, v)
    }
    const res = await fetch(url.toString())
    const json = (await res.json()) as ThreadsError & Record<string, any>
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Threads API ${res.status}`)
    }
    return json
  }
  const form = new URLSearchParams()
  form.set('access_token', init.token)
  for (const [k, v] of Object.entries(init.body ?? {})) {
    if (v !== undefined) form.set(k, v)
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  const json = (await res.json()) as ThreadsError & Record<string, any>
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Threads API ${res.status}`)
  }
  return json
}

export async function getThreadsUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId
  const envId = process.env.THREADS_USER_ID
  if (envId) {
    cachedUserId = envId
    return envId
  }
  // /me on threads returns id + username when threads_basic is granted.
  const me = await threadsFetch('/me', {
    method: 'GET',
    token: getToken(),
    params: { fields: 'id,username' },
  })
  if (!me?.id) throw new Error('Threads /me did not return an id')
  cachedUserId = me.id as string
  cachedUsername = me.username ?? null
  return cachedUserId
}

export async function getThreadsUsername(): Promise<string | null> {
  if (cachedUsername) return cachedUsername
  try {
    await getThreadsUserId()
    return cachedUsername
  } catch {
    return null
  }
}

async function createContainer(body: Record<string, string | undefined>): Promise<string> {
  const userId = await getThreadsUserId()
  const res = await threadsFetch(`/${userId}/threads`, {
    method: 'POST',
    token: getToken(),
    body,
  })
  if (!res.id) throw new Error('Threads API did not return a container id')
  return res.id as string
}

async function publishContainer(creationId: string): Promise<PublishResult> {
  const userId = await getThreadsUserId()
  const res = await threadsFetch(`/${userId}/threads_publish`, {
    method: 'POST',
    token: getToken(),
    body: { creation_id: creationId },
  })
  if (!res.id) throw new Error('Threads API did not return a published media id')
  const mediaId = res.id as string
  let permalink: string | undefined
  try {
    const info = await threadsFetch(`/${mediaId}`, {
      method: 'GET',
      token: getToken(),
      params: { fields: 'permalink' },
    })
    permalink = info.permalink
  } catch {
    /* ignore */
  }
  return { mediaId, permalink }
}

async function waitForContainerReady(containerId: string, timeoutMs = 180_000): Promise<void> {
  const started = Date.now()
  let delay = 3_000
  while (Date.now() - started < timeoutMs) {
    const info = await threadsFetch(`/${containerId}`, {
      method: 'GET',
      token: getToken(),
      params: { fields: 'status' },
    })
    const status = info.status as string | undefined
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Threads container status: ${status}`)
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.2, 8_000)
  }
  throw new Error('Timed out waiting for Threads to process the video (3 min).')
}

export async function publishThreadsText(args: {
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const text = buildThreadsText(args.caption, args.hashtags)
  if (!text) throw new Error('Threads text post requires a non-empty caption')
  const containerId = await createContainer({ media_type: 'TEXT', text })
  return publishContainer(containerId)
}

export async function publishThreadsImage(args: {
  imageUrl: string
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const text = buildThreadsText(args.caption, args.hashtags)
  const containerId = await createContainer({
    media_type: 'IMAGE',
    image_url: absolutize(args.imageUrl),
    text,
  })
  return publishContainer(containerId)
}

export async function publishThreadsCarousel(args: {
  slideUrls: string[]
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  if (args.slideUrls.length < 2 || args.slideUrls.length > 20) {
    throw new Error(`Threads carousels require 2-20 items (got ${args.slideUrls.length}).`)
  }
  const text = buildThreadsText(args.caption, args.hashtags)
  const childIds = await Promise.all(
    args.slideUrls.map((url) =>
      createContainer({
        media_type: 'IMAGE',
        image_url: absolutize(url),
        is_carousel_item: 'true',
      }),
    ),
  )
  const parentId = await createContainer({
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    text,
  })
  return publishContainer(parentId)
}

// Refreshes a long-lived Threads token. The Threads API uses
// grant_type=th_refresh_token (parallel to Meta's fb_exchange_token).
// Returns the new token + expiry in seconds.
export async function refreshThreadsToken(): Promise<{ accessToken: string; expiresInSec: number }> {
  const url = new URL(`${THREADS_GRAPH_BASE}/refresh_access_token`)
  url.searchParams.set('grant_type', 'th_refresh_token')
  url.searchParams.set('access_token', getToken())
  const res = await fetch(url.toString())
  const json = (await res.json()) as
    | { access_token: string; expires_in: number; token_type: string }
    | ThreadsError
  if ('error' in json) throw new Error(json.error?.message ?? 'Threads token refresh failed')
  return { accessToken: json.access_token, expiresInSec: json.expires_in }
}
