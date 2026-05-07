import type { getFlavorTheme } from '../../remotion/flavorThemes'
import GeneratingPlaceholder from '../ui/GeneratingPlaceholder'

export function SlidePlaceholder({
  theme,
  error,
  slideNumber,
  slideTotal,
  role,
  status,
}: {
  theme: ReturnType<typeof getFlavorTheme>
  error: string | null
  slideNumber: number
  slideTotal: number
  role: string
  status: 'generating' | 'failed' | 'unavailable'
}) {
  const statusLabel =
    status === 'failed' ? 'Slide failed' : status === 'unavailable' ? 'Slide unavailable' : null
  // While generating: show the futuristic loader as the backdrop with the
  // slide-number badge overlaid. On failure/unavailable: keep the existing
  // typographic placeholder so the error context stays readable.
  if (status === 'generating') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GeneratingPlaceholder variant="tile" />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.45)',
            padding: '4px 8px',
            borderRadius: 6,
            backdropFilter: 'blur(4px)',
          }}
        >
          {slideNumber} / {slideTotal}
          {role ? <span style={{ opacity: 0.7 }}> · {role.replace(/-/g, ' ')}</span> : null}
        </div>
      </div>
    )
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
        color: theme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 24,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: theme.primaryColor,
          opacity: 0.45,
        }}
      >
        {slideNumber}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', opacity: 0.7 }}>
        OF {slideTotal}
      </div>
      {role ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.85,
            marginTop: 4,
            color: theme.accentColor,
          }}
        >
          {role.replace(/-/g, ' ')}
        </div>
      ) : null}
      {statusLabel ? (
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, marginTop: 2 }}>{statusLabel}</div>
      ) : null}
      {error ? (
        <div style={{ fontSize: 10, opacity: 0.55, maxWidth: 260, marginTop: 4 }}>{error}</div>
      ) : null}
    </div>
  )
}
