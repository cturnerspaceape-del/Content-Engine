import type { Request, Response } from 'express'
import {
  getFacebookPageId,
  getFacebookPageName,
  publishFacebookMultiPhoto,
  publishFacebookPhoto,
} from './facebook'

type Format = 'Single Image' | 'Carousel'

interface PublishBody {
  format?: Format
  imageUrl?: string
  slideUrls?: string[]
  caption?: string
  hashtags?: string[]
}

export async function publishToFacebookHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as PublishBody
  const format = body.format

  if (!format || !['Single Image', 'Carousel'].includes(format)) {
    res.status(400).json({ ok: false, error: `Invalid format: ${format}` })
    return
  }

  try {
    let result: { postId: string; permalink?: string }

    if (format === 'Single Image') {
      if (!body.imageUrl) throw new Error('imageUrl is required')
      result = await publishFacebookPhoto({
        imageUrl: body.imageUrl,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    } else {
      const slides = (body.slideUrls ?? []).filter((u): u is string => typeof u === 'string' && u.length > 0)
      result = await publishFacebookMultiPhoto({
        imageUrls: slides,
        caption: body.caption ?? '',
        hashtags: body.hashtags,
      })
    }

    res.json({ ok: true, postId: result.postId, permalink: result.permalink })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[facebook] publish failed:', message)
    res.status(500).json({ ok: false, error: message })
  }
}

export async function getFacebookAccountHandler(_req: Request, res: Response): Promise<void> {
  try {
    const [pageId, pageName] = await Promise.all([getFacebookPageId(), getFacebookPageName()])
    res.json({ ok: true, pageId, pageName })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
}
