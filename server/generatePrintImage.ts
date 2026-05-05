// Research-driven print image generation. Mirrors single-image / email
// flows: prompt verbatim + "photorealistic" + one random brand ref.
// Piece type is preserved on the response (and in the cache key) so
// each piece type gets its own cache slot even when given identical
// prompts.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadReferenceByManifestKey, pickOneRandomBrandRef } from './referenceImages'

type PieceType = 'poster' | 'trifold-panel' | 'sticker'

interface GeneratePrintImageBody {
  pieceType: PieceType
  prompt?: string
  flavor?: string
  variationSeed?: number
}

const CACHE_VERSION = 3 // bumped for the simplified research-only flow

const FALLBACK_FLAVORS = [
  'Amped Apple',
  'Blue Frenzy',
  'Blue Zlushie',
  'Dragon Drip',
  'Lemon Cherry Slam',
] as const

function pickFallbackFlavor(): string {
  return FALLBACK_FLAVORS[Math.floor(Math.random() * FALLBACK_FLAVORS.length)]
}

const VALID_PIECES: ReadonlySet<PieceType> = new Set(['poster', 'trifold-panel', 'sticker'])

export async function generatePrintImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GeneratePrintImageBody
    const { pieceType, variationSeed } = body
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    let { flavor } = body

    if (!pieceType || !prompt) {
      res.status(400).json({ error: 'missing required fields: pieceType, prompt' })
      return
    }
    if (!VALID_PIECES.has(pieceType)) {
      res.status(400).json({ error: `unknown pieceType: ${pieceType}` })
      return
    }
    if (!flavor) flavor = pickFallbackFlavor()

    const brandRefKey = await pickOneRandomBrandRef()

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      pieceType,
      prompt,
      brandRef: brandRefKey,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'print-image')

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash, flavor })
      return
    }

    const references: ReferenceImage[] = []
    if (brandRefKey) {
      const loaded = await loadReferenceByManifestKey(brandRefKey)
      if (loaded) references.push(loaded)
    }

    const fullPrompt = `${prompt}\n\nphotorealistic`

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[generate-print-image] pieceType=${pieceType} ref=${brandRefKey ?? 'none'}\n${fullPrompt}\n`,
      )
    }

    const png = await generateImage({ prompt: fullPrompt, references })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash, flavor })
  } catch (err) {
    console.error('[generate-print-image]', err)
    const message = err instanceof Error ? err.message : 'print image generation failed'
    res.status(500).json({ error: message })
  }
}
