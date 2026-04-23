import type { Request, Response } from 'express'
import { flavorThemes } from '../src/remotion/flavorThemes'
import type { SpaceApeFlavor } from '../src/remotion/types'
import { getReelArc } from '../src/data/reelArcs'
import { extractMoodWords } from '../src/data/moodWords'
import { cachePath, exists, hashKey, writeMp4 } from './cache'
import { generateVideo } from './veo'
import { pickProductReference, loadProductReference } from './referenceImages'

interface GenerateBody {
  flavor?: string
  hook?: string
  caption?: string
  pillar?: string
  subcategory?: string
  reelArcId?: string
  reelSeed?: number
  variationSeed?: number
}

const CACHE_VERSION = 2 // bumped: Veo now receives product image conditioning

function buildReelPrompt(args: {
  flavor: string
  theme: { primaryColor: string; accentColor: string; backgroundColor: string; strainType?: string }
  pillar: string
  subcategory: string
  arcName: string
  arcBeat: string
  durationSeconds: number
  mood: string
  hasProductImage: boolean
}): string {
  const { flavor, theme, pillar, subcategory, arcName, arcBeat, durationSeconds, mood, hasProductImage } = args
  const strain = theme.strainType || 'Hybrid'
  return [
    `GOAL: Generate a ${durationSeconds}-second, 9:16 vertical Instagram Reel for Space Ape — scene: "${arcName}".`,
    `SCENE BEAT: ${arcBeat}.`,
    `BRAND BIBLE: Space Ape is a premium cannabis live-resin vape brand. Editorial still-life energy meets playful-pop sticker energy. Think Starface / Glossier / Fenty, never a dispensary menu. Glossy photoreal product rendering with subtle specular highlights. Medium-format-camera feel with fine grain. Confident, youthful, high-saturation, clean.`,
    `FLAVOR: Space Ape ${flavor} (${strain}). Palette — primary ${theme.primaryColor}, accent ${theme.accentColor}, background ${theme.backgroundColor}. Let these hues breathe in the scene without overpowering the product's own colorway.`,
    `MOOD: ${mood}. Pillar: ${pillar}. Subcategory: ${subcategory}.`,
    `PRODUCT LOCK: The Space Ape device is an all-in-one disposable vape — a tall, slim rectangular capsule with softly rounded corners and a matte/satin finish, wrapped in the flavor colorway with a small printed Space Ape wordmark and flavor label. The cap stays attached. No mouthpiece swaps, no pod swaps, no cartridge-and-battery combo — one sealed unit.`,
    hasProductImage
      ? `PRODUCT REFERENCE: A reference image of the exact Space Ape ${flavor} device is attached. Match its silhouette, proportions, wrap colorway, and label layout EXACTLY. Do not invent a new device shape, a new colorway, or a new label. Treat the reference as ground truth across every frame — the device must not morph, swap, or drift as the scene moves.`
      : ``,
    `HARD CONSTRAINTS:`,
    `  - 9:16 vertical, full bleed.`,
    `  - NO on-screen text, NO words, NO letters, NO numbers, NO logos — except what is physically printed on the product itself.`,
    `  - No human faces. Hands, silhouettes, and body fragments are fine when the scene calls for it.`,
    `  - No third-party brand marks of any kind.`,
    `  - Photoreal product; surroundings may be photoreal or illustrated as the beat dictates.`,
    `  - The product is always the unambiguous focal point; everything else supports it.`,
    `Output: one ${durationSeconds}-second vertical (9:16) video.`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export async function generateReelHandler(req: Request, res: Response): Promise<void> {
  try {
    const { flavor, hook, caption, pillar, subcategory, reelArcId, reelSeed, variationSeed } =
      (req.body ?? {}) as GenerateBody

    if (
      !flavor ||
      !hook ||
      !caption ||
      !pillar ||
      !subcategory ||
      !reelArcId ||
      typeof reelSeed !== 'number'
    ) {
      res.status(400).json({
        error:
          'missing required fields: flavor, hook, caption, pillar, subcategory, reelArcId, reelSeed',
      })
      return
    }

    const theme = flavorThemes[flavor as SpaceApeFlavor]
    if (!theme) {
      res.status(400).json({ error: `unknown flavor: ${flavor}` })
      return
    }

    const arc = getReelArc(reelArcId)
    if (!arc) {
      res.status(400).json({ error: `unknown reelArcId: ${reelArcId}` })
      return
    }

    const productFile = pickProductReference(flavor)

    const hash = hashKey({
      v: CACHE_VERSION,
      kind: 'reel',
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      reelArcId,
      reelSeed,
      durationSeconds: arc.durationSeconds,
      productRef: productFile,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    })
    const { absPath, publicUrl } = cachePath(hash, 'reel')

    if (await exists(absPath)) {
      res.json({
        url: publicUrl,
        cached: true,
        hash,
        reelArcId: arc.id,
        reelArcName: arc.name,
        durationSeconds: arc.durationSeconds,
      })
      return
    }

    const productImage = productFile ? await loadProductReference(productFile) : null

    const mood = extractMoodWords(hook, caption, pillar, subcategory).join(', ')
    const prompt = buildReelPrompt({
      flavor,
      theme,
      pillar,
      subcategory,
      arcName: arc.name,
      arcBeat: arc.beat,
      durationSeconds: arc.durationSeconds,
      mood,
      hasProductImage: productImage !== null,
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n[generate-reel] arc=${arc.id} dur=${arc.durationSeconds}s flavor=${flavor} seed=${reelSeed}${typeof variationSeed === 'number' ? ` variationSeed=${variationSeed}` : ''} productRef=${productFile ?? '(none)'}\n${prompt}\n`,
      )
    }

    // Veo via Gemini API doesn't accept a seed parameter — rely on the cache
    // key (which already folds in reelSeed + variationSeed) to separate rerolls,
    // and on Veo's natural non-determinism to diversify outputs.
    const mp4 = await generateVideo({
      prompt,
      aspectRatio: '9:16',
      durationSeconds: arc.durationSeconds,
      ...(productImage ? { image: productImage } : {}),
    })
    await writeMp4(absPath, mp4)

    res.json({
      url: publicUrl,
      cached: false,
      hash,
      reelArcId: arc.id,
      reelArcName: arc.name,
      durationSeconds: arc.durationSeconds,
    })
  } catch (err) {
    console.error('[generate-reel]', err)
    const message = err instanceof Error ? err.message : 'generation failed'
    res.status(500).json({ error: message })
  }
}
