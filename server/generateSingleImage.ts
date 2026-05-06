// Research-driven single-image generation. The handler asks an LLM picker
// to pick 0–2 reference keys (from the unified product+brand catalog) for
// THIS specific prompt, then sends those refs + the prompt to the image
// model. The picker may return zero refs for purely conceptual prompts —
// generation falls through to /v1/images/generations cleanly.

import type { Request, Response } from 'express'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './openaiImage'
import { loadRefsByKeys, pickFallbackFlavor } from './referenceImages'
import { pickRefsForPrompt } from './pickRefsForPrompt'
import type { SpaceApeFlavor } from '../src/remotion/types'

interface GenerateBody {
  // The selected research prompt. The image model receives this verbatim
  // followed by an anchor clause (only when product refs were picked).
  prompt?: string
  // Optional flavor anchor. The picker uses it as a hint when the prompt
  // doesn't name a flavor explicitly. Falls back to a random allowlisted
  // flavor when missing.
  flavor?: SpaceApeFlavor
  variationSeed?: number
}

const CACHE_VERSION = 10 // smart-picker rollout

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

    const { variationSeed } = body
    const flavor = body.flavor ?? pickFallbackFlavor()

    // Per-step timing logs — runs in prod too (Railway). Lets us see exactly
    // which step is slow when generation hangs (picker / ref load / image gen).
    const reqId = Math.random().toString(36).slice(2, 8)
    const t0 = Date.now()
    const picked = await pickRefsForPrompt({ prompt, flavor, maxRefs: 2 })
    const tPicker = Date.now()
    console.log(`[generate-single-image ${reqId}] picker=${tPicker - t0}ms keys=[${picked.keys.join(',')}]`)

    const hash = hashKey({
      v: CACHE_VERSION,
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      prompt,
      flavor,
      pickedKeys: [...picked.keys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash)

    if (await exists(absPath)) {
      console.log(`[generate-single-image ${reqId}] cache-hit hash=${hash}`)
      res.json({ url: publicUrl, cached: true, hash })
      return
    }

    const refs: ReferenceImage[] = await loadRefsByKeys(picked.keys)
    const tRefs = Date.now()
    console.log(`[generate-single-image ${reqId}] refload=${tRefs - tPicker}ms count=${refs.length}`)
    const hasProductRef = picked.keys.some((k) => k.startsWith('product/'))

    // Anchor clause only when a product ref is actually being sent — for
    // ref-less / aesthetic-only generations the binding instruction would
    // be misleading.
    const suffix = hasProductRef
      ? '\n\nUse the reference image(s) above as visual anchors. Render the exact vape device shown — match its shape, label, color, and graphics precisely. Do not invent a different vape. Any aesthetic-only reference is for mood and palette guidance.'
      : ''
    const fullPrompt = `${prompt}\n\nphotorealistic${suffix}`

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[generate-single-image] flavor=${flavor} picked=[${picked.keys.join(', ') || 'none'}] reasoning=${picked.reasoning ?? '-'}\n${fullPrompt}\n`,
      )
    }

    const png = await generateImage({ prompt: fullPrompt, references: refs })
    const tGen = Date.now()
    console.log(`[generate-single-image ${reqId}] imagegen=${tGen - tRefs}ms total=${tGen - t0}ms hash=${hash}`)
    await writePng(absPath, png)

    res.json({ url: publicUrl, cached: false, hash })
  } catch (err) {
    console.error('[generate-single-image]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
