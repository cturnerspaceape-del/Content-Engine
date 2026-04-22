import type { Request, Response } from 'express'
import { flavorThemes } from '../src/remotion/flavorThemes'
import type { SpaceApeFlavor } from '../src/remotion/types'
import { getShotTemplate, pickShotTemplate } from '../src/data/shotTemplates'
import { buildPrompt } from './prompt'
import {
  pickProductReference,
  pickInspoRefs,
  pickBrandRefs,
  loadProductReference,
  loadReferenceByManifestKey,
} from './referenceImages'
import { cachePath, exists, hashKey, writePng } from './cache'
import { generateImage, type ReferenceImage } from './gemini'

interface GenerateBody {
  flavor?: string
  hook?: string
  caption?: string
  pillar?: string
  subcategory?: string
  shotTemplateId?: string
  variationSeed?: number
}

const INSPO_REF_COUNT = 2
const BRAND_REF_COUNT = 2
const CACHE_VERSION = 3 // bumped for v2 prompt structure

export async function generateSingleImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const { flavor, hook, caption, pillar, subcategory, shotTemplateId, variationSeed } =
      (req.body ?? {}) as GenerateBody

    if (!flavor || !hook || !caption || !pillar || !subcategory) {
      res.status(400).json({ error: 'missing required fields: flavor, hook, caption, pillar, subcategory' })
      return
    }

    const theme = flavorThemes[flavor as SpaceApeFlavor]
    if (!theme) {
      res.status(400).json({ error: `unknown flavor: ${flavor}` })
      return
    }

    const shotTemplate = shotTemplateId
      ? getShotTemplate(shotTemplateId) ?? pickShotTemplate(pillar, subcategory)
      : pickShotTemplate(pillar, subcategory)

    const productFile = pickProductReference(flavor)
    const [inspoKeys, brandKeys] = await Promise.all([
      pickInspoRefs(shotTemplate, INSPO_REF_COUNT),
      pickBrandRefs(shotTemplate, BRAND_REF_COUNT),
    ])

    // variationSeed in the cache key only when set — keeps the default path cache-friendly.
    const hash = hashKey({
      v: CACHE_VERSION,
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      shotTemplate: shotTemplate.id,
      productRef: productFile,
      inspoRefs: [...inspoKeys].sort(),
      brandRefs: [...brandKeys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash)

    if (await exists(absPath)) {
      res.json({
        url: publicUrl,
        cached: true,
        hash,
        shotTemplateId: shotTemplate.id,
        shotTemplateName: shotTemplate.name,
      })
      return
    }

    const references: ReferenceImage[] = []
    if (productFile) references.push(await loadProductReference(productFile))
    const loadedInspo = await Promise.all(inspoKeys.map(loadReferenceByManifestKey))
    references.push(...loadedInspo)
    const loadedBrand = await Promise.all(brandKeys.map(loadReferenceByManifestKey))
    references.push(...loadedBrand)

    const prompt = buildPrompt({
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      theme,
      shotTemplate,
      inspoRefCount: inspoKeys.length,
      brandRefCount: brandKeys.length,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[generate-single-image] prompt for ${shotTemplate.id} (${flavor}):\n${prompt}\n`)
    }

    const png = await generateImage({ prompt, references })
    await writePng(absPath, png)

    res.json({
      url: publicUrl,
      cached: false,
      hash,
      shotTemplateId: shotTemplate.id,
      shotTemplateName: shotTemplate.name,
    })
  } catch (err) {
    console.error('[generate-single-image]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
