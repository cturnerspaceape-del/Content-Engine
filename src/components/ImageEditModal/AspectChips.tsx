import type { ImageSize } from './types'

interface AspectChipsProps {
  value: ImageSize
  onChange: (next: ImageSize) => void
  disabled?: boolean
}

interface ChipDef {
  value: ImageSize
  label: string
  glyph: string
  hint: string
}

const CHIPS: ReadonlyArray<ChipDef> = [
  { value: '1024x1024', label: 'Square', glyph: '⏹', hint: '1:1 — feed posts' },
  { value: '1024x1536', label: 'Portrait', glyph: '▯', hint: '2:3 — Stories / Reels covers' },
  { value: '1536x1024', label: 'Landscape', glyph: '▭', hint: '3:2 — wide hero' },
]

export default function AspectChips({ value, onChange, disabled }: AspectChipsProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 8,
        }}
      >
        Aspect
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CHIPS.map((c) => {
          const active = c.value === value
          return (
            <button
              key={c.value}
              onClick={() => !disabled && onChange(c.value)}
              disabled={disabled}
              title={c.hint}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                border: active ? '1px solid #8b5cf6aa' : '1px solid var(--border)',
                background: active
                  ? 'linear-gradient(135deg, rgba(29,155,240,0.25), rgba(139,92,246,0.25))'
                  : disabled
                    ? 'rgba(148,163,184,0.04)'
                    : 'rgba(148,163,184,0.08)',
                color: active ? '#fff' : 'var(--text)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{c.glyph}</span>
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
