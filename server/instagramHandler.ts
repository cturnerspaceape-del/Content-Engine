import type { Request, Response } from 'express'
import {
  getBusinessAccountId,
  getBusinessUsername,
  publishCarousel,
  publishReel,
  publishSingleImage,
  publishStory,
} from './instagram'
import { recordPublishError } from './publishErrorLog'

type Destination = 'feed' | 'story'
type Format = 'Single Image' | 'Reel' | 'Carousel'

interface PublishBody {
  destination?: Destination
  format?: Format
  imageUrl?: string
  videoUrl?: string
  slideUrls?: string[]
  caption?: string
  hashtags?: string[]
}

export async function publishToInstagramHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as PublishBody
  const destination = body.destination ?? 'feed'
  const format = body.format

  if (destination !== 'feed' && destination !== 'story') {
    res.status(400).json({ ok: false, error: `Invalid destination: ${destination}` })
    return
  }
  if (!format || !['Single Image', 'Reel', 'Carousel'].includes(format)) {
    res.status(400).json({ ok: false, error: `Invalid format: ${format}` })
    return
  }
  if (destination === 'story' && format === 'Carousel') {
    res.status(400).json({ ok: false, error: 'Carousels cannot be posted to Stories.' })
    return
  }

  try {
    let result: { mediaId: string; permalink?: string }

    if (destination === 'story') {
      if (format === 'Single Image') {
        if (!body.imageUrl) throw new Error('imageUrl is required for Single Image story')
        result = await publishStory({ imageUrl: body.imageUrl })
      } else {
        if (!body.videoUrl) throw new Error('videoUrl is required for Reel story')
        result = await publishStory({ videoUrl: body.videoUrl })
      }
    } else if (format === 'Single Image') {
      if (!body.imageUrl) throw new Error('imageUrl is required')
      result = await publishSingleImage({
        imageUrl: body.imageUrl,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    } else if (format === 'Reel') {
      if (!body.videoUrl) throw new Error('videoUrl is required for Reel')
      result = await publishReel({
        videoUrl: body.videoUrl,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    } else {
      const slides = (body.slideUrls ?? []).filter((u): u is string => typeof u === 'string' && u.length > 0)
      result = await publishCarousel({
        slideUrls: slides,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    }

    res.json({ ok: true, mediaId: result.mediaId, permalink: result.permalink })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[instagram] publish failed:', message)
    void recordPublishError({ platform: 'instagram', format, destination, message })
    res.status(500).json({ ok: false, error: message })
  }
}

export async function getInstagramAccountHandler(_req: Request, res: Response): Promise<void> {
  try {
    const [id, username] = await Promise.all([getBusinessAccountId(), getBusinessUsername()])
    res.json({ ok: true, id, username })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
}
