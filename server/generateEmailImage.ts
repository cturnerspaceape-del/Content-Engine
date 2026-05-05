// Research-driven email image generation. Mirrors the simplified
// single-image flow: prompt verbatim + "photorealistic" + one random
// brand ref. The `slot` field is preserved on the response (and in the
// cache key) so hero and product cells live in separate cache slots
// even when given identical prompts.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadReferenceByManifestKey, pickOneRandomBrandRef } from './referenceImages'

interface GenerateEmailImageBody {
  slot: 'hero' | 'product'
  // Research-driven prompt for this slot.
  prompt?: string
  // Carried through onto the response so the email lab continues to know
  // which flavor was associated with the image (used in copy + downstream
  // cards). Optional — falls back to a random pick.
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

export async function generateEmailImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateEmailImageBody
    const { slot, variationSeed } = body
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    let { flavor } = body

    if (!slot || !prompt) {
      res.status(400).json({ error: 'missing required fields: slot, prompt' })
      return
    }
    if (!flavor) flavor = pickFallbackFlavor()

    const brandRefKey = await pickOneRandomBrandRef()

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      slot,
      prompt,
      brandRef: brandRefKey,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'email-image')

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
        `\n[generate-email-image] slot=${slot} ref=${brandRefKey ?? 'none'}\n${fullPrompt}\n`,
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
