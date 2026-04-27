import type { Request, Response } from 'express'
import { publishShort } from './youtube'
import { recordPublishError } from './publishErrorLog'

interface PublishBody {
  format?: 'Single Image' | 'Reel' | 'Carousel'
  videoUrl?: string
  caption?: string
  hashtags?: string[]
}

export async function publishToYouTubeHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as PublishBody
  if (body.format && body.format !== 'Reel') {
    res.status(400).json({
      ok: false,
      error: `YouTube Shorts requires a video — got format "${body.format}".`,
    })
    return
  }
  if (!body.videoUrl) {
    res.status(400).json({ ok: false, error: 'videoUrl is required' })
    return
  }
  try {
    const result = await publishShort({
      videoUrl: body.videoUrl,
      caption: body.caption ?? '',
      hashtags: body.hashtags,
    })
    res.json({ ok: true, videoId: result.videoId, permalink: result.permalink })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[youtube] publish failed:', message)
    void recordPublishError({ platform: 'youtube', format: 'Reel', message })
    res.status(500).json({ ok: false, error: message })
  }
}
