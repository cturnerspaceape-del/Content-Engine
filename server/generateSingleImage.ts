// Research-driven single-image generation. The user picks one of three
// research-LLM-produced prompts; this handler sends that prompt verbatim
// (plus the literal word "photorealistic") to the image model with one
// random reference picked from the brand pool. No brand bible, no
// reference key, no shot templates — research output is the sole source
// of visual direction.
//
// Non-research generation is deliberately unsupported: the handler
// rejects 400 if the `prompt` field is missing or empty.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadReferenceByManifestKey, pickOneRandomBrandRef } from './referenceImages'
import { resolveResearchInspo } from './researchInspo'

interface GenerateBody {
  // The selected research prompt (was researchShotBrief). The image model
  // receives this verbatim followed by the literal word "photorealistic".
  prompt?: string
  // Optional research-resolved imagery. When provided AND a fetch succeeds,
  // we use the trend image as the reference instead of the random brand
  // ref. Lets a passport-booth seed anchor visually to the actual research
  // hit when one exists.
  researchSourceUrls?: string[]
  researchSourceImageUrls?: string[]
  variationSeed?: number
}

const CACHE_VERSION = 9 // bumped for the simplified research-only flow

export async function generateSingleImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateBody
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      res.status(400).json({
        error: 'missing required field: prompt (research-driven flow only — non-research generation is unsupported)',
      })
      return
    }

    const { researchSourceUrls, researchSourceImageUrls, variationSeed } = body

    // Reference resolution: try research source URLs first; if none resolve,
    // fall back to one random brand ref. Either way we send exactly one
    // reference image (or zero, if nothing's available).
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
    const { absPath, publicUrl } = cachePath(hash)

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
      console.log(`\n[generate-single-image] ref=${refLabel}\n${fullPrompt}\n`)
    }

    const png = await generateImage({ prompt: fullPrompt, references })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash })
  } catch (err) {
    console.error('[generate-single-image]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
