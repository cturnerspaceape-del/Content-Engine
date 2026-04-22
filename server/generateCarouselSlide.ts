import type { Request, Response } from 'express'
import { flavorThemes } from '../src/remotion/flavorThemes'
import type { SpaceApeFlavor } from '../src/remotion/types'
import { getShotTemplate, pickShotTemplate } from '../src/data/shotTemplates'
import { getCarouselArc } from '../src/data/carouselArcs'
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
  arcId?: string
  slideIndex?: number
  carouselSeed?: number
  variationSeed?: number
}

const INSPO_REF_COUNT = 2
const BRAND_REF_COUNT = 2
const CACHE_VERSION = 1

export async function generateCarouselSlideHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      arcId,
      slideIndex,
      carouselSeed,
      variationSeed,
    } = (req.body ?? {}) as GenerateBody

    if (
      !flavor ||
      !hook ||
      !caption ||
      !pillar ||
      !subcategory ||
      !arcId ||
      typeof slideIndex !== 'number' ||
      typeof carouselSeed !== 'number'
    ) {
      res.status(400).json({
        error:
          'missing required fields: flavor, hook, caption, pillar, subcategory, arcId, slideIndex, carouselSeed',
      })
      return
    }

    const theme = flavorThemes[flavor as SpaceApeFlavor]
    if (!theme) {
      res.status(400).json({ error: `unknown flavor: ${flavor}` })
      return
    }

    const arc = getCarouselArc(arcId)
    if (!arc) {
      res.status(400).json({ error: `unknown arcId: ${arcId}` })
      return
    }
    if (slideIndex < 0 || slideIndex >= arc.slides.length) {
      res.status(400).json({
        error: `slideIndex ${slideIndex} out of range for arc "${arcId}" (length ${arc.slides.length})`,
      })
      return
    }

    const slideSpec = arc.slides[slideIndex]
    const shotTemplate = slideSpec.shotTemplateId
      ? getShotTemplate(slideSpec.shotTemplateId) ?? pickShotTemplate(pillar, subcategory)
      : pickShotTemplate(pillar, subcategory)

    const productFile = pickProductReference(flavor)
    const [inspoKeys, brandKeys] = await Promise.all([
      pickInspoRefs(shotTemplate, INSPO_REF_COUNT),
      pickBrandRefs(shotTemplate, BRAND_REF_COUNT),
    ])

    const hash = hashKey({
      v: CACHE_VERSION,
      kind: 'carousel-slide',
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      arcId,
      slideIndex,
      carouselSeed,
      shotTemplate: shotTemplate.id,
      productRef: productFile,
      inspoRefs: [...inspoKeys].sort(),
      brandRefs: [...brandKeys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'carousel-slide')

    if (await exists(absPath)) {
      res.json({
        url: publicUrl,
        cached: true,
        hash,
        shotTemplateId: shotTemplate.id,
        shotTemplateName: shotTemplate.name,
        slideIndex,
        slideRole: slideSpec.role,
      })
      return
    }

    const references: ReferenceImage[] = []
    if (productFile) references.push(await loadProductReference(productFile))
    const loadedInspo = await Promise.all(inspoKeys.map(loadReferenceByManifestKey))
    references.push(...loadedInspo.filter((r): r is ReferenceImage => r !== null))
    const loadedBrand = await Promise.all(brandKeys.map(loadReferenceByManifestKey))
    references.push(...loadedBrand.filter((r): r is ReferenceImage => r !== null))

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
      slideContext: {
        index: slideIndex + 1,
        total: arc.slides.length,
        role: slideSpec.role,
        brief: slideSpec.brief,
        carouselSeed,
      },
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[generate-carousel-slide] arc=${arcId} slide=${slideIndex + 1}/${arc.slides.length} role=${slideSpec.role} shot=${shotTemplate.id} (${flavor})\n${prompt}\n`,
      )
    }

    const png = await generateImage({ prompt, references })
    await writePng(absPath, png)

    res.json({
      url: publicUrl,
      cached: false,
      hash,
      shotTemplateId: shotTemplate.id,
      shotTemplateName: shotTemplate.name,
      slideIndex,
      slideRole: slideSpec.role,
    })
  } catch (err) {
    console.error('[generate-carousel-slide]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
