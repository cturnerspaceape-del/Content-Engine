import { useState } from 'react'
import type { ContentItem, InstagramFormat } from '../../types'
import {
  generateContentForPostAsync,
  generateCarouselLoungePostAsync,
  generateReelLoungePostAsync,
  type ResearchContext,
} from '../../data/instagramContentTemplates'
import {
  PILLAR_IMAGE_SEEDS,
  formatPillarSeedTitle,
  pickDifferentPillarSeedIdx,
  findPillarSeedIdxFromTitle,
} from '../../lib/seeds/pillarImage'
import { toCarouselArcSeed } from '../../lib/research/researchedSeed'
import type { ResearchedSeed } from '../../lib/research/types'
import SingleImageVisual from '../SingleImageVisual'
import ReelLoungeVisual from '../ReelLoungeVisual'
import CarouselLoungeVisual from '../CarouselLoungeVisual'
import { postItemToSocials } from '../../lib/postToInstagram'
import type { SpaceApeFlavor } from '../../remotion/types'

interface IGSlotPanelProps {
  format: InstagramFormat
  item: ContentItem | undefined
  // Per-slot research seed picked from this card's Research button. When
  // set, Generate anchors caption + image to this trend signal instead of
  // the generic PILLAR_IMAGE_SEEDS rotation.
  slotResearch?: ResearchedSeed | null
  onChange: (item: ContentItem) => void
  onPosted?: (item: ContentItem) => void
}

const SEED_PREFIX_BY_FORMAT: Record<InstagramFormat, string> = {
  'Single Image': 'Single Image',
  Carousel: 'Carousel',
  Reel: 'Reel',
}

function makeSeed(format: InstagramFormat, title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: format === 'Reel' ? '🎬' : format === 'Carousel' ? '🎠' : '📷',
    title,
    description: 'Click Generate to build content for this slot.',
    contentType: 'Post',
    generated: false,
  }
}

async function runGenerate(
  format: InstagramFormat,
  seedItem: ContentItem,
  research?: ResearchContext,
  arcId?: string,
): Promise<ContentItem> {
  if (format === 'Reel') return generateReelLoungePostAsync(seedItem)
  if (format === 'Carousel') return generateCarouselLoungePostAsync(seedItem, arcId, research)
  return generateContentForPostAsync(seedItem, research)
}

export default function IGSlotPanel({ format, item, slotResearch, onChange, onPosted }: IGSlotPanelProps) {
  const [busy, setBusy] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postErr, setPostErr] = useState<string | null>(null)
  const gv = item?.generatedVisual

  // When the slot has a locked-in trend seed, derive the IG seed title and
  // arcId from it (via the existing adapters) instead of the cookie-cutter
  // PILLAR_IMAGE_SEEDS pool. Same path the labs use. URLs from the seed
  // ride along so the server can resolve them to inspo refs at gen time.
  const researchPayload: ResearchContext | undefined = slotResearch
    ? {
        angle: slotResearch.angle,
        notes: slotResearch.sourceNotes,
        ...(slotResearch.sourceUrls?.length ? { sourceUrls: slotResearch.sourceUrls } : {}),
        ...(slotResearch.sourceImageUrls?.length
          ? { sourceImageUrls: slotResearch.sourceImageUrls }
          : {}),
      }
    : undefined

  const handleGenerate = async () => {
    setBusy(true)
    try {
      const prefix = SEED_PREFIX_BY_FORMAT[format]
      let seedTitle: string
      let arcId: string | undefined
      if (slotResearch) {
        // Anchor seed to the picked trend so caption + image use the same
        // pillar/subcategory the user picked on the Scheduler.
        seedTitle = formatPillarSeedTitle(prefix, {
          pillar: slotResearch.pillar,
          subcategory: slotResearch.subcategory,
        })
        if (format === 'Carousel') {
          arcId = toCarouselArcSeed(slotResearch).arcId
        }
      } else {
        const seedIdx = item ? findPillarSeedIdxFromTitle(prefix, item.title) : 0
        seedTitle = formatPillarSeedTitle(prefix, PILLAR_IMAGE_SEEDS[seedIdx])
      }
      const seed = item && !slotResearch ? item : makeSeed(format, seedTitle)
      const result = await runGenerate(format, seed, researchPayload, arcId)
      onChange(result)
    } finally {
      setBusy(false)
    }
  }

  const handleShuffle = async () => {
    setBusy(true)
    try {
      const prefix = SEED_PREFIX_BY_FORMAT[format]
      const curIdx = item ? findPillarSeedIdxFromTitle(prefix, item.title) : 0
      const nextIdx = pickDifferentPillarSeedIdx(curIdx)
      const seedTitle = formatPillarSeedTitle(prefix, PILLAR_IMAGE_SEEDS[nextIdx])
      const seed = makeSeed(format, seedTitle)
      // Shuffle is the "give me a different angle" path; ignore slotResearch
      // here so the user can roll a different idea without losing the trend.
      const result = await runGenerate(format, seed)
      onChange(result)
    } finally {
      setBusy(false)
    }
  }

  const updateGV = (patch: Partial<NonNullable<ContentItem['generatedVisual']>>) => {
    if (!item || !item.generatedVisual) return
    onChange({ ...item, generatedVisual: { ...item.generatedVisual, ...patch } })
  }

  const handlePost = async () => {
    if (!item) return
    setPosting(true)
    setPostErr(null)
    try {
      const result = await postItemToSocials(item, 'feed', { alsoFacebook: false })
      const updated: ContentItem = {
        ...item,
        postedToInstagram: result.instagram,
        postedToFacebook: result.facebook,
        facebookError: result.facebookError,
      }
      onChange(updated)
      onPosted?.(updated)
    } catch (e) {
      setPostErr(e instanceof Error ? e.message : 'Post failed')
    } finally {
      setPosting(false)
    }
  }

  if (!item || !gv) {
    return (
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
          style={{
            background: busy ? 'var(--panel-2)' : '#ec4899',
            color: '#fff',
            border: 'none',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Generating…' : `✨ Generate ${format}`}
        </button>
        <p className="text-[10px] mt-2 italic" style={{ color: 'var(--muted)' }}>
          Calls the same generator as {format === 'Reel' ? 'Reel Lab' : format === 'Carousel' ? 'Carousel Lab' : 'Image Lab'} — caption + visual ready in seconds.
        </p>
      </div>
    )
  }

  const flavor: SpaceApeFlavor = (gv.flavor as SpaceApeFlavor) ?? 'Amped Apple'

  return (
    <div className="mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
      {/* Visual */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--panel-2)' }}>
        {format === 'Single Image' && (
          <SingleImageVisual
            flavor={flavor}
            hook={gv.hook}
            caption={gv.caption}
            hashtags={gv.hashtags ?? []}
            pillar={gv.pillar}
            subcategory={gv.subcategory}
            shotTemplateId={gv.shotTemplateId}
            variationSeed={gv.imageVariationSeed}
            researchAngle={gv.researchAngle}
            researchNotes={gv.researchNotes}
            researchSourceUrls={gv.researchSourceUrls}
            researchSourceImageUrls={gv.researchSourceImageUrls}
            imageUrl={gv.imageUrl}
            imageError={gv.imageError}
            onResult={(url, err) => updateGV({
              imageUrl: url ?? undefined,
              imageError: err ?? undefined,
            })}
          />
        )}
        {format === 'Reel' && gv.reelArcId !== undefined && gv.reelSeed !== undefined && (
          <ReelLoungeVisual
            flavor={flavor}
            hook={gv.hook}
            caption={gv.caption}
            pillar={gv.pillar}
            subcategory={gv.subcategory}
            reelArcId={gv.reelArcId}
            reelSeed={gv.reelSeed}
            durationSeconds={gv.durationSeconds ?? 8}
            variationSeed={gv.reelVariationSeed}
            url={gv.reelUrl}
            error={gv.reelError}
            onResult={(url, err, seed) => updateGV({
              reelUrl: url ?? undefined,
              reelError: err ?? undefined,
              ...(seed !== undefined && { reelVariationSeed: seed }),
            })}
          />
        )}
        {format === 'Carousel' && gv.arcId !== undefined && gv.carouselSeed !== undefined && (
          <CarouselLoungeVisual
            flavor={flavor}
            hook={gv.hook}
            caption={gv.caption}
            pillar={gv.pillar}
            subcategory={gv.subcategory}
            arcId={gv.arcId}
            slideCount={gv.slideCount ?? 5}
            carouselSeed={gv.carouselSeed}
            researchAngle={gv.researchAngle}
            researchNotes={gv.researchNotes}
            researchSourceUrls={gv.researchSourceUrls}
            researchSourceImageUrls={gv.researchSourceImageUrls}
            slideUrls={gv.slideUrls}
            slideErrors={gv.slideErrors}
            slideVariationSeeds={gv.slideVariationSeeds}
            onSlideResult={(idx, url, err, seed) => {
              const slideUrls = (gv.slideUrls ?? []).slice()
              const slideErrors = (gv.slideErrors ?? []).slice()
              const slideSeeds = (gv.slideVariationSeeds ?? []).slice()
              slideUrls[idx] = url
              slideErrors[idx] = err
              if (seed !== undefined) slideSeeds[idx] = seed
              updateGV({ slideUrls, slideErrors, slideVariationSeeds: slideSeeds })
            }}
          />
        )}
      </div>

      {/* Hook + caption editor */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Hook
        </label>
        <input
          type="text"
          value={gv.hook}
          onChange={(e) => updateGV({ hook: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        <label className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--muted)' }}>
          Caption
        </label>
        <textarea
          value={gv.caption}
          onChange={(e) => updateGV({ caption: e.target.value })}
          rows={3}
          className="px-3 py-2 rounded-lg text-sm resize-y"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        <label className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--muted)' }}>
          Hashtags ({(gv.hashtags ?? []).length})
        </label>
        <input
          type="text"
          value={(gv.hashtags ?? []).join(' ')}
          onChange={(e) =>
            updateGV({
              hashtags: e.target.value
                .split(/\s+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="px-3 py-2 rounded-lg text-xs font-mono"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleShuffle}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            opacity: busy ? 0.6 : 1,
          }}
        >
          🔀 Shuffle
        </button>
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{
            background: 'rgba(184,164,255,.18)',
            color: '#7c5fff',
            border: '1px solid #b8a4ff55',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Working…' : '↻ Regen caption'}
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={handlePost}
          disabled={posting || !!item.postedToInstagram}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{
            background: item.postedToInstagram ? '#10b981' : '#ec4899',
            color: '#fff',
            border: 'none',
            opacity: posting ? 0.6 : 1,
          }}
        >
          {item.postedToInstagram
            ? '✓ Posted'
            : posting
            ? 'Posting…'
            : '↗ Post Now'}
        </button>
      </div>
      {postErr && (
        <p className="text-[11px]" style={{ color: 'var(--danger)' }}>
          {postErr}
        </p>
      )}
    </div>
  )
}
