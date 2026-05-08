import { useEffect, useState } from 'react'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import TextVariantEditDialog from '../TextVariantEditDialog'
import TextPostReviewModal from '../TextPostReviewModal'
import { useToast, ToastView } from '../ui/Toast'
import { usePersistedState } from '../../utils/persistedState'
import {
  TEXT_ARCHETYPES,
  type TextArchetype,
} from '../../lib/seeds/textArchetype'
import {
  tuneFor,
  tuneForAsync,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'
import ResearchPanel from '../ResearchPanel'
import { useResearch } from '../../lib/research/useResearch'
import { toTextArchetype } from '../../lib/research/researchedSeed'
import type { ResearchedSeed } from '../../lib/research/types'

interface TextPostLabProps {
  onBack: () => void
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  'IG/FB': 'Meta',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
}

// Per-platform char ceiling for clipping the canonical post. Threads (500)
// is the soft cap we generate to; X (280) clamps at copy time. IG/FB has no
// hard text limit but sticks with the Threads-length payload.
const PLATFORM_CHAR_LIMITS: Partial<Record<TunerPlatform, number>> = {
  X: 280,
  Threads: 500,
  'IG/FB': 500,
}

export default function TextPostLab({ onBack }: TextPostLabProps) {
  // Archetype is internal state used only by the platform tuners; it's not
  // user-facing anymore (research picks an angle, archetype is derived).
  const [archetype, setArchetype] = usePersistedState<TextArchetype>(
    'sl:textPostLab:archetype',
    'Hot Take',
  )

  useEffect(() => {
    if (!(TEXT_ARCHETYPES as readonly string[]).includes(archetype)) {
      setArchetype('Hot Take')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:textPostLab:platforms',
    () => defaultSelectedPlatforms('text'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:textPostLab:variants',
    () => ({}),
  )

  // Not persisted — opening the lab lands on the idle CTA, not last
  // session's seeds.
  const [researchSeeds, setResearchSeeds] = useState<ResearchedSeed[]>([])
  // -1 = nothing picked yet; Generate stays disabled until the user picks.
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
  } = useResearch('text')

  const activeResearchSeed: ResearchedSeed | null = selectedSeed

  const buildSource = (a: TextArchetype): TunerSource => ({
    format: 'text',
    archetype: a,
    researchAngle: activeResearchSeed?.angle,
    researchNotes: activeResearchSeed?.sourceNotes,
  })

  useEffect(() => {
    setSelectedPlatforms((prev) => {
      const stale = prev as ReadonlyArray<string>
      if (!stale.includes('Email')) return prev
      return prev.filter((p) => (p as string) !== 'Email')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Open the lab to a clean slate — drop prior tuned variants and any
  // research seeds. Archetype + selected platforms are kept.
  useEffect(() => {
    setVariants({})
    setResearchSeeds([])
    setActiveResearchIdx(-1)
    setSelectedSeed(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Note: previously this lab auto-tuned variants whenever the active
  // research seed changed, which made the preview pop in before the user
  // ever clicked Generate. Removed — the only path that populates variants
  // is now `handleGenerate` below. Picking a research card just stages the
  // angle; the preview stays empty until Generate is clicked.

  // Cross-post toggle reactivity: when the user (un)checks a platform after
  // generating, re-replicate the canonical post into the new selection set
  // so the preview matches the checkboxes without forcing a regenerate.
  useEffect(() => {
    setVariants((prev) => {
      const existing = Object.values(prev).find((v): v is PlatformVariant => Boolean(v))
      if (!existing) return prev
      const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
      for (const platform of selectedPlatforms) {
        const limit = PLATFORM_CHAR_LIMITS[platform] ?? existing.charLimit
        const text = existing.caption
        const capped =
          text.length <= limit ? text : text.slice(0, limit - 1).trimEnd() + '…'
        next[platform] = {
          platform,
          caption: capped,
          hashtags: existing.hashtags,
          charLimit: limit,
        }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatforms.join('|')])

  const handleResearched = (rec: ResearchedSeed, candidates: ResearchedSeed[]) => {
    const seeds = [rec, ...candidates].slice(0, 3)
    setResearchSeeds(seeds)
    // Don't auto-select — user picks the strategy they like best. Archetype
    // is set later by handlePickSeed once they choose.
    setActiveResearchIdx(-1)
    setSelectedSeed(null)
    setVariants({})
  }

  const handlePickSeed = (idx: number, seed: ResearchedSeed) => {
    setActiveResearchIdx(idx)
    setSelectedSeed(seed)
    setArchetype(toTextArchetype(seed))
    setVariants({})
  }

  // Replicate one canonical caption + hashtags across every selected
  // platform's variant slot, clipping each to that platform's char limit.
  // Lets MultiPlatformPreview keep its per-platform layout while the user-
  // facing model is "one post, cross-posted everywhere I check."
  const replicate = (canonical: PlatformVariant): Partial<Record<TunerPlatform, PlatformVariant>> => {
    const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
    for (const platform of selectedPlatforms) {
      const limit = PLATFORM_CHAR_LIMITS[platform] ?? canonical.charLimit
      const text = canonical.caption
      const capped = text.length <= limit ? text : text.slice(0, limit - 1).trimEnd() + '…'
      next[platform] = {
        platform,
        caption: capped,
        hashtags: canonical.hashtags,
        charLimit: limit,
      }
    }
    return next
  }

  // Generate ONE post (tuned to X's 280-char ceiling so it fits everywhere),
  // then mirror it into each selected platform's preview slot. The cross-post
  // checkboxes (selectedPlatforms) decide who sees the same post — they no
  // longer trigger separate generations.
  const handleGenerate = async () => {
    if (!activeResearchSeed) return
    const source: TunerSource = buildSource(archetype)
    const optimistic = tuneFor('X', source)
    setVariants(replicate(optimistic))
    const canonical = await tuneForAsync('X', source)
    setVariants(replicate(canonical))
  }

  const { toast, show: showToast } = useToast()

  const buildClipboardPayload = (): string => {
    const sections: string[] = []
    for (const platform of selectedPlatforms) {
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

  const [postReviewing, setPostReviewing] = useState(false)

  const handlePost = () => {
    const payload = buildClipboardPayload()
    if (!payload) {
      showToast({ kind: 'warn', text: 'Nothing to copy yet — click Generate first' })
      return
    }
    setPostReviewing(true)
  }

  const confirmPost = async () => {
    setPostReviewing(false)
    const payload = buildClipboardPayload()
    if (!payload) {
      showToast({ kind: 'warn', text: 'Nothing to copy' })
      return
    }
    try {
      await navigator.clipboard.writeText(payload)
      const labels = selectedPlatforms
        .filter((p) => variants[p])
        .map((p) => PLATFORM_LABELS[p])
        .join(' & ')
      showToast({ kind: 'success', text: `${labels} captions copied — paste into apps` })
    } catch {
      showToast({ kind: 'warn', text: 'Could not copy to clipboard' })
    }
  }

  const [editingPlatform, setEditingPlatform] = useState<TunerPlatform | null>(null)

  const handleSaveEdit = (next: { caption: string; hashtags: string[] }) => {
    if (!editingPlatform) return
    setVariants((prev) => {
      const cur = prev[editingPlatform]
      if (!cur) return prev
      return {
        ...prev,
        [editingPlatform]: { ...cur, caption: next.caption, hashtags: next.hashtags },
      }
    })
    setEditingPlatform(null)
  }

  const editingVariant = editingPlatform ? variants[editingPlatform] : null

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
              background: 'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ✍️ Text Post Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            One post — cross-post to X, Threads, &amp; Meta
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
          idleTitle="What's hot for short text posts?"
          idleHint="Pulls fresh signal from Supreme, Scotch and Soda, Chomps, and @starface — then writes you 3 angles for X & Threads."
          researchLabel="Research text trends"
        />

        <PlatformPicker
          format="text"
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />

        <MultiPlatformPreview
          selected={selectedPlatforms}
          variants={variants}
          onEditVariant={(platform) => setEditingPlatform(platform)}
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
                  background: 'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
                  color: 'white',
                }}
              >
                ⚡ {Object.keys(variants).length > 0 ? 'Regenerate' : 'Generate'} post
              </button>
            </div>

            <button
              onClick={handlePost}
              className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
              style={{
                background: 'rgba(59,130,246,.1)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
              }}
            >
              📤 Post to {selectedPlatforms.map((p) => PLATFORM_LABELS[p]).join(' & ')}
            </button>

            <ToastView toast={toast} />
          </div>
        )}

        {postReviewing && (
          <TextPostReviewModal
            platforms={selectedPlatforms}
            variants={variants}
            onCancel={() => setPostReviewing(false)}
            onConfirm={confirmPost}
          />
        )}

        {editingPlatform && editingVariant && (
          <TextVariantEditDialog
            platform={editingPlatform}
            caption={editingVariant.caption}
            hashtags={editingVariant.hashtags}
            charLimit={editingVariant.charLimit}
            onSave={handleSaveEdit}
            onCancel={() => setEditingPlatform(null)}
          />
        )}
      </div>
    </div>
  )
}
