import type {
  AdvancedSettings,
  ImageBackground,
  ImageInputFidelity,
  ImageOutputFormat,
  ImageQuality,
} from './types'

interface AdvancedPanelProps {
  open: boolean
  onToggle: () => void
  value: AdvancedSettings
  onChange: (next: AdvancedSettings) => void
  disabled?: boolean
}

interface ChipDef<T extends string> {
  value: T
  label: string
  emoji?: string
  hint?: string
}

const QUALITY: ReadonlyArray<ChipDef<ImageQuality>> = [
  { value: 'auto', label: 'Auto', hint: 'Let the model decide' },
  { value: 'low', label: 'Low', emoji: '⚡', hint: 'Fastest, cheaper' },
  { value: 'medium', label: 'Med', emoji: '🌗', hint: 'Balanced' },
  { value: 'high', label: 'High', emoji: '💎', hint: 'Slowest, sharpest' },
]

const BACKGROUND: ReadonlyArray<ChipDef<ImageBackground>> = [
  { value: 'auto', label: 'Auto' },
  { value: 'opaque', label: 'Opaque', emoji: '🎨' },
  { value: 'transparent', label: 'Sticker', emoji: '🪄', hint: 'Transparent background' },
]

const FIDELITY: ReadonlyArray<ChipDef<ImageInputFidelity>> = [
  { value: 'low', label: 'Creative', emoji: '🎲', hint: 'Looser interpretation' },
  { value: 'high', label: 'Faithful', emoji: '🎯', hint: 'Stick close to source' },
]

const FORMAT: ReadonlyArray<ChipDef<ImageOutputFormat>> = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

function ChipRow<T extends string>({
  options,
  active,
  onPick,
  disabled,
}: {
  options: ReadonlyArray<ChipDef<T>>
  active: T
  onPick: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = o.value === active
        return (
          <button
            key={o.value}
            onClick={() => !disabled && onPick(o.value)}
            disabled={disabled}
            title={o.hint}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              border: on ? '1px solid #8b5cf6aa' : '1px solid var(--border)',
              background: on
                ? 'linear-gradient(135deg, rgba(29,155,240,0.25), rgba(139,92,246,0.25))'
                : disabled
                  ? 'rgba(148,163,184,0.04)'
                  : 'rgba(148,163,184,0.08)',
              color: on ? '#fff' : 'var(--text)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s',
            }}
          >
            {o.emoji && <span style={{ fontSize: 12 }}>{o.emoji}</span>}
            <span>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

export default function AdvancedPanel({
  open,
  onToggle,
  value,
  onChange,
  disabled,
}: AdvancedPanelProps) {
  const update = <K extends keyof AdvancedSettings>(key: K, v: AdvancedSettings[K]) => {
    onChange({ ...value, [key]: v })
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 700,
          background: 'rgba(148,163,184,0.06)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>⚙️</span>
          <span>More controls</span>
        </span>
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(15,23,42,0.25)',
            border: '1px solid var(--border)',
          }}
        >
          <Section label="Quality">
            <ChipRow
              options={QUALITY}
              active={value.quality}
              onPick={(v) => update('quality', v)}
              disabled={disabled}
            />
          </Section>
          <Section label="Background">
            <ChipRow
              options={BACKGROUND}
              active={value.background}
              onPick={(v) => update('background', v)}
              disabled={disabled}
            />
          </Section>
          <Section label="Fidelity">
            <ChipRow
              options={FIDELITY}
              active={value.fidelity}
              onPick={(v) => update('fidelity', v)}
              disabled={disabled}
            />
          </Section>
          <Section label="Output format">
            <ChipRow
              options={FORMAT}
              active={value.outputFormat}
              onPick={(v) => update('outputFormat', v)}
              disabled={disabled}
            />
          </Section>
          {value.outputFormat !== 'png' && (
            <div style={{ marginTop: 4 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 6,
                }}
              >
                <span>Compression</span>
                <span style={{ letterSpacing: 0 }}>{value.outputCompression}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={value.outputCompression}
                disabled={disabled}
                onChange={(e) => update('outputCompression', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
