import { useEffect, useMemo } from 'react'
import ContentCard from '../ContentCard'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import type { ContentItem, ContentPillar, PostDestination } from '../../types'
import { generateCarouselLoungePost } from '../../data/instagramContentTemplates'
import { getCarouselArc } from '../../data/carouselArcs'
import { usePersistedState } from '../../utils/persistedState'
import { postItemToSocials } from '../../lib/postToInstagram'
import {
  CAROUSEL_ARC_SEEDS,
  formatCarouselSeedTitle,
  carouselSeedTitles,
  findCarouselSeedIdxFromTitle,
  pickDifferentCarouselSeedIdx,
} from '../../lib/seeds/carouselArc'
import {
  tuneFor,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'
import { platformColors } from '../PlatformContentItem'

interface CarouselLabProps {
  onBack: () => void
}

const SEED_PREFIX = 'Carousel Lab'

function makeSeed(title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: '🎠',
    title,
    description: 'Click Generate to build a cross-post carousel.',
    contentType: 'Post',
    generated: false,
  }
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const arcId = item.generatedVisual?.arcId
  const name = arcId ? getCarouselArc(arcId)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎞️ ${name}` }
}

function tunerSourceFromItem(item: ContentItem): TunerSource {
  const gv = item.generatedVisual
  return {
    format: 'carousel',
    pillar: gv?.pillar as ContentPillar | undefined,
    baseHook: gv?.hook,
    baseCaption: gv?.caption,
    baseHashtags: gv?.hashtags ?? [],
  }
}

export default function CarouselLab({ onBack }: CarouselLabProps) {
  const [item, setItem] = usePersistedState<ContentItem>(
    'sl:carouselLab:item',
    () => makeSeed(formatCarouselSeedTitle(SEED_PREFIX, CAROUSEL_ARC_SEEDS[0])),
  )

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:carouselLab:platforms',
    () => defaultSelectedPlatforms('carousel'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:carouselLab:variants',
    () => ({}),
  )

  // Migrate older persisted selections that still hold 'Instagram' /
  // 'Facebook' / 'Email' as separate strings — collapse Meta to a
  // single 'IG/FB' chip and strip Email entirely.
  useEffect(() => {
    setSelectedPlatforms((prev) => {
      const stale = prev as ReadonlyArray<string>
      const hasOld =
        stale.includes('Instagram') ||
        stale.includes('Facebook') ||
        stale.includes('Email')
      if (!hasOld) return prev
      const filtered = prev.filter(
        (p) =>
          (p as string) !== 'Instagram' &&
          (p as string) !== 'Facebook' &&
          (p as string) !== 'Email',
      )
      return ['IG/FB' as TunerPlatform, ...filtered.filter((p) => p !== 'IG/FB')]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-tune all selected non-IG/FB platforms whenever IG caption changes
  // or a newly-added platform has no cached variant yet.
  useEffect(() => {
    if (!item.generatedVisual) return
    const source = tunerSourceFromItem(item)
    setVariants((prev) => {
      const next = { ...prev }
      for (const platform of selectedPlatforms) {
        if (platform === 'IG/FB') continue
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
      const seedIdx = findCarouselSeedIdxFromTitle(SEED_PREFIX, cur.title)
      const seed = CAROUSEL_ARC_SEEDS[seedIdx]
      const generated = generateCarouselLoungePost(cur, seed.arcId)
      return decorateTitle(generated, formatCarouselSeedTitle(SEED_PREFIX, seed))
    })
    setVariants({})
  }

  const handleShuffle = () => {
    setItem((cur) => {
      const nextIdx = pickDifferentCarouselSeedIdx(
        findCarouselSeedIdxFromTitle(SEED_PREFIX, cur.title),
      )
      return makeSeed(formatCarouselSeedTitle(SEED_PREFIX, CAROUSEL_ARC_SEEDS[nextIdx]))
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
    edits?: { caption?: string; hashtags?: string[] },
  ) => {
    const hasEdit =
      (edits?.caption != null || edits?.hashtags != null) && Boolean(item.generatedVisual)
    const itemToPost = hasEdit
      ? {
          ...item,
          generatedVisual: {
            ...item.generatedVisual!,
            ...(edits?.caption != null ? { caption: edits.caption } : {}),
            ...(edits?.hashtags != null ? { hashtags: edits.hashtags } : {}),
          },
        }
      : item
    // IG/FB chip is one Meta destination — selecting it implies cross-post
    // to Facebook. The IG card's own alsoFacebook checkbox is still
    // honored as an OR so both paths work.
    const alsoFacebook = opts.alsoFacebook || selectedPlatforms.includes('IG/FB')
    const result = await postItemToSocials(itemToPost, destination, { alsoFacebook })
    setItem((cur) => ({
      ...cur,
      postedToInstagram: result.instagram,
      postedToFacebook: result.facebook,
      facebookError: result.facebookError,
      postError: undefined,
      ...(hasEdit && cur.generatedVisual
        ? {
            generatedVisual: {
              ...cur.generatedVisual,
              ...(edits?.caption != null ? { caption: edits.caption } : {}),
              ...(edits?.hashtags != null ? { hashtags: edits.hashtags } : {}),
            },
          }
        : {}),
    }))
    return { facebookError: result.facebookError }
  }

  const handleRetune = (platform: TunerPlatform) => {
    if (!item.generatedVisual) return
    const source = tunerSourceFromItem(item)
    setVariants((prev) => ({ ...prev, [platform]: tuneFor(platform, source) }))
  }

  const seedTitles = useMemo(() => carouselSeedTitles(SEED_PREFIX), [])
  const activeSeedIdx = findCarouselSeedIdxFromTitle(SEED_PREFIX, item.title)

  const handlePickSeed = (idx: number) => {
    setItem(() => makeSeed(seedTitles[idx]))
    setVariants({})
  }

  // First slide acts as the cross-post hero image for X / Threads tabs.
  const heroSlideUrl = item.generatedVisual?.slideUrls?.find(
    (u): u is string => typeof u === 'string' && u.length > 0,
  )

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
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎠 Carousel Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            One carousel, tuned per platform — IG/FB, X, Threads
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {CAROUSEL_ARC_SEEDS.map((seed, idx) => {
            const active = idx === activeSeedIdx
            const arcName = getCarouselArc(seed.arcId)?.name ?? seed.subcategory
            return (
              <button
                key={seed.arcId}
                onClick={() => handlePickSeed(idx)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(6,182,212,.15)' : 'var(--panel-2)',
                  color: active ? '#06b6d4' : 'var(--muted)',
                  border: `1px solid ${active ? '#06b6d4' : 'var(--border)'}`,
                }}
                title={arcName}
              >
                {seed.pillar}: {seed.subcategory}
              </button>
            )
          })}
        </div>

        <PlatformPicker
          format="carousel"
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />

        <MultiPlatformPreview
          selected={selectedPlatforms}
          variants={variants}
          assetUrl={heroSlideUrl}
          assetKind="image"
          onRetune={handleRetune}
          customRender={{
            'IG/FB': () => (
              <ContentCard
                item={item}
                index={0}
                onShuffle={handleShuffle}
                onGenerate={handleGenerate}
                onLogPost={() => {}}
                onPost={handlePost}
                allowedDestinations={['feed']}
                onVisualResult={handleVisualResult}
              />
            ),
          }}
        />

        {selectedPlatforms.some((p) => p !== 'IG/FB') && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleGenerate}
              className="text-sm font-bold px-6 py-3 rounded-xl"
              style={{
                background: platformColors.Instagram ?? '#a855f7',
                color: 'white',
              }}
            >
              ⚡ Generate (carousel + all platform variants)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
