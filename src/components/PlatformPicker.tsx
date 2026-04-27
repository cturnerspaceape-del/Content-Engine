import { useMemo } from 'react'
import {
  FORMAT_PLATFORM_COMPAT,
  type TunerFormat,
  type TunerPlatform,
} from '../lib/platformTuners'
import {
  ARCHETYPE_PLATFORM_COMPAT,
  type TextArchetype,
} from '../lib/seeds/textArchetype'
import { platformColors } from './PlatformContentItem'

interface PlatformPickerProps {
  format: TunerFormat
  selected: ReadonlyArray<TunerPlatform>
  onChange: (next: TunerPlatform[]) => void
  archetype?: TextArchetype
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  Instagram: 'Instagram',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
  Email: 'Email',
}

const PLATFORM_ICONS: Record<TunerPlatform, string> = {
  Instagram: '📷',
  X: '𝕏',
  Threads: '@',
  TikTok: '🎵',
  'YouTube Shorts': '▶',
  Email: '📧',
}

export default function PlatformPicker({
  format,
  selected,
  onChange,
  archetype,
}: PlatformPickerProps) {
  const compatible = useMemo<ReadonlyArray<TunerPlatform>>(() => {
    const formatList = FORMAT_PLATFORM_COMPAT[format]
    if (!archetype) return formatList
    // Text Lab: intersect with archetype compatibility (e.g. "Question"
    // doesn't make sense as Email; "Newsletter" is Email-only).
    const archList = ARCHETYPE_PLATFORM_COMPAT[archetype] as ReadonlyArray<string>
    return formatList.filter((p) => archList.includes(p))
  }, [format, archetype])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const toggle = (platform: TunerPlatform) => {
    const next = new Set(selectedSet)
    if (next.has(platform)) next.delete(platform)
    else next.add(platform)
    // Keep selection in compatibility-order, not click-order.
    onChange(compatible.filter((p) => next.has(p)))
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider self-center mr-1"
        style={{ color: 'var(--muted)' }}
      >
        Cross-post to:
      </span>
      {compatible.map((p) => {
        const active = selectedSet.has(p)
        const accent = platformColors[p] ?? 'var(--accent)'
        return (
          <button
            key={p}
            onClick={() => toggle(p)}
            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: active ? `${accent}22` : 'var(--panel-2)',
              color: active ? accent : 'var(--muted)',
              border: `1px solid ${active ? accent : 'var(--border)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{PLATFORM_ICONS[p]}</span>
            <span>{PLATFORM_LABELS[p]}</span>
            {active && <span style={{ fontSize: 10, opacity: 0.7 }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

// Helper for Labs: "all compatible platforms" default for a given format
// (and optionally archetype). Used by the persisted-state initializer.
export function defaultSelectedPlatforms(
  format: TunerFormat,
  archetype?: TextArchetype,
): TunerPlatform[] {
  const formatList = FORMAT_PLATFORM_COMPAT[format]
  if (!archetype) return [...formatList]
  const archList = ARCHETYPE_PLATFORM_COMPAT[archetype] as ReadonlyArray<string>
  return formatList.filter((p) => archList.includes(p))
}
