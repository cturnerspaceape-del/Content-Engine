// Research-driven email image generation. Mirrors the single-image / carousel
// flow with a magazine-marketing style layered on top so email images read
// editorial rather than social-UGC. The `slot` field is preserved on the
// response (and in the cache key) so hero and product cells live in
// separate cache slots even when given identical prompts.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadRefsByKeys, pickFallbackFlavor } from './referenceImages'
import { pickRefsForPrompt } from './pickRefsForPrompt'
import type { SpaceApeFlavor } from '../src/remotion/types'

interface GenerateEmailImageBody {
  slot: 'hero' | 'product'
  prompt?: string
  flavor?: SpaceApeFlavor
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

const CACHE_VERSION = 5 // smart-picker rollout

export async function generateEmailImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GenerateEmailImageBody
    const { slot, variationSeed } = body
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const flavor = body.flavor ?? pickFallbackFlavor()

    if (!slot || !prompt) {
      res.status(400).json({ error: 'missing required fields: slot, prompt' })
      return
    }

    const picked = await pickRefsForPrompt({ prompt, flavor, maxRefs: 2 })

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      slot,
      prompt,
      flavor,
      pickedKeys: [...picked.keys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'email-image')

    if (await exists(absPath)) {
      res.json({ url: publicUrl, cached: true, hash, flavor })
      return
    }

    const refs: ReferenceImage[] = await loadRefsByKeys(picked.keys)
    const hasProductRef = picked.keys.some((k) => k.startsWith('product/'))

    const anchorClause = hasProductRef
      ? '\n\nUse the reference image(s) above as visual anchors. Render the exact vape device shown — match its shape, label, color, and graphics precisely. Do not invent a different vape. Any aesthetic-only reference is for mood and palette guidance.'
      : ''
    const fullPrompt = `${prompt}\n\n${EMAIL_STYLE_SUFFIX}${anchorClause}`

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[generate-email-image] slot=${slot} flavor=${flavor} picked=[${picked.keys.join(', ') || 'none'}] reasoning=${picked.reasoning ?? '-'}\n${fullPrompt}\n`,
      )
    }

    const png = await generateImage({ prompt: fullPrompt, references: refs })
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash, flavor })
  } catch (err) {
    console.error('[generate-email-image]', err)
    const message = err instanceof Error ? err.message : 'email image generation failed'
    res.status(500).json({ error: message })
  }
}
