import { useEffect, useMemo } from 'react'
import ContentCard from '../ContentCard'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import type { ContentItem, ContentPillar, PostDestination } from '../../types'
import { generateReelLoungePost } from '../../data/instagramContentTemplates'
import { getReelArc } from '../../data/reelArcs'
import { usePersistedState } from '../../utils/persistedState'
import { postItemToSocials } from '../../lib/postToInstagram'
import {
  REEL_ARC_SEEDS,
  formatReelSeedTitle,
  reelSeedTitles,
  findReelSeedIdxFromTitle,
  pickDifferentReelSeedIdx,
} from '../../lib/seeds/reelArc'
import {
  tuneFor,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'
import { platformColors } from '../PlatformContentItem'

interface ReelLabProps {
  onBack: () => void
}

const SEED_PREFIX = 'Reel Lab'

function makeSeed(title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: '🎬',
    title,
    description: 'Click Generate to build a cross-post reel.',
    contentType: 'Post',
    generated: false,
  }
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const arcId = item.generatedVisual?.reelArcId
  const name = arcId ? getReelArc(arcId)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎞️ ${name}` }
}

function tunerSourceFromItem(item: ContentItem): TunerSource {
  const gv = item.generatedVisual
  return {
    format: 'video',
    pillar: gv?.pillar as ContentPillar | undefined,
    baseHook: gv?.hook,
    baseCaption: gv?.caption,
    baseHashtags: gv?.hashtags ?? [],
  }
}

export default function ReelLab({ onBack }: ReelLabProps) {
  const [item, setItem] = usePersistedState<ContentItem>(
    'sl:reelLab:item',
    () => makeSeed(formatReelSeedTitle(SEED_PREFIX, REEL_ARC_SEEDS[0])),
  )

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:reelLab:platforms',
    () => defaultSelectedPlatforms('video'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:reelLab:variants',
    () => ({}),
  )

  // Re-tune all selected non-IG platforms whenever IG caption changes or
  // a newly-added platform has no cached variant yet.
  useEffect(() => {
    if (!item.generatedVisual) return
    const source = tunerSourceFromItem(item)
    setVariants((prev) => {
      const next = { ...prev }
      for (const platform of selectedPlatforms) {
        if (platform === 'Instagram') continue
        if (!next[platform] || next[platform]!.caption === '') {
          next[platform] = tuneFor(platform, source)
        }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.generatedVisual?.caption, selectedPlatforms.join('|')])

  const handleGenerate = () => {
    setItem((cur) => {
      const seedIdx = findReelSeedIdxFromTitle(SEED_PREFIX, cur.title)
      const seed = REEL_ARC_SEEDS[seedIdx]
      const generated = generateReelLoungePost(cur, seed.arcId)
      return decorateTitle(generated, formatReelSeedTitle(SEED_PREFIX, seed))
    })
    setVariants({})
  }

  const handleShuffle = () => {
    setItem((cur) => {
      const nextIdx = pickDifferentReelSeedIdx(
        findReelSeedIdxFromTitle(SEED_PREFIX, cur.title),
      )
      return makeSeed(formatReelSeedTitle(SEED_PREFIX, REEL_ARC_SEEDS[nextIdx]))
    })
    setVariants({})
  }

  const handleVisualResult = (
    patch: Partial<NonNullable<ContentItem['generatedVisual']>>,
  ) => {
    setItem((cur) => {
      if (!cur.generatedVisual) return cur
      return { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
    })
  }

  const handlePost = async (
    destination: PostDestination,
    opts: { alsoFacebook: boolean },
    _edits?: { caption?: string; hashtags?: string[] },
  ) => {
    void _edits
    const result = await postItemToSocials(item, destination, opts)
    setItem((cur) => ({
      ...cur,
      postedToInstagram: result.instagram,
      postedToFacebook: result.facebook,
      facebookError: result.facebookError,
      postError: undefined,
    }))
    return { facebookError: result.facebookError }
  }

  const handleRetune = (platform: TunerPlatform) => {
    if (!item.generatedVisual) return
    const source = tunerSourceFromItem(item)
    setVariants((prev) => ({ ...prev, [platform]: tuneFor(platform, source) }))
  }

  const seedTitles = useMemo(() => reelSeedTitles(SEED_PREFIX), [])
  const activeSeedIdx = findReelSeedIdxFromTitle(SEED_PREFIX, item.title)

  const handlePickSeed = (idx: number) => {
    setItem(() => makeSeed(seedTitles[idx]))
    setVariants({})
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-4" style={{ position: 'relative', textAlign: 'center' }}>
          <button
            onClick={onBack}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              background: 'rgba(148,163,184,.1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            ← Back
          </button>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #be185d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎬 Reel Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            One Veo clip, tuned per platform — IG Reel, TikTok, YouTube Shorts, X
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {REEL_ARC_SEEDS.map((seed, idx) => {
            const active = idx === activeSeedIdx
            const arcName = getReelArc(seed.arcId)?.name ?? seed.subcategory
            return (
              <button
                key={seed.arcId}
                onClick={() => handlePickSeed(idx)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(236,72,153,.15)' : 'var(--panel-2)',
                  color: active ? '#ec4899' : 'var(--muted)',
                  border: `1px solid ${active ? '#ec4899' : 'var(--border)'}`,
                }}
                title={arcName}
              >
                {seed.pillar}: {seed.subcategory}
              </button>
            )
          })}
        </div>

        <PlatformPicker
          format="video"
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />

        <MultiPlatformPreview
          selected={selectedPlatforms}
          variants={variants}
          assetUrl={item.generatedVisual?.reelUrl}
          assetKind="video"
          onRetune={handleRetune}
          tabStateKey="sl:reelLab:activeTab"
          customRender={{
            Instagram: () => (
              <ContentCard
                item={item}
                index={0}
                onShuffle={handleShuffle}
                onGenerate={handleGenerate}
                onLogPost={() => {}}
                onPost={handlePost}
                allowedDestinations={['feed', 'story']}
                onVisualResult={handleVisualResult}
              />
            ),
          }}
        />

        {selectedPlatforms.some((p) => p !== 'Instagram') && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleGenerate}
              className="text-sm font-bold px-6 py-3 rounded-xl"
              style={{
                background: platformColors.Instagram ?? '#a855f7',
                color: 'white',
              }}
            >
              ⚡ Generate (reel + all platform variants)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
