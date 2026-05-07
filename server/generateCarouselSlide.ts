// Research-driven carousel slide generation. Same shape as the single-image
// flow: one selected research prompt drives every slide, with an LLM picker
// choosing 0–2 references from the unified product+brand catalog per slide.
// Per-slide differentiation comes from slideIndex + carouselSeed in the
// cache key so every slide resolves to a distinct cached PNG.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadRefsByKeys, pickFallbackFlavor } from './referenceImages'
import { pickRefsForPrompt } from './pickRefsForPrompt'
import { buildCompositeSuffix } from './compositeSuffix'
import type { SpaceApeFlavor } from '../src/remotion/types'

interface GenerateBody {
  prompt?: string
  slideIndex?: number
  carouselSeed?: number
  variationSeed?: number
  flavor?: SpaceApeFlavor
}

const CACHE_VERSION = 8 // brand-ref-default + composite suffix

export async function generateCarouselSlideHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateBody
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      res.status(400).json({
        error: 'missing required field: prompt (research-driven flow only)',
      })
      return
    }
    const { slideIndex, carouselSeed, variationSeed } = body
    if (typeof slideIndex !== 'number' || typeof carouselSeed !== 'number') {
      res.status(400).json({
        error: 'missing required fields: slideIndex, carouselSeed',
      })
      return
    }

    const flavor = body.flavor ?? pickFallbackFlavor()

    const picked = await pickRefsForPrompt({ prompt, flavor, maxRefs: 2 })

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      slideIndex,
      carouselSeed,
      flavor,
      pickedKeys: [...picked.keys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'carousel-slide')

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash })
      return
    }

    const refs: ReferenceImage[] = await loadRefsByKeys(picked.keys)
    const fullPrompt = `${prompt}\n\nphotorealistic${buildCompositeSuffix(picked.keys)}`

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[generate-carousel-slide] slide=${slideIndex} flavor=${flavor} picked=[${picked.keys.join(', ') || 'none'}] reasoning=${picked.reasoning ?? '-'}\n${fullPrompt}\n`,
      )
    }

    const png = await generateImage({ prompt: fullPrompt, references: refs })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash })
  } catch (err) {
    console.error('[generate-carousel-slide]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
