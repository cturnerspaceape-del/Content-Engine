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
import { resolveResearchInspo } from './researchInspo'

interface GenerateBody {
  flavor?: string
  hook?: string
  caption?: string
  pillar?: string
  subcategory?: string
  shotTemplateId?: string
  variationSeed?: number
  researchAngle?: string
  researchNotes?: string
  // Executable photo brief from the picked seed. When present, replaces the
  // generic shot template body in the Gemini prompt's SHOT BRIEF section.
  researchShotBrief?: string
  // When present, the image generator tries to fetch real-world trend
  // imagery from these URLs and uses them in place of the static inspo
  // refs picked from refManifest.json. Falls back to static refs if all
  // URLs fail to resolve to images.
  researchSourceUrls?: string[]
  researchSourceImageUrls?: string[]
}

const INSPO_REF_COUNT = 2
const BRAND_REF_COUNT = 2
const CACHE_VERSION = 6 // bumped for research-driven shotBrief override

export async function generateSingleImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      shotTemplateId,
      variationSeed,
      researchAngle,
      researchNotes,
      researchShotBrief,
      researchSourceUrls,
      researchSourceImageUrls,
    } = (req.body ?? {}) as GenerateBody

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
    const [inspoKeys, brandKeys, researchInspo] = await Promise.all([
      pickInspoRefs(shotTemplate, INSPO_REF_COUNT),
      pickBrandRefs(shotTemplate, BRAND_REF_COUNT),
      resolveResearchInspo({
        sourceImageUrls: researchSourceImageUrls,
        sourceUrls: researchSourceUrls,
        max: INSPO_REF_COUNT,
      }),
    ])
    const useResearchInspo = researchInspo.length > 0

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
      inspoRefs: useResearchInspo ? [] : [...inspoKeys].sort(),
      brandRefs: [...brandKeys].sort(),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
      // Trend signal participates in the cache key so a new picked seed busts
      // any prior cached PNG that was rendered without trend context.
      ...(researchAngle ? { researchAngle } : {}),
      ...(researchNotes ? { researchNotes } : {}),
      ...(researchShotBrief ? { researchShotBrief } : {}),
      // Sorted URL set so two callers passing the same trend imagery hit the
      // same cache slot regardless of array order.
      ...(useResearchInspo
        ? {
            researchInspoUrls: [
              ...(researchSourceImageUrls ?? []),
              ...(researchSourceUrls ?? []),
            ].sort(),
          }
        : {}),
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
    let inspoRefCount: number
    if (useResearchInspo) {
      references.push(...researchInspo)
      inspoRefCount = researchInspo.length
    } else {
      const loadedInspo = await Promise.all(inspoKeys.map(loadReferenceByManifestKey))
      const filtered = loadedInspo.filter((r): r is ReferenceImage => r !== null)
      references.push(...filtered)
      inspoRefCount = filtered.length
    }
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
      inspoRefCount,
      brandRefCount: brandKeys.length,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
      ...(researchAngle ? { researchAngle } : {}),
      ...(researchNotes ? { researchNotes } : {}),
      ...(researchShotBrief ? { researchShotBrief } : {}),
    })

    if (process.env.NODE_ENV !== 'production') {
      const inspoLabel = useResearchInspo ? `research(${inspoRefCount})` : `static(${inspoRefCount})`
      console.log(
        `\n[generate-single-image] inspo source: ${inspoLabel} brand(${brandKeys.length}) — shot=${shotTemplate.id} flavor=${flavor}\n${prompt}\n`,
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
    })
  } catch (err) {
    console.error('[generate-single-image]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
