import { useEffect, useState } from 'react'
import ContentCard from '../ContentCard'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import PostConfirmModal from '../PostConfirmModal'
import ScheduleModal, { buildTakenSlots } from '../ScheduleModal'
import ImageEditModal from '../ImageEditModal'
import type { ContentItem, ContentPillar, PostDestination, ScheduledPost } from '../../types'
import { generateContentForPostAsync } from '../../data/instagramContentTemplates'
import { usePersistedState } from '../../utils/persistedState'
import { postItemToSocials, summarizeSocialsResult } from '../../lib/postToInstagram'
import { formatPillarSeedTitle } from '../../lib/seeds/pillarImage'
import ResearchPanel from '../ResearchPanel'
import { useResearch } from '../../lib/research/useResearch'
import { toPillarImageSeed } from '../../lib/research/researchedSeed'
import type { ResearchedSeed } from '../../lib/research/types'
import {
  tuneFor,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'
import { platformColors } from '../PlatformContentItem'
import { useToast, ToastView } from '../ui/Toast'

interface ImageLabProps {
  onBack: () => void
  scheduledPosts: ScheduledPost[]
  onSchedulePost: (post: ScheduledPost) => void
}

const SEED_PREFIX = 'Single Image'

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
    emoji: '📷',
    title,
    description: 'Click Generate to build a cross-post image.',
    contentType: 'Post',
    generated: false,
  }
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

const PLACEHOLDER_TITLE = `${SEED_PREFIX} — awaiting research`

export default function ImageLab({ onBack, scheduledPosts, onSchedulePost }: ImageLabProps) {
  const [item, setItem] = usePersistedState<ContentItem>(
    'sl:imageLab:item',
    () => makeSeed(PLACEHOLDER_TITLE),
  )

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:imageLab:platforms',
    () => defaultSelectedPlatforms('image'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:imageLab:variants',
    () => ({}),
  )

  // Research is the source of truth — there are no static template seeds.
  // researchSeeds holds the 3 ideas from the most recent /api/research-trends
  // call; activeResearchIdx tracks which one is currently picked. -1 means
  // "nothing picked yet" — Generate stays disabled until the user explicitly
  // chooses one of the 3 strategies. Not persisted — opening the lab should
  // always land on the idle CTA, not last session's seeds.
  const [researchSeeds, setResearchSeeds] = useState<ResearchedSeed[]>([])
  const [activeResearchIdx, setActiveResearchIdx] = useState<number>(-1)
  // Source of truth for "which seed feeds Generate." Stored as the seed
  // object, not an index, so the user-authored Custom seed (sentinel
  // CUSTOM_SEED_IDX = 99 in ResearchPanel) is preserved — array indexing
  // would treat 99 as out-of-range and silently disable Generate.
  const [selectedSeed, setSelectedSeed] = useState<ResearchedSeed | null>(null)
  const {
    result: researchResult,
    loading: researchLoading,
    error: researchError,
    fetchTrends: fetchResearchTrends,
  } = useResearch('image')

  const activeResearchSeed: ResearchedSeed | null = selectedSeed

  // Open the lab to a clean slate — drop any prior generated image,
  // variants, and research seeds. Selected platforms are kept.
  useEffect(() => {
    setItem(makeSeed(PLACEHOLDER_TITLE))
    setVariants({})
    setResearchSeeds([])
    setActiveResearchIdx(-1)
    setSelectedSeed(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Migrate older persisted selections that still hold legacy platform names.
  useEffect(() => {
    setSelectedPlatforms((prev) => {
      const stale = prev as ReadonlyArray<string>
      const hasOld =
        stale.includes('Instagram') ||
        stale.includes('Facebook') ||
        stale.includes('Email') ||
        stale.includes('TikTok') ||
        stale.includes('YouTube Shorts')
      if (!hasOld) return prev
      const filtered = prev.filter(
        (p) =>
          (p as string) !== 'Instagram' &&
          (p as string) !== 'Facebook' &&
          (p as string) !== 'Email' &&
          (p as string) !== 'TikTok' &&
          (p as string) !== 'YouTube Shorts',
      )
      return ['IG/FB' as TunerPlatform, ...filtered.filter((p) => p !== 'IG/FB')]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-tune all selected non-IG/FB platforms whenever the IG item is
  // regenerated (caption changes) or a new platform is added without a
  // cached variant.
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
    const seeds = [rec, ...candidates].slice(0, 3)
    setResearchSeeds(seeds)
    // Don't auto-select — user picks the strategy they like best.
    setActiveResearchIdx(-1)
    setSelectedSeed(null)
    setItem(makeSeed(PLACEHOLDER_TITLE))
    setVariants({})
  }

  const handlePickSeed = (idx: number, seed: ResearchedSeed) => {
    setActiveResearchIdx(idx)
    setSelectedSeed(seed)
    setItem(makeSeed(formatPillarSeedTitle(SEED_PREFIX, toPillarImageSeed(seed))))
    setVariants({})
  }

  const handleGenerate = async () => {
    if (!activeResearchSeed) return
    // Always send a shotBrief — the image endpoint requires a non-empty
    // prompt. Custom seeds (and any research seeds Claude returned without
    // a shotBrief) fall back to the angle so the image model still has
    // visual direction to work with.
    const research = {
      angle: activeResearchSeed.angle,
      notes: activeResearchSeed.sourceNotes,
      shotBrief: activeResearchSeed.shotBrief ?? activeResearchSeed.angle,
      ...(activeResearchSeed.sourceUrls?.length
        ? { sourceUrls: activeResearchSeed.sourceUrls }
        : {}),
      ...(activeResearchSeed.sourceImageUrls?.length
        ? { sourceImageUrls: activeResearchSeed.sourceImageUrls }
        : {}),
    }
    const generated = await generateContentForPostAsync(item, research)
    const seedTitle = formatPillarSeedTitle(SEED_PREFIX, toPillarImageSeed(activeResearchSeed))
    setItem({ ...generated, title: seedTitle })
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

  const [postConfirming, setPostConfirming] = useState(false)
  const [postBusy, setPostBusy] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const { toast: postToast, show: showToast } = useToast()
  const [schedulingOpen, setSchedulingOpen] = useState(false)
  const [editingOpen, setEditingOpen] = useState(false)

  const handleConfirmSchedule = (date: string, time: string) => {
    if (!item.generatedVisual?.imageUrl) return
    const post: ScheduledPost = {
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      time,
      platform: 'Instagram',
      format: 'Single Image',
      idea: item.title,
      item,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    onSchedulePost(post)
    setSchedulingOpen(false)
    showToast({ kind: 'success', text: `📅 Locked in for ${date} at ${time}` })
  }

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

  const handleUnifiedPost = async () => {
    if (!item.generatedVisual?.imageUrl) return
    if (selectedPlatforms.includes('IG/FB')) {
      setPostConfirming(true)
      return
    }
    const copied = await copyNonIgVariantsToClipboard()
    if (copied) {
      const labels = nonIgSelected.map((p) => PLATFORM_LABELS[p]).join(' & ')
      showToast({ kind: 'success', text: `${labels} captions copied — paste into apps` })
    } else {
      showToast({ kind: 'warn', text: 'Could not copy to clipboard' })
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
      showToast({ kind: summary.hasError ? 'warn' : 'success', text: `${summary.text}${copyLine}` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setPostError(msg)
      showToast({ kind: 'warn', text: `Post failed: ${msg}` })
    } finally {
      setPostBusy(false)
    }
  }

  const canGenerate = activeResearchSeed != null

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
            One image, tuned per platform — IG/FB, X, Threads
          </p>
        </div>

        <ResearchPanel
          loading={researchLoading}
          error={researchError}
          result={researchResult}
          activeIdx={activeResearchIdx}
          onPickSeed={handlePickSeed}
          onResearched={handleResearched}
          fetchTrends={fetchResearchTrends}
          idleTitle="What's hot for image posts?"
          idleHint="Pulls fresh signal from Supreme, Scotch and Soda, Chomps, and @starface — then writes you 3 image angles to ship next."
          researchLabel="Research image trends"
          includeShotBrief
        />

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
          customRender={{
            'IG/FB': () => (
              <ContentCard
                item={item}
                index={0}
                onShuffle={() => {}}
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
            <div className="flex flex-wrap justify-center gap-2 items-start">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                title={canGenerate ? '' : 'Run Research first to pick an idea'}
                className="text-sm font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: platformColors.Instagram ?? '#a855f7',
                  color: 'white',
                }}
              >
                ⚡ {item.generatedVisual ? 'Regenerate' : 'Generate'} (image + all platform variants)
              </button>
            </div>

            {item.generatedVisual?.imageUrl && (
              <div className="flex flex-wrap justify-center gap-2">
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
                <button
                  onClick={() => setEditingOpen(true)}
                  className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
                  style={{
                    background: 'rgba(245,158,11,.1)',
                    border: '1px solid #f59e0b',
                    color: '#f59e0b',
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setSchedulingOpen(true)}
                  className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
                  style={{
                    background: 'rgba(139,92,246,.1)',
                    border: '1px solid #8b5cf6',
                    color: '#8b5cf6',
                  }}
                >
                  📅 Schedule
                </button>
              </div>
            )}

            <ToastView toast={postToast} />
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
        {schedulingOpen && (
          <ScheduleModal
            label="this image"
            platform="Instagram"
            takenSlots={buildTakenSlots(scheduledPosts)}
            onCancel={() => setSchedulingOpen(false)}
            onConfirm={handleConfirmSchedule}
          />
        )}
        {editingOpen && item.generatedVisual?.imageUrl && (
          <ImageEditModal
            label="this image"
            imageUrl={item.generatedVisual.imageUrl}
            kind="single-image"
            onCancel={() => setEditingOpen(false)}
            onApplied={(newUrl) => {
              setItem((cur) => {
                if (!cur.generatedVisual) return cur
                return {
                  ...cur,
                  generatedVisual: {
                    ...cur.generatedVisual,
                    imageUrl: newUrl,
                    imageError: undefined,
                  },
                }
              })
              setEditingOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
