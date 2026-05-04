import { useEffect, useState } from 'react'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import TextVariantEditDialog from '../TextVariantEditDialog'
import TextPostReviewModal from '../TextPostReviewModal'
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
import ResearchButton from '../ResearchButton'
import { useResearch } from '../../lib/research/useResearch'
import { toTextArchetype } from '../../lib/research/researchedSeed'
import type { ResearchedSeed } from '../../lib/research/types'

interface TextPostLabProps {
  onBack: () => void
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  'IG/FB': 'IG/FB',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
}

const ARCHETYPE_DESCRIPTIONS: Record<TextArchetype, string> = {
  'Hot Take': 'A confident opinion delivered with conviction.',
  'Drop Announce': 'New product or restock — get the list moving.',
  Hook: 'Short attention-grabber that leads somewhere.',
  Question: 'An open question to spark replies.',
  Shoutout: 'Thanks to community, partners, or customers.',
  'Meme Line': 'A one-liner the group chat will screenshot.',
}

export default function TextPostLab({ onBack }: TextPostLabProps) {
  const [archetype, setArchetype] = usePersistedState<TextArchetype>(
    'sl:textPostLab:archetype',
    'Hot Take',
  )

  // Migrate stale email-only archetypes that may still be in localStorage.
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

  const [researchSeeds, setResearchSeeds] = usePersistedState<ResearchedSeed[]>(
    'sl:textPostLab:researchSeeds',
    () => [],
  )
  const [activeResearchIdx, setActiveResearchIdx] = usePersistedState<number>(
    'sl:textPostLab:activeResearchIdx',
    0,
  )
  const {
    result: researchResult,
    loading: researchLoading,
    error: researchError,
    fetchTrends: fetchResearchTrends,
    clear: clearResearch,
  } = useResearch('text')

  const inResearchMode = researchSeeds.length > 0
  const activeResearchSeed = inResearchMode
    ? researchSeeds[Math.min(activeResearchIdx, researchSeeds.length - 1)]
    : null

  // Build the TunerSource consistently — research context is folded in when
  // an active researched seed is present so /api/generate-caption anchors to
  // the trend angle.
  const buildSource = (a: TextArchetype): TunerSource => ({
    format: 'text',
    archetype: a,
    researchAngle: activeResearchSeed?.angle,
    researchNotes: activeResearchSeed?.sourceNotes,
  })

  // Strip stale 'Email' values from any older persisted selection.
  useEffect(() => {
    setSelectedPlatforms((prev) => {
      const stale = prev as ReadonlyArray<string>
      if (!stale.includes('Email')) return prev
      return prev.filter((p) => (p as string) !== 'Email')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-tune variants whenever archetype changes or a new platform is added.
  // Initial pass uses the sync tuner (instant fallback content), then the LLM
  // tuner upgrades each variant with a freshly-written, voice-tuned line.
  // Cached variants survive across archetype changes (keyed by platform), so
  // user edits made for one archetype persist if they switch and switch back.
  useEffect(() => {
    const source: TunerSource = buildSource(archetype)
    setVariants((prev) => {
      const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
      for (const platform of selectedPlatforms) {
        const cached = prev[platform]
        next[platform] =
          cached && cached.platform === platform ? cached : tuneFor(platform, source)
      }
      return next
    })
    // Then upgrade any platform that wasn't already cached with an LLM-written line.
    let cancelled = false
    ;(async () => {
      for (const platform of selectedPlatforms) {
        // Only fetch when there's no user-edited variant already.
        const v = await tuneForAsync(platform, source)
        if (cancelled) return
        setVariants((prev) => ({ ...prev, [platform]: v }))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetype, selectedPlatforms.join('|')])

  const handleGenerate = async () => {
    const source: TunerSource = buildSource(archetype)
    // Optimistic sync fill so the UI updates immediately, then LLM upgrade.
    const optimistic: Partial<Record<TunerPlatform, PlatformVariant>> = {}
    for (const platform of selectedPlatforms) optimistic[platform] = tuneFor(platform, source)
    setVariants(optimistic)
    const upgrades = await Promise.all(
      selectedPlatforms.map(async (p) => [p, await tuneForAsync(p, source)] as const),
    )
    const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
    for (const [p, v] of upgrades) next[p] = v
    setVariants(next)
  }

  // Pick a different archetype than the current one and re-tune. Mirrors
  // pickDifferentPillarSeedIdx from the image Labs. In research mode we
  // shuffle through the researched candidates instead of TEXT_ARCHETYPES.
  const handleShuffle = async () => {
    let nextArchetype: TextArchetype
    let nextResearchSeed: ResearchedSeed | null = null
    if (inResearchMode) {
      const cur = activeResearchIdx
      let next = cur
      if (researchSeeds.length > 1) {
        while (next === cur) next = Math.floor(Math.random() * researchSeeds.length)
      } else {
        next = 0
      }
      setActiveResearchIdx(next)
      nextResearchSeed = researchSeeds[next]
      nextArchetype = toTextArchetype(nextResearchSeed)
    } else {
      const idx = TEXT_ARCHETYPES.indexOf(archetype)
      let nextIdx = idx
      if (TEXT_ARCHETYPES.length > 1) {
        while (nextIdx === idx) {
          nextIdx = Math.floor(Math.random() * TEXT_ARCHETYPES.length)
        }
      }
      nextArchetype = TEXT_ARCHETYPES[nextIdx]
    }
    setArchetype(nextArchetype)
    const source: TunerSource = {
      format: 'text',
      archetype: nextArchetype,
      researchAngle: nextResearchSeed?.angle ?? activeResearchSeed?.angle,
      researchNotes: nextResearchSeed?.sourceNotes ?? activeResearchSeed?.sourceNotes,
    }
    const optimistic: Partial<Record<TunerPlatform, PlatformVariant>> = {}
    for (const platform of selectedPlatforms) optimistic[platform] = tuneFor(platform, source)
    setVariants(optimistic)
    const upgrades = await Promise.all(
      selectedPlatforms.map(async (p) => [p, await tuneForAsync(p, source)] as const),
    )
    const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
    for (const [p, v] of upgrades) next[p] = v
    setVariants(next)
  }

  const handleResearched = (rec: ResearchedSeed, candidates: ResearchedSeed[]) => {
    const seeds = [rec, ...candidates]
    setResearchSeeds(seeds)
    setActiveResearchIdx(0)
    setArchetype(toTextArchetype(rec))
    setVariants({})
  }

  const handleClearResearch = () => {
    setResearchSeeds([])
    setActiveResearchIdx(0)
    clearResearch()
    setVariants({})
  }

  const handlePickResearchSeed = (idx: number) => {
    setActiveResearchIdx(idx)
    setArchetype(toTextArchetype(researchSeeds[idx]))
    setVariants({})
  }

  const [toast, setToast] = useState<{ kind: 'success' | 'warn'; text: string } | null>(null)
  const showToast = (kind: 'success' | 'warn', text: string) => {
    setToast({ kind, text })
    window.setTimeout(() => setToast(null), 4000)
  }

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
      showToast('warn', 'Nothing to copy yet — click Generate first')
      return
    }
    setPostReviewing(true)
  }

  const confirmPost = async () => {
    setPostReviewing(false)
    const payload = buildClipboardPayload()
    if (!payload) {
      showToast('warn', 'Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(payload)
      const labels = selectedPlatforms
        .filter((p) => variants[p])
        .map((p) => PLATFORM_LABELS[p])
        .join(' & ')
      showToast('success', `${labels} captions copied — paste into apps`)
    } catch {
      showToast('warn', 'Could not copy to clipboard')
    }
  }

  // Inline edit dialog state.
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
            One thought, tuned for X &amp; Threads
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {inResearchMode
            ? researchSeeds.map((seed, idx) => {
                const active = idx === activeResearchIdx
                return (
                  <button
                    key={seed.subcategory + idx}
                    onClick={() => handlePickResearchSeed(idx)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? 'rgba(236,72,153,.18)' : 'var(--panel-2)',
                      color: active ? '#ec4899' : 'var(--muted)',
                      border: `1px solid ${active ? '#ec4899' : 'var(--border)'}`,
                    }}
                    title={seed.angle}
                  >
                    {seed.subcategory}
                  </button>
                )
              })
            : TEXT_ARCHETYPES.map((a) => {
                const active = a === archetype
                return (
                  <button
                    key={a}
                    onClick={() => setArchetype(a)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? 'rgba(29,155,240,.15)' : 'var(--panel-2)',
                      color: active ? '#1d9bf0' : 'var(--muted)',
                      border: `1px solid ${active ? '#1d9bf0' : 'var(--border)'}`,
                    }}
                    title={ARCHETYPE_DESCRIPTIONS[a]}
                  >
                    {a}
                  </button>
                )
              })}
          {inResearchMode && (
            <button
              onClick={handleClearResearch}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: 'transparent',
                color: 'var(--muted)',
                border: '1px dashed var(--border)',
              }}
              title="Switch back to the static archetype seeds"
            >
              ✕ Use templates
            </button>
          )}
        </div>

        <p className="text-center text-[11px] mb-4" style={{ color: 'var(--muted)' }}>
          {inResearchMode && activeResearchSeed
            ? activeResearchSeed.angle
            : ARCHETYPE_DESCRIPTIONS[archetype]}
        </p>

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
              <ResearchButton
                loading={researchLoading}
                error={researchError}
                result={researchResult}
                onResearched={handleResearched}
                fetchTrends={fetchResearchTrends}
              />
              <button
                onClick={handleShuffle}
                className="text-sm font-bold px-5 py-3 rounded-xl"
                style={{ background: '#10b981', color: 'white' }}
              >
                🔀 Shuffle
              </button>
              <button
                onClick={handleGenerate}
                className="text-sm font-bold px-6 py-3 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
                  color: 'white',
                }}
              >
                ⚡ Regenerate (all platforms)
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

            {toast && (
              <div
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{
                  background:
                    toast.kind === 'success'
                      ? 'rgba(16,185,129,.12)'
                      : 'rgba(251,146,60,.12)',
                  color: toast.kind === 'success' ? '#10b981' : '#fb923c',
                  border: `1px solid ${toast.kind === 'success' ? '#10b981' : '#fb923c'}`,
                }}
              >
                {toast.text}
              </div>
            )}
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
