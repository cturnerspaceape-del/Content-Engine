import { buildCaption } from '../src/lib/instagramCaption'
import { absolutize, graphFetch, requireEnv } from './graph'

interface PublishResult {
  mediaId: string
  permalink?: string
}

let cachedAccountId: string | null = null
let cachedUsername: string | null = null

function getToken(): string {
  return requireEnv('INSTAGRAM_ACCESS_TOKEN')
}

export async function getBusinessAccountId(): Promise<string> {
  if (cachedAccountId) return cachedAccountId
  const envId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (envId) {
    cachedAccountId = envId
    return envId
  }
  // /me/accounts returns Pages; the IG business account is nested on each Page.
  const pages = await graphFetch('/me/accounts', {
    method: 'GET',
    token: getToken(),
    params: { fields: 'instagram_business_account,name' },
  })
  const pagesData: Array<{ instagram_business_account?: { id: string }; name?: string }> = pages.data ?? []
  const withIg = pagesData.find((p) => p.instagram_business_account?.id)
  if (!withIg?.instagram_business_account?.id) {
    throw new Error(
      'No Instagram business account linked to any Facebook Page on this token. Connect an IG business account to a Page in Meta Business Suite, then retry.',
    )
  }
  cachedAccountId = withIg.instagram_business_account.id
  return cachedAccountId
}

export async function getBusinessUsername(): Promise<string | null> {
  if (cachedUsername) return cachedUsername
  try {
    const igId = await getBusinessAccountId()
    const info = await graphFetch(`/${igId}`, {
      method: 'GET',
      token: getToken(),
      params: { fields: 'username' },
    })
    cachedUsername = info.username ?? null
    return cachedUsername
  } catch {
    return null
  }
}

async function createContainer(body: Record<string, string | undefined>): Promise<string> {
  const igId = await getBusinessAccountId()
  const res = await graphFetch(`/${igId}/media`, { method: 'POST', token: getToken(), body })
  if (!res.id) throw new Error('Graph API did not return a container id')
  return res.id as string
}

async function publishContainer(creationId: string): Promise<PublishResult> {
  const igId = await getBusinessAccountId()
  const res = await graphFetch(`/${igId}/media_publish`, {
    method: 'POST',
    token: getToken(),
    body: { creation_id: creationId },
  })
  if (!res.id) throw new Error('Graph API did not return a published media id')
  const mediaId = res.id as string
  // Fetch permalink — best-effort; not fatal if it fails.
  let permalink: string | undefined
  try {
    const info = await graphFetch(`/${mediaId}`, {
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
    const info = await graphFetch(`/${containerId}`, {
      method: 'GET',
      token: getToken(),
      params: { fields: 'status_code' },
    })
    const status = info.status_code as string | undefined
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Graph API container status: ${status}`)
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.2, 8_000)
  }
  throw new Error('Timed out waiting for Instagram to process the video (3 min).')
}

export async function publishSingleImage(args: {
  imageUrl: string
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const caption = buildCaption({ caption: args.caption, hashtags: args.hashtags })
  const containerId = await createContainer({
    image_url: absolutize(args.imageUrl),
    caption,
  })
  return publishContainer(containerId)
}

export async function publishReel(args: {
  videoUrl: string
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const caption = buildCaption({ caption: args.caption, hashtags: args.hashtags })
  const containerId = await createContainer({
    media_type: 'REELS',
    video_url: absolutize(args.videoUrl),
    caption,
  })
  await waitForContainerReady(containerId)
  return publishContainer(containerId)
}

export async function publishCarousel(args: {
  slideUrls: string[]
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  if (args.slideUrls.length < 2 || args.slideUrls.length > 10) {
    throw new Error(`Instagram carousels require 2-10 slides (got ${args.slideUrls.length}).`)
  }
  const caption = buildCaption({ caption: args.caption, hashtags: args.hashtags })
  const childIds = await Promise.all(
    args.slideUrls.map((url) =>
      createContainer({ image_url: absolutize(url), is_carousel_item: 'true' }),
    ),
  )
  const parentId = await createContainer({
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
  })
  return publishContainer(parentId)
}

export async function publishStory(args: {
  imageUrl?: string
  videoUrl?: string
}): Promise<PublishResult> {
  if (args.imageUrl) {
    const containerId = await createContainer({
      media_type: 'STORIES',
      image_url: absolutize(args.imageUrl),
    })
    return publishContainer(containerId)
  }
  if (args.videoUrl) {
    const containerId = await createContainer({
      media_type: 'STORIES',
      video_url: absolutize(args.videoUrl),
    })
    await waitForContainerReady(containerId)
    return publishContainer(containerId)
  }
  throw new Error('publishStory requires either imageUrl or videoUrl')
}
