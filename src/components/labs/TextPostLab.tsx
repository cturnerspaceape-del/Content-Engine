import { useEffect, useMemo } from 'react'
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

const ARCHETYPE_DESCRIPTIONS: Record<TextArchetype, string> = {
  'Hot Take': 'A confident opinion delivered with conviction.',
  'Drop Announce': 'New product or restock — get the list moving.',
  Hook: 'Short attention-grabber that leads somewhere.',
  Question: 'An open question to spark replies.',
  Shoutout: 'Thanks to community, partners, or customers.',
  'Meme Line': 'A one-liner the group chat will screenshot.',
  Newsletter: 'Recap of what shipped and what is coming.',
  Welcome: 'First touch after sign-up — set the tone, drop a code.',
  'Re-engagement': "Win back subscribers who haven't opened in a while.",
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

  const [selectedPlatforms, setSelectedPlatforms] = usePersistedState<TunerPlatform[]>(
    'sl:textPostLab:platforms',
    () => platformsForArchetype('Hot Take'),
  )

  const [variants, setVariants] = usePersistedState<Partial<Record<TunerPlatform, PlatformVariant>>>(
    'sl:textPostLab:variants',
    () => ({}),
  )

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

  const handleRetune = (platform: TunerPlatform) => {
    const source: TunerSource = { format: 'text', archetype }
    setVariants((prev) => ({ ...prev, [platform]: tuneFor(platform, source) }))
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
            Pure text, tuned per platform — X / Threads / Email
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
          onRetune={handleRetune}
          tabStateKey="sl:textPostLab:activeTab"
        />

        <div className="flex justify-center mt-4">
          <button
            onClick={handleGenerate}
            className="text-sm font-bold px-6 py-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
              color: 'white',
            }}
          >
            ⚡ Generate (all platforms)
          </button>
        </div>
      </div>
    </div>
  )
}
