// Research-driven carousel slide generation. Same shape as the single-image
// flow: one selected research prompt drives every slide. Each slide call
// sends the same prompt + the literal word "photorealistic" with one
// random brand reference; per-slide differentiation comes from the slide
// index and a variation seed encoded in the cache key.
//
// Carousel arcs / shot templates are no longer consulted on this path —
// research output is the sole source of visual direction.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadReferenceByManifestKey, pickOneRandomBrandRef } from './referenceImages'
import { resolveResearchInspo } from './researchInspo'

interface GenerateBody {
  // Selected research prompt. Sent verbatim followed by "photorealistic".
  prompt?: string
  // Slide identity. Same prompt across all slides; index + carouselSeed
  // (deterministic per-carousel) participate in the cache key so every slide
  // resolves to a distinct cached PNG.
  slideIndex?: number
  carouselSeed?: number
  variationSeed?: number
  researchSourceUrls?: string[]
  researchSourceImageUrls?: string[]
}

const CACHE_VERSION = 6 // bumped for the simplified research-only flow

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
    const { slideIndex, carouselSeed, variationSeed, researchSourceUrls, researchSourceImageUrls } = body
    if (typeof slideIndex !== 'number' || typeof carouselSeed !== 'number') {
      res.status(400).json({
        error: 'missing required fields: slideIndex, carouselSeed',
      })
      return
    }

    const researchInspo = await resolveResearchInspo({
      sourceImageUrls: researchSourceImageUrls,
      sourceUrls: researchSourceUrls,
      max: 1,
    })
    const useResearchInspo = researchInspo.length > 0
    const brandRefKey = useResearchInspo ? null : await pickOneRandomBrandRef()

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      prompt,
      slideIndex,
      carouselSeed,
      brandRef: brandRefKey,
      ...(useResearchInspo
        ? {
            researchInspoUrls: [
              ...(researchSourceImageUrls ?? []),
              ...(researchSourceUrls ?? []),
            ].sort(),
          }
        : {}),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'carousel-slide')

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash })
      return
    }

    const references: ReferenceImage[] = []
    if (useResearchInspo) {
      references.push(...researchInspo)
    } else if (brandRefKey) {
      const loaded = await loadReferenceByManifestKey(brandRefKey)
      if (loaded) references.push(loaded)
    }

    const fullPrompt = `${prompt}\n\nphotorealistic`

    if (process.env.NODE_ENV !== 'production') {
      const refLabel = useResearchInspo
        ? `research(${references.length})`
        : brandRefKey
          ? `brand(${brandRefKey})`
          : 'none'
      console.log(
        `\n[generate-carousel-slide] slide=${slideIndex} seed=${carouselSeed} ref=${refLabel}\n${fullPrompt}\n`,
      )
    }

    const png = await generateImage({ prompt: fullPrompt, references })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash })
  } catch (err) {
    console.error('[generate-carousel-slide]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
