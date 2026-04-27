import { useEffect, useMemo, useState } from 'react'
import PlatformPicker, { defaultSelectedPlatforms } from '../PlatformPicker'
import MultiPlatformPreview from '../MultiPlatformPreview'
import { usePersistedState } from '../../utils/persistedState'
import {
  TEXT_ARCHETYPES,
  ARCHETYPE_PLATFORM_COMPAT,
  type TextArchetype,
} from '../../lib/seeds/textArchetype'
import {
  tuneFor,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'

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

function platformsForArchetype(archetype: TextArchetype): TunerPlatform[] {
  // Intersect text-format compat (X / Threads / Email) with archetype compat.
  return defaultSelectedPlatforms('text', archetype)
}

export default function TextPostLab({ onBack }: TextPostLabProps) {
  const [archetype, setArchetype] = usePersistedState<TextArchetype>(
    'sl:textPostLab:archetype',
    'Hot Take',
  )

  // Migrate stale email-only archetypes (Newsletter / Welcome /
  // Re-engagement) that may still be in localStorage after Email was
  // dropped from the cross-post matrix.
  useEffect(() => {
    if (!(TEXT_ARCHETYPES as readonly string[]).includes(archetype)) {
      setArchetype('Hot Take')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:textPostLab:platforms',
    () => platformsForArchetype('Hot Take'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:textPostLab:variants',
    () => ({}),
  )

  // Strip stale 'Email' values from any older persisted selection.
  useEffect(() => {
    setSelectedPlatforms((prev) => {
      const stale = prev as ReadonlyArray<string>
      if (!stale.includes('Email')) return prev
      return prev.filter((p) => (p as string) !== 'Email')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When archetype changes, prune any selected platforms that are no longer
  // compatible (e.g. switching to "Newsletter" drops X + Threads from the
  // selection because they're Email-only).
  useEffect(() => {
    const archCompat = ARCHETYPE_PLATFORM_COMPAT[archetype] as ReadonlyArray<string>
    setSelectedPlatforms((prev) => {
      const pruned = prev.filter((p) => archCompat.includes(p))
      // If pruning emptied the selection, fall back to the archetype default.
      if (pruned.length === 0) return platformsForArchetype(archetype)
      // If pruning didn't change anything, keep the same array reference so
      // the variant-effect below doesn't re-fire unnecessarily.
      return pruned.length === prev.length ? prev : pruned
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetype])

  // Auto-tune variants whenever archetype changes or a new platform is added.
  useEffect(() => {
    const source: TunerSource = { format: 'text', archetype }
    setVariants((prev) => {
      const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
      for (const platform of selectedPlatforms) {
        // Re-roll a fresh variant on archetype change; reuse the cached
        // variant if the platform was already selected for this archetype.
        const cached = prev[platform]
        next[platform] =
          cached && cached.platform === platform ? cached : tuneFor(platform, source)
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetype, selectedPlatforms.join('|')])

  const handleGenerate = () => {
    const source: TunerSource = { format: 'text', archetype }
    const next: Partial<Record<TunerPlatform, PlatformVariant>> = {}
    for (const platform of selectedPlatforms) {
      next[platform] = tuneFor(platform, source)
    }
    setVariants(next)
  }

  const [copyToast, setCopyToast] = useState<{ kind: 'success' | 'warn'; text: string } | null>(
    null,
  )

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

  const handleCopyAll = async () => {
    const payload = buildClipboardPayload()
    if (!payload) {
      setCopyToast({ kind: 'warn', text: 'Nothing to copy yet — click Generate first' })
      window.setTimeout(() => setCopyToast(null), 4000)
      return
    }
    try {
      await navigator.clipboard.writeText(payload)
      const labels = selectedPlatforms.map((p) => PLATFORM_LABELS[p]).join(' & ')
      setCopyToast({ kind: 'success', text: `${labels} captions copied — paste into apps` })
    } catch {
      setCopyToast({ kind: 'warn', text: 'Could not copy to clipboard' })
    }
    window.setTimeout(() => setCopyToast(null), 4000)
  }

  const archetypeChips = useMemo(() => TEXT_ARCHETYPES, [])

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
            Pure text, tuned per platform — X / Threads
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {archetypeChips.map((a) => {
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
        </div>

        <p className="text-center text-[11px] mb-4" style={{ color: 'var(--muted)' }}>
          {ARCHETYPE_DESCRIPTIONS[archetype]}
        </p>

        <PlatformPicker
          format="text"
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
          archetype={archetype}
        />

        <MultiPlatformPreview
          selected={selectedPlatforms}
          variants={variants}
        />

        {selectedPlatforms.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handleGenerate}
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
              onClick={handleCopyAll}
              className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
              style={{
                background: 'rgba(59,130,246,.1)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
              }}
            >
              📤 Copy for {selectedPlatforms.map((p) => PLATFORM_LABELS[p]).join(', ')}
            </button>

            {copyToast && (
              <div
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{
                  background:
                    copyToast.kind === 'success'
                      ? 'rgba(16,185,129,.12)'
                      : 'rgba(251,146,60,.12)',
                  color: copyToast.kind === 'success' ? '#10b981' : '#fb923c',
                  border: `1px solid ${copyToast.kind === 'success' ? '#10b981' : '#fb923c'}`,
                }}
              >
                {copyToast.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
