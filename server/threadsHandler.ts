import type { Request, Response } from 'express'
import {
  getThreadsUserId,
  getThreadsUsername,
  publishThreadsCarousel,
  publishThreadsImage,
  publishThreadsText,
  publishThreadsVideo,
} from './threads'
import { recordPublishError } from './publishErrorLog'

type Format = 'Text' | 'Single Image' | 'Reel' | 'Carousel'

interface PublishBody {
  format?: Format
  imageUrl?: string
  videoUrl?: string
  slideUrls?: string[]
  caption?: string
  hashtags?: string[]
}

export async function publishToThreadsHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as PublishBody
  const format = body.format

  if (!format || !['Text', 'Single Image', 'Reel', 'Carousel'].includes(format)) {
    res.status(400).json({ ok: false, error: `Invalid format: ${format}` })
    return
  }

  try {
    let result: { mediaId: string; permalink?: string }
    if (format === 'Text') {
      result = await publishThreadsText({
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    } else if (format === 'Single Image') {
      if (!body.imageUrl) throw new Error('imageUrl is required for Single Image')
      result = await publishThreadsImage({
        imageUrl: body.imageUrl,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    } else if (format === 'Reel') {
      if (!body.videoUrl) throw new Error('videoUrl is required for Reel')
      result = await publishThreadsVideo({
        videoUrl: body.videoUrl,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    } else {
      const slides = (body.slideUrls ?? []).filter(
        (u): u is string => typeof u === 'string' && u.length > 0,
      )
      result = await publishThreadsCarousel({
        slideUrls: slides,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    }
    res.json({ ok: true, mediaId: result.mediaId, permalink: result.permalink })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[threads] publish failed:', message)
    void recordPublishError({ platform: 'threads', format, message })
    res.status(500).json({ ok: false, error: message })
  }
}

export async function getThreadsAccountHandler(_req: Request, res: Response): Promise<void> {
  try {
    const [id, username] = await Promise.all([getThreadsUserId(), getThreadsUsername()])
    res.json({ ok: true, id, username })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
}
