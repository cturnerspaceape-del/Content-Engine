import { promises as fs } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { TwitterApi } from 'twitter-api-v2'
import { absolutize, requireEnv } from './graph'

// X (Twitter) API v2 client. Posting tweets requires the Basic tier ($200/mo
// as of 2025). OAuth 2.0 with PKCE; refresh tokens rotate on each use, so we
// update process.env.X_REFRESH_TOKEN in memory and the user has to manually
// rotate Railway's env var occasionally — same trade-off as Threads.

export const X_OAUTH_REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'
export const X_OAUTH_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'media.write',
  'offline.access',
]

interface PublishResult {
  tweetId: string
  permalink: string
}

interface ItemLike {
  generatedVisual?: {
    format: 'Single Image' | 'Carousel'
    imageUrl?: string
    slideUrls?: (string | null)[]
  }
}

export function buildAppOnlyClient(): TwitterApi {
  // For OAuth helper script (xAuth.ts) — only needs clientId + clientSecret.
  return new TwitterApi({
    clientId: requireEnv('X_CLIENT_ID'),
    clientSecret: requireEnv('X_CLIENT_SECRET'),
  })
}

// Refreshed each time we publish — twitter-api-v2 rotates refresh_token on
// every call, so we cache the latest one in memory only (Railway env value
// goes stale eventually; user must reconnect via tsx server/xAuth.ts).
async function getAuthedClient(): Promise<TwitterApi> {
  const refreshToken = requireEnv('X_REFRESH_TOKEN')
  const app = buildAppOnlyClient()
  const { client, refreshToken: nextRefreshToken } = await app.refreshOAuth2Token(refreshToken)
  if (nextRefreshToken && nextRefreshToken !== refreshToken) {
    process.env.X_REFRESH_TOKEN = nextRefreshToken
  }
  return client
}

interface AccountInfo {
  id: string
  username: string
  name: string
}

export async function getXAccount(): Promise<AccountInfo> {
  const client = await getAuthedClient()
  const me = await client.v2.me()
  return {
    id: me.data.id,
    username: me.data.username,
    name: me.data.name,
  }
}

async function downloadToTemp(url: string, ext: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch media for X (${res.status} ${res.statusText})`)
  const buf = Buffer.from(await res.arrayBuffer())
  const tmpPath = path.join(
    tmpdir(),
    `x-upload-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
  )
  await fs.writeFile(tmpPath, buf)
  return tmpPath
}

const X_TEXT_LIMIT = 280

function truncateForX(text: string): string {
  const t = text.trim()
  if (t.length <= X_TEXT_LIMIT) return t
  return t.slice(0, X_TEXT_LIMIT - 1).trimEnd() + '…'
}

async function uploadImage(client: TwitterApi, url: string): Promise<string> {
  const tmp = await downloadToTemp(url, '.jpg')
  try {
    return await client.v2.uploadMedia(tmp, { media_type: 'image/jpeg' })
  } finally {
    await fs.unlink(tmp).catch(() => {})
  }
}

export async function publishItemToX(args: {
  item: ItemLike
  caption: string
}): Promise<PublishResult> {
  const text = truncateForX(args.caption)
  const v = args.item.generatedVisual
  if (!v) {
    // Text-only tweet path
    const client = await getAuthedClient()
    const tweet = await client.v2.tweet({ text })
    return buildResult(tweet.data.id)
  }

  const client = await getAuthedClient()

  if (v.format === 'Single Image') {
    if (!v.imageUrl) throw new Error('Single Image requires imageUrl')
    const mediaId = await uploadImage(client, absolutize(v.imageUrl))
    const tweet = await client.v2.tweet({ text, media: { media_ids: [mediaId] } })
    return buildResult(tweet.data.id)
  }

  if (v.format === 'Carousel') {
    const slides = (v.slideUrls ?? []).filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    )
    if (slides.length === 0) throw new Error('Carousel has no slides to post')
    if (slides.length > 4) {
      throw new Error(
        `X allows up to 4 images per tweet (carousel has ${slides.length}). Threading isn't supported in this round.`,
      )
    }
    const mediaIds = await Promise.all(slides.map((url) => uploadImage(client, absolutize(url))))
    // twitter-api-v2 types media_ids as a fixed-length tuple of 1..4 strings.
    const tuple = mediaIds as [string, ...string[]] & { length: 1 | 2 | 3 | 4 }
    const tweet = await client.v2.tweet({ text, media: { media_ids: tuple } })
    return buildResult(tweet.data.id)
  }

  throw new Error(`Unsupported format for X: ${(v as { format: string }).format}`)
}

function buildResult(tweetId: string): PublishResult {
  return { tweetId, permalink: `https://x.com/i/status/${tweetId}` }
}
