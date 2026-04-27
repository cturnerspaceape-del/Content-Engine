import { promises as fs, createReadStream } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { absolutize, requireEnv } from './graph'

// YouTube Data API v3 — videos.insert with resumable upload.
// Quota: 10K units/day, video upload = 1600 units → ~6 uploads/day on free tier.
// Refresh tokens never expire (unless revoked or 6 months idle).

const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

interface PublishResult {
  videoId: string
  permalink: string
}

export function buildOAuthClient(): OAuth2Client {
  const clientId = requireEnv('GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = requireEnv('GOOGLE_OAUTH_CLIENT_SECRET')
  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)
}

function buildAuthedClient(): OAuth2Client {
  const refreshToken = requireEnv('YOUTUBE_REFRESH_TOKEN')
  const client = buildOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  return client
}

export function getConsentUrl(): string {
  const client = buildOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function exchangeCodeForRefreshToken(code: string): Promise<string> {
  const client = buildOAuthClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) {
    throw new Error(
      'No refresh_token returned. Make sure access_type=offline and prompt=consent. '
        + 'If you authorized this app before, revoke at https://myaccount.google.com/permissions and retry.',
    )
  }
  return tokens.refresh_token
}

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch video for upload (${res.status} ${res.statusText})`)
  const buf = Buffer.from(await res.arrayBuffer())
  const tmpPath = path.join(tmpdir(), `yt-upload-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`)
  await fs.writeFile(tmpPath, buf)
  return tmpPath
}

const TITLE_LIMIT = 100
const DESC_LIMIT = 5000

function buildShortTitle(caption: string): string {
  // Strip hashtags; pull a clean clickable line. Always append #Shorts.
  const stripped = caption
    .replace(/\s*#[\w]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const room = TITLE_LIMIT - ' #Shorts'.length
  const head = stripped.length > room ? stripped.slice(0, Math.max(0, room - 1)).trimEnd() + '…' : stripped
  return `${head} #Shorts`.trim()
}

function buildShortDescription(caption: string, hashtags?: string[]): string {
  const cleanTags = (hashtags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
  const tagLine = cleanTags.includes('#Shorts')
    ? cleanTags.join(' ')
    : ['#Shorts', ...cleanTags].join(' ')
  const combined = [caption.trim(), tagLine].filter(Boolean).join('\n\n')
  if (combined.length <= DESC_LIMIT) return combined
  return combined.slice(0, DESC_LIMIT - 1).trimEnd() + '…'
}

export async function publishShort(args: {
  videoUrl: string
  caption: string
  hashtags?: string[]
}): Promise<PublishResult> {
  const auth = buildAuthedClient()
  const youtube = google.youtube({ version: 'v3', auth })
  const absoluteUrl = absolutize(args.videoUrl)
  const tmpPath = await downloadToTemp(absoluteUrl)
  try {
    const title = buildShortTitle(args.caption)
    const description = buildShortDescription(args.caption, args.hashtags)
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          categoryId: '22', // People & Blogs — safe default for brand content.
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      },
      media: { body: createReadStream(tmpPath) },
    })
    const videoId = res.data.id
    if (!videoId) throw new Error('YouTube videos.insert did not return an id')
    return { videoId, permalink: `https://youtube.com/shorts/${videoId}` }
  } finally {
    await fs.unlink(tmpPath).catch(() => {
      /* best-effort cleanup */
    })
  }
}
