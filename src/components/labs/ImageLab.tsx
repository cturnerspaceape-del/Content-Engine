import { useEffect, useMemo } from 'react'
import ContentCard from '../ContentCard'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import type { ContentItem, ContentPillar, PostDestination } from '../../types'
import { generateContentForPost } from '../../data/instagramContentTemplates'
import { getShotTemplate } from '../../data/shotTemplates'
import { usePersistedState } from '../../utils/persistedState'
import { postItemToSocials } from '../../lib/postToInstagram'
import {
  PILLAR_IMAGE_SEEDS,
  formatPillarSeedTitle,
  pillarSeedTitles,
  findPillarSeedIdxFromTitle,
  pickDifferentPillarSeedIdx,
} from '../../lib/seeds/pillarImage'
import {
  tuneFor,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'
import { platformColors } from '../PlatformContentItem'

interface ImageLabProps {
  onBack: () => void
}

const SEED_PREFIX = 'Single Image'

function makeSeed(title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: '📷',
    title,
    description: 'Click Generate to build a cross-post image.',
    contentType: 'Post',
    generated: false,
  }
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const id = item.generatedVisual?.shotTemplateId
  const name = id ? getShotTemplate(id)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎬 ${name}` }
}

function tunerSourceFromItem(item: ContentItem): TunerSource {
  const gv = item.generatedVisual
  return {
    format: 'image',
    pillar: gv?.pillar as ContentPillar | undefined,
    baseHook: gv?.hook,
    baseCaption: gv?.caption,
    baseHashtags: gv?.hashtags ?? [],
  }
}

export default function ImageLab({ onBack }: ImageLabProps) {
  const [item, setItem] = usePersistedState<ContentItem>(
    'sl:imageLab:item',
    () => makeSeed(formatPillarSeedTitle(SEED_PREFIX, PILLAR_IMAGE_SEEDS[0])),
  )

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:imageLab:platforms',
    () => defaultSelectedPlatforms('image'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:imageLab:variants',
    () => ({}),
  )

  // Re-tune all selected non-IG platforms whenever the IG item is regenerated
  // (caption changes) or a new platform is added without a cached variant.
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
      const seedIdx = findPillarSeedIdxFromTitle(SEED_PREFIX, cur.title)
      const generated = generateContentForPost(cur)
      const seedTitle = formatPillarSeedTitle(SEED_PREFIX, PILLAR_IMAGE_SEEDS[seedIdx])
      return decorateTitle(generated, seedTitle)
    })
    // Clear cached non-IG variants so they re-tune off the new caption.
    setVariants({})
  }

  const handleShuffle = () => {
    setItem((cur) => {
      const nextIdx = pickDifferentPillarSeedIdx(
        findPillarSeedIdxFromTitle(SEED_PREFIX, cur.title),
      )
      return makeSeed(formatPillarSeedTitle(SEED_PREFIX, PILLAR_IMAGE_SEEDS[nextIdx]))
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
    const result = await postItemToSocials(itemToPost, destination, opts)
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

  // Pillar seed picker — small chip row above the platform picker so the
  // user can switch pillars without shuffling.
  const seedTitles = useMemo(() => pillarSeedTitles(SEED_PREFIX), [])
  const activeSeedIdx = findPillarSeedIdxFromTitle(SEED_PREFIX, item.title)

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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🧪 Image Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            One image, tuned per platform — IG, X, Threads, Email
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {PILLAR_IMAGE_SEEDS.map((seed, idx) => {
            const active = idx === activeSeedIdx
            return (
              <button
                key={seed.pillar + seed.subcategory}
                onClick={() => handlePickSeed(idx)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(245,158,11,.15)' : 'var(--panel-2)',
                  color: active ? '#f59e0b' : 'var(--muted)',
                  border: `1px solid ${active ? '#f59e0b' : 'var(--border)'}`,
                }}
              >
                {seed.pillar}: {seed.subcategory}
              </button>
            )
          })}
        </div>

        <PlatformPicker
          format="image"
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />

        <MultiPlatformPreview
          selected={selectedPlatforms}
          variants={variants}
          assetUrl={item.generatedVisual?.imageUrl}
          assetKind="image"
          onRetune={handleRetune}
          tabStateKey="sl:imageLab:activeTab"
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

        {/* Generate button is repeated outside the IG card so it works from
            any tab, since non-IG tabs don't surface the IG card's controls. */}
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
              ⚡ Generate (image + all platform variants)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
