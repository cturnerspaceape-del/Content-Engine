import { useEffect, useMemo, useState } from 'react'
import ContentCard from '../ContentCard'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import PostConfirmModal from '../PostConfirmModal'
import type { ContentItem, ContentPillar, PostDestination } from '../../types'
import { generateReelLoungePostAsync } from '../../data/instagramContentTemplates'
import ResearchPanel from '../ResearchPanel'
import { useResearch } from '../../lib/research/useResearch'
import type { ResearchedSeed } from '../../lib/research/types'
import { getReelArc } from '../../data/reelArcs'
import { usePersistedState } from '../../utils/persistedState'
import { postItemToSocials, summarizeSocialsResult } from '../../lib/postToInstagram'
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

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  'IG/FB': 'IG/FB',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
}

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

  // Research seeds for the reel — 3 strategies returned by /api/research-trends.
  // -1 = nothing picked yet; Generate stays disabled until the user chooses
  // a strategy. Not persisted — opening the lab lands on the idle CTA.
  const [researchSeeds, setResearchSeeds] = useState<ResearchedSeed[]>([])
  const [activeResearchIdx, setActiveResearchIdx] = useState<number>(-1)
  const {
    result: researchResult,
    loading: researchLoading,
    error: researchError,
    fetchTrends: fetchResearchTrends,
  } = useResearch('reel')

  const activeResearchSeed: ResearchedSeed | null =
    researchSeeds.length > 0 && activeResearchIdx >= 0 && activeResearchIdx < researchSeeds.length
      ? researchSeeds[activeResearchIdx]
      : null

  // Open the lab to a clean slate — drop any prior generated reel and
  // platform-tuned variants. Selected platforms are kept so users don't
  // re-pick basics every visit.
  useEffect(() => {
    setItem(makeSeed(formatReelSeedTitle(SEED_PREFIX, REEL_ARC_SEEDS[0])))
    setVariants({})
    setResearchSeeds([])
    setActiveResearchIdx(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Migrate older persisted selections that still hold 'Instagram' /
  // 'Facebook' as separate strings — collapse to a single 'IG/FB'.
  useEffect(() => {
    setSelectedPlatforms((prev) => {
      const stale = prev as ReadonlyArray<string>
      const hasOld = stale.includes('Instagram') || stale.includes('Facebook')
      if (!hasOld) return prev
      const filtered = prev.filter(
        (p) => p !== ('Instagram' as TunerPlatform) && p !== ('Facebook' as TunerPlatform),
      )
      return ['IG/FB' as TunerPlatform, ...filtered.filter((p) => p !== 'IG/FB')]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-tune all selected non-IG/FB platforms whenever IG caption changes
  // or a newly-added platform has no cached variant yet. The IG/FB tab
  // uses the existing ContentCard via customRender, so it doesn't need a
  // stored variant.
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

  const handleResearched = (rec: ResearchedSeed, candidates: ResearchedSeed[]) => {
    setResearchSeeds([rec, ...candidates].slice(0, 3))
    // Don't auto-select — user picks the strategy they like best.
    setActiveResearchIdx(-1)
    setVariants({})
  }

  const handlePickResearchSeed = (idx: number, seed: ResearchedSeed) => {
    setActiveResearchIdx(idx)
    // Encode the picked seed's pillar:subcategory into the item title so
    // generateReelLoungePostAsync parses them out for fetchCaption.
    setItem(makeSeed(`${SEED_PREFIX} — ${seed.pillar}: ${seed.subcategory}`))
    setVariants({})
  }

  const handleGenerate = async () => {
    if (activeResearchSeed) {
      const research = {
        angle: activeResearchSeed.angle,
        notes: activeResearchSeed.sourceNotes,
        ...(activeResearchSeed.shotBrief ? { shotBrief: activeResearchSeed.shotBrief } : {}),
        ...(activeResearchSeed.sourceUrls?.length
          ? { sourceUrls: activeResearchSeed.sourceUrls }
          : {}),
        ...(activeResearchSeed.sourceImageUrls?.length
          ? { sourceImageUrls: activeResearchSeed.sourceImageUrls }
          : {}),
      }
      // Server picks the arc via pickReelArc(pillar) when arcId is undefined.
      const generated = await generateReelLoungePostAsync(item, undefined, research)
      setItem(generated)
      setVariants({})
      return
    }
    const seedIdxAtClick = findReelSeedIdxFromTitle(SEED_PREFIX, item.title)
    const seed = REEL_ARC_SEEDS[seedIdxAtClick]
    const generated = await generateReelLoungePostAsync(item, seed.arcId)
    setItem(decorateTitle(generated, formatReelSeedTitle(SEED_PREFIX, seed)))
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
    edits?: { caption?: string; hashtags?: string[] },
    selectedCrossPosts?: TunerPlatform[],
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
    const result = await postItemToSocials(itemToPost, destination, {
      alsoFacebook,
      selectedCrossPosts,
    })
    setItem((cur) => ({
      ...cur,
      postedToInstagram: result.instagram,
      postedToFacebook: result.facebook,
      facebookError: result.facebookError,
      postedToThreads: result.threads,
      threadsError: result.threadsError,
      postedToYouTube: result.youtube,
      youtubeError: result.youtubeError,
      postedToX: result.x,
      xError: result.xError,
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
    return result
  }

  // Unified post flow state — owned by the lab page so the Post button can
  // sit alongside Generate at the bottom and reflect ALL selected platforms.
  const [postConfirming, setPostConfirming] = useState(false)
  const [postBusy, setPostBusy] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [postToast, setPostToast] = useState<{ kind: 'success' | 'warn'; text: string } | null>(
    null,
  )

  const nonIgSelected = selectedPlatforms.filter((p) => p !== 'IG/FB')

  const buildClipboardPayload = (): string => {
    const sections: string[] = []
    for (const platform of nonIgSelected) {
      const v = variants[platform]
      if (!v) continue
      const head = `--- ${PLATFORM_LABELS[platform]} ---`
      const body =
        platform === 'YouTube Shorts'
          ? [`Title: ${v.title ?? v.caption}`, '', v.description ?? ''].filter(Boolean).join('\n')
          : [v.caption, v.hashtags.join(' ')].filter(Boolean).join('\n\n')
      sections.push(`${head}\n${body}`)
    }
    return sections.join('\n\n')
  }

  const copyNonIgVariantsToClipboard = async (): Promise<boolean> => {
    const payload = buildClipboardPayload()
    if (!payload) return false
    try {
      await navigator.clipboard.writeText(payload)
      return true
    } catch {
      return false
    }
  }

  const showToast = (kind: 'success' | 'warn', text: string) => {
    setPostToast({ kind, text })
    window.setTimeout(() => setPostToast(null), 4000)
  }

  const handleUnifiedPost = async () => {
    if (!item.generatedVisual?.reelUrl) return
    if (selectedPlatforms.includes('IG/FB')) {
      setPostConfirming(true)
      return
    }
    const copied = await copyNonIgVariantsToClipboard()
    if (copied) {
      const labels = nonIgSelected.map((p) => PLATFORM_LABELS[p]).join(' & ')
      showToast('success', `${labels} captions copied — paste into apps`)
    } else {
      showToast('warn', 'Could not copy to clipboard')
    }
  }

  const onConfirmUnifiedPost = async (
    destination: PostDestination,
    opts: { alsoFacebook: boolean },
    edits?: { caption?: string; hashtags?: string[] },
    selectedCrossPosts?: TunerPlatform[],
  ) => {
    setPostBusy(true)
    setPostError(null)
    try {
      const result = await handlePost(destination, opts, edits, selectedCrossPosts)
      const apiHandled = new Set<TunerPlatform>(['Threads', 'YouTube Shorts'])
      const clipboardPlatforms = nonIgSelected.filter((p) => !apiHandled.has(p))
      const copied = clipboardPlatforms.length > 0 ? await copyNonIgVariantsToClipboard() : false
      const summary = summarizeSocialsResult(result)
      const copyLine = copied
        ? ` — ${clipboardPlatforms.map((p) => PLATFORM_LABELS[p]).join(' & ')} captions copied`
        : ''
      setPostConfirming(false)
      showToast(summary.hasError ? 'warn' : 'success', `${summary.text}${copyLine}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setPostError(msg)
      showToast('warn', `Post failed: ${msg}`)
    } finally {
      setPostBusy(false)
    }
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
            One Veo clip, tuned per platform — IG/FB Reel, X, Threads, TikTok, Shorts
          </p>
        </div>

        <ResearchPanel
          loading={researchLoading}
          error={researchError}
          result={researchResult}
          activeIdx={activeResearchIdx}
          onPickSeed={handlePickResearchSeed}
          onResearched={handleResearched}
          fetchTrends={fetchResearchTrends}
          idleTitle="What's hot for reels?"
          idleHint="Pulls fresh signal from Supreme, Scotch and Soda, Chomps, and @starface — then writes you 3 reel angles to ship next."
          researchLabel="Research reel trends"
        />

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
          customRender={{
            'IG/FB': () => (
              <ContentCard
                item={item}
                index={0}
                onShuffle={handleShuffle}
                onGenerate={handleGenerate}
                onLogPost={() => {}}
                onPost={handlePost}
                allowedDestinations={['feed', 'story']}
                onVisualResult={handleVisualResult}
                hideHeaderBadges
                hideShuffleGenerate
                hidePostButton
              />
            ),
          }}
        />

        {selectedPlatforms.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handleShuffle}
                className="text-sm font-bold px-5 py-3 rounded-xl"
                style={{ background: '#10b981', color: 'white' }}
              >
                🔀 Shuffle
              </button>
              <button
                onClick={handleGenerate}
                disabled={!activeResearchSeed && researchSeeds.length > 0}
                title={
                  !activeResearchSeed && researchSeeds.length > 0
                    ? 'Pick one of the 3 research strategies above'
                    : ''
                }
                className="text-sm font-bold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: platformColors.Instagram ?? '#a855f7',
                  color: 'white',
                }}
              >
                ⚡ {item.generatedVisual ? 'Regenerate' : 'Generate'} (reel + all platform variants)
              </button>
            </div>

            {item.generatedVisual?.reelUrl && (
              <button
                onClick={handleUnifiedPost}
                disabled={postBusy}
                className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: 'rgba(59,130,246,.1)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                {postBusy
                  ? 'Posting…'
                  : `📤 Post to ${selectedPlatforms.map((p) => PLATFORM_LABELS[p]).join(', ')}`}
              </button>
            )}

            {postToast && (
              <div
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{
                  background:
                    postToast.kind === 'success'
                      ? 'rgba(16,185,129,.12)'
                      : 'rgba(251,146,60,.12)',
                  color: postToast.kind === 'success' ? '#10b981' : '#fb923c',
                  border: `1px solid ${postToast.kind === 'success' ? '#10b981' : '#fb923c'}`,
                }}
              >
                {postToast.text}
              </div>
            )}
          </div>
        )}

        {postConfirming && item.generatedVisual && (
          <PostConfirmModal
            item={item}
            allowedDestinations={['feed', 'story']}
            crossPostPlatforms={nonIgSelected}
            busy={postBusy}
            lastError={postError}
            onCancel={() => {
              if (postBusy) return
              setPostConfirming(false)
              setPostError(null)
            }}
            onConfirm={onConfirmUnifiedPost}
          />
        )}
      </div>
    </div>
  )
}
