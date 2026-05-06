// Research-driven email image generation. Mirrors the single-image flow
// (research-inspo → brand-ref fallback) but layers an editorial / hero-grade
// prompt suffix so email images read magazine-marketing rather than social-UGC.
// The `slot` field is preserved on the response (and in the cache key) so
// hero and product cells live in separate cache slots even when given
// identical prompts.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadReferenceByManifestKey, pickOneRandomBrandRef } from './referenceImages'
import { resolveResearchInspo } from './researchInspo'

interface GenerateEmailImageBody {
  slot: 'hero' | 'product'
  // Research-driven prompt for this slot.
  prompt?: string
  // Carried through onto the response so the email lab continues to know
  // which flavor was associated with the image (used in copy + downstream
  // cards). Optional — falls back to a random pick.
  flavor?: string
  // Research-resolved imagery (page URLs and direct image URLs from the
  // selected ResearchedSeed). When provided AND a fetch succeeds, used as
  // the reference instead of a random brand ref — same behavior as the
  // single-image path.
  researchSourceUrls?: string[]
  researchSourceImageUrls?: string[]
  variationSeed?: number
}

// Editorial / hero-grade direction layered on top of the research prompt so
// email images read magazine-marketing rather than social-UGC.
const EMAIL_STYLE_SUFFIX = [
  'photorealistic',
  'premium editorial product photography',
  'clean composition, soft studio lighting',
  'magazine-grade hero image',
  'Space Ape brand aesthetic — modern, hype-streetwear, future-cool',
].join(', ')

const CACHE_VERSION = 4 // v4: editorial suffix + research-inspo path

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

export async function generateEmailImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateEmailImageBody
    const { slot, variationSeed, researchSourceUrls, researchSourceImageUrls } = body
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    let { flavor } = body

    if (!slot || !prompt) {
      res.status(400).json({ error: 'missing required fields: slot, prompt' })
      return
    }
    if (!flavor) flavor = pickFallbackFlavor()

    // Reference resolution: research inspo first, then random brand ref.
    // Mirrors generateSingleImage / generateCarouselSlide so email images
    // anchor to the same on-trend imagery the other formats already use.
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
      slot,
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
    const { absPath, publicUrl } = cachePath(hash, 'email-image')

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash, flavor })
      return
    }

    const references: ReferenceImage[] = []
    if (useResearchInspo) {
      references.push(...researchInspo)
    } else if (brandRefKey) {
      const loaded = await loadReferenceByManifestKey(brandRefKey)
      if (loaded) references.push(loaded)
    }

    const fullPrompt = `${prompt}\n\n${EMAIL_STYLE_SUFFIX}`

    if (process.env.NODE_ENV !== 'production') {
      const refLabel = useResearchInspo
        ? `research(${references.length})`
        : brandRefKey
          ? `brand(${brandRefKey})`
          : 'none'
      console.log(
        `\n[generate-email-image] slot=${slot} ref=${refLabel}\n${fullPrompt}\n`,
      )
    }

    const png = await generateImage({ prompt: fullPrompt, references })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash, flavor })
  } catch (err) {
    console.error('[generate-email-image]', err)
    const message = err instanceof Error ? err.message : 'email image generation failed'
    res.status(500).json({ error: message })
  }
}
