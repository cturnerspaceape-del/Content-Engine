import { useEffect, useMemo, useState } from 'react'
import type { ScheduledPost } from '../../types'
import {
  TEXT_ARCHETYPES,
  pickDifferentArchetypeIdx,
  type TextArchetype,
} from '../../lib/seeds/textArchetype'
import {
  tuneFor,
  tuneForAsync,
  type PlatformVariant,
  type TunerPlatform,
  type TunerSource,
} from '../../lib/platformTuners'
import { toTextArchetype } from '../../lib/research/researchedSeed'
import type { ResearchedSeed } from '../../lib/research/types'
import MultiPlatformPreview from '../MultiPlatformPreview'
import InlineSlotShell from './InlineSlotShell'

type SupportedPlatform = 'X' | 'Threads' | 'Facebook'

const PLATFORM_TO_TUNER: Record<SupportedPlatform, TunerPlatform> = {
  X: 'X',
  Threads: 'Threads',
  Facebook: 'IG/FB',
}

const PLATFORM_ACCENT: Record<SupportedPlatform, string> = {
  X: '#1d9bf0',
  Threads: '#000000',
  Facebook: '#1877f2',
}

interface TextPostSlotPanelProps {
  platform: SupportedPlatform
  scheduled: ScheduledPost | undefined
  ensureSchedule: () => ScheduledPost
  // Per-slot trend signal. When set, derives the archetype from it and
  // feeds research context into the tuners so captions reflect the picked
  // angle instead of the default "Hot Take" template.
  slotResearch?: ResearchedSeed | null
  onChange: (post: ScheduledPost) => void
}

export default function TextPostSlotPanel({
  platform,
  scheduled,
  ensureSchedule,
  slotResearch,
  onChange,
}: TextPostSlotPanelProps) {
  const tunerPlatform = PLATFORM_TO_TUNER[platform]
  const stored = scheduled?.textVariants?.[platform]

  const [archetype, setArchetype] = useState<TextArchetype>(() =>
    slotResearch ? toTextArchetype(slotResearch) : 'Hot Take',
  )
  // When the slot's research seed changes, snap archetype to the derived one
  // so the next Generate uses the freshly picked angle.
  useEffect(() => {
    if (slotResearch) setArchetype(toTextArchetype(slotResearch))
  }, [slotResearch])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localVariant, setLocalVariant] = useState<PlatformVariant | null>(null)

  // Build a PlatformVariant for the preview. If we have a freshly generated
  // variant in component state (with charLimit), use it. Otherwise rehydrate
  // from persisted ScheduledPost.textVariants by re-running the sync tuner
  // for charLimit metadata, then overlaying the persisted caption + hashtags.
  const variant: PlatformVariant | undefined = useMemo(() => {
    if (localVariant) return localVariant
    if (!stored) return undefined
    const base = tuneFor(tunerPlatform, { format: 'text', archetype })
    return {
      ...base,
      caption: stored.caption,
      hashtags: stored.hashtags ?? [],
    }
  }, [localVariant, stored, tunerPlatform, archetype])

  const persist = (v: PlatformVariant) => {
    const target = ensureSchedule()
    onChange({
      ...target,
      textVariants: {
        ...(target.textVariants ?? {}),
        [platform]: { caption: v.caption, hashtags: v.hashtags },
      },
    })
  }

  const runWithArchetype = async (a: TextArchetype) => {
    setBusy(true)
    setError(null)
    try {
      const source: TunerSource = {
        format: 'text',
        archetype: a,
        ...(slotResearch?.angle ? { researchAngle: slotResearch.angle } : {}),
        ...(slotResearch?.sourceNotes ? { researchNotes: slotResearch.sourceNotes } : {}),
      }
      // Optimistic sync fill so the preview updates immediately.
      const sync = tuneFor(tunerPlatform, source)
      setLocalVariant(sync)
      persist(sync)
      // LLM upgrade for X/Threads (IG/FB falls back to sync result).
      const upgraded = await tuneForAsync(tunerPlatform, source)
      setLocalVariant(upgraded)
      persist(upgraded)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleGenerate = () => void runWithArchetype(archetype)

  const handleShuffle = () => {
    const idx = TEXT_ARCHETYPES.indexOf(archetype)
    const nextIdx = pickDifferentArchetypeIdx(idx)
    const nextArchetype = TEXT_ARCHETYPES[nextIdx]
    setArchetype(nextArchetype)
    void runWithArchetype(nextArchetype)
  }

  return (
    <InlineSlotShell
      hasContent={!!variant}
      busy={busy}
      error={error}
      generateLabel="✨ Generate caption"
      emptyHint={`Calls the same tuner as Text Post Lab — drafts a ${platform} caption in seconds.`}
      onGenerate={handleGenerate}
      onShuffle={handleShuffle}
      onRegen={handleGenerate}
      accentColor={PLATFORM_ACCENT[platform]}
    >
      {variant && (
        <MultiPlatformPreview
          selected={[tunerPlatform]}
          variants={{ [tunerPlatform]: variant }}
        />
      )}
    </InlineSlotShell>
  )
}
