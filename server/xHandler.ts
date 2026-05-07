import type { Request, Response } from 'express'
import { getXAccount, publishItemToX } from './x'
import { recordPublishError } from './publishErrorLog'

interface PublishBody {
  format?: 'Single Image' | 'Carousel'
  imageUrl?: string
  slideUrls?: string[]
  caption?: string
  // Hashtags are optional — X tuner returns empty hashtags array; the caption
  // already includes any voice-aligned tagging. If callers do send them we
  // append them inline (X has no separate tag field).
  hashtags?: string[]
}

export async function publishToXHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as PublishBody
  const format = body.format
  if (!format || !['Single Image', 'Carousel'].includes(format)) {
    res.status(400).json({ ok: false, error: `Invalid format: ${format}` })
    return
  }

  // Reconstruct the minimal item shape publishItemToX expects.
  const item = {
    generatedVisual: {
      format,
      imageUrl: body.imageUrl,
      slideUrls: body.slideUrls,
    },
  }

  const tagSuffix = (body.hashtags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ')
  const caption = [body.caption ?? '', tagSuffix].filter(Boolean).join(' ').trim()

  try {
    const result = await publishItemToX({ item, caption })
    res.json({ ok: true, tweetId: result.tweetId, permalink: result.permalink })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[x] publish failed:', message)
    void recordPublishError({ platform: 'x', format, message })
    res.status(500).json({ ok: false, error: message })
  }
}

export async function getXAccountHandler(_req: Request, res: Response): Promise<void> {
  try {
    const info = await getXAccount()
    res.json({ ok: true, id: info.id, username: info.username, name: info.name })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
}
