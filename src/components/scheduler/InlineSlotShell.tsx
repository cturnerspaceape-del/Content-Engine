import type { ReactNode } from 'react'
import GeneratingPlaceholder from '../ui/GeneratingPlaceholder'

interface InlineSlotShellProps {
  hasContent: boolean
  busy: boolean
  error?: string | null
  generateLabel: string
  emptyHint: string
  onGenerate: () => void
  onShuffle: () => void
  onRegen?: () => void
  accentColor?: string
  children?: ReactNode
}

export default function InlineSlotShell({
  hasContent,
  busy,
  error,
  generateLabel,
  emptyHint,
  onGenerate,
  onShuffle,
  onRegen,
  accentColor = '#ec4899',
  children,
}: InlineSlotShellProps) {
  if (!hasContent) {
    return (
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onGenerate}
          disabled={busy}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
          style={{
            background: busy ? 'var(--panel-2)' : accentColor,
            color: '#fff',
            border: 'none',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? <GeneratingPlaceholder variant="inline" /> : generateLabel}
        </button>
        <p className="text-[10px] mt-2 italic" style={{ color: 'var(--muted)' }}>
          {emptyHint}
        </p>
        {error && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="mt-3 pt-3 flex flex-col gap-3"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onShuffle}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            opacity: busy ? 0.6 : 1,
          }}
        >
          🔀 Shuffle
        </button>
        {onRegen && (
          <button
            onClick={onRegen}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{
              background: 'rgba(184,164,255,.18)',
              color: '#7c5fff',
              border: '1px solid #b8a4ff55',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? <GeneratingPlaceholder variant="inline" /> : '↻ Regen'}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px]" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
