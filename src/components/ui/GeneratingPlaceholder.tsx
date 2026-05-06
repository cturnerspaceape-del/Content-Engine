// Futuristic loading placeholder. Replaces "Generating…" text in the labs.
// Two variants — `tile` fills slide/image preview squares, `inline` slots
// into button-height contexts. No literal "loading" copy; the user infers
// activity from the animation.
//
// Visual: glassy panel + slow color-shifting mesh gradient + a sweeping
// chromatic light bar. CSS-only (no Remotion); driven by keyframes so it
// runs whether or not the surrounding tree mounts a Player.

import type { CSSProperties } from 'react'

interface GeneratingPlaceholderProps {
  variant?: 'tile' | 'inline'
  // Optional caption rendered subtly below the animation. Defaults to nothing
  // — the animation itself is the message.
  hint?: string
}

const KEYFRAMES = `
@keyframes sl-mesh-shift {
  0%   { background-position: 0% 50%, 100% 50%, 50% 0%; }
  50%  { background-position: 100% 50%, 0% 50%, 50% 100%; }
  100% { background-position: 0% 50%, 100% 50%, 50% 0%; }
}
@keyframes sl-sweep {
  0%   { transform: translateX(-110%); opacity: 0; }
  20%  { opacity: 0.85; }
  80%  { opacity: 0.85; }
  100% { transform: translateX(110%); opacity: 0; }
}
@keyframes sl-orbit {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes sl-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.18); opacity: 1; }
}
`

function ensureKeyframesInjected(): void {
  if (typeof document === 'undefined') return
  const id = 'sl-generating-placeholder-keyframes'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = KEYFRAMES
  document.head.appendChild(style)
}

export default function GeneratingPlaceholder({
  variant = 'tile',
  hint,
}: GeneratingPlaceholderProps) {
  ensureKeyframesInjected()

  if (variant === 'inline') {
    return <InlineLoader hint={hint} />
  }
  return <TileLoader hint={hint} />
}

function TileLoader({ hint }: { hint?: string }) {
  const meshStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: [
      'radial-gradient(60% 60% at 30% 40%, rgba(29,155,240,0.45) 0%, rgba(29,155,240,0) 70%)',
      'radial-gradient(55% 55% at 70% 65%, rgba(139,92,246,0.45) 0%, rgba(139,92,246,0) 70%)',
      'radial-gradient(50% 50% at 50% 30%, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0) 70%)',
    ].join(', '),
    backgroundSize: '180% 180%, 180% 180%, 180% 180%',
    animation: 'sl-mesh-shift 6s ease-in-out infinite',
    filter: 'blur(8px)',
  }

  const sweepStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    background:
      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 45%, rgba(120,200,255,0.35) 50%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0) 100%)',
    mixBlendMode: 'screen',
    animation: 'sl-sweep 2.4s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
    pointerEvents: 'none',
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={hint || 'Working'}
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.92) 100%)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={meshStyle} />

      {/* Center sigil — a rotating ring with a pulsing core. Reads as "engine
          spinning up" without any text. */}
      <div
        style={{
          position: 'relative',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(120,200,255,0.45)',
            borderTopColor: 'rgba(255,255,255,0.95)',
            borderRightColor: 'rgba(180,140,255,0.85)',
            animation: 'sl-orbit 1.6s linear infinite',
            boxShadow: '0 0 24px rgba(120,200,255,0.35)',
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, #fff 0%, #b4c8ff 50%, #6c5cff 100%)',
            boxShadow: '0 0 14px rgba(180,200,255,0.85)',
            animation: 'sl-pulse 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <div style={sweepStyle} />

      {/* Subtle scan-line overlay for the sci-fi HUD feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)',
          pointerEvents: 'none',
        }}
      />

      {hint && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {hint}
        </div>
      )}
    </div>
  )
}

function InlineLoader({ hint }: { hint?: string }) {
  return (
    <span
      role="status"
      aria-busy="true"
      aria-label={hint || 'Working'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          position: 'relative',
          width: 14,
          height: 14,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1.5px solid currentColor',
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            opacity: 0.35,
            animation: 'sl-orbit 1.2s linear infinite reverse',
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 2,
            borderRadius: '50%',
            border: '1.5px solid currentColor',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            animation: 'sl-orbit 0.9s linear infinite',
          }}
        />
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'currentColor',
            animation: 'sl-pulse 1.2s ease-in-out infinite',
          }}
        />
      </span>
      {hint && <span>{hint}</span>}
    </span>
  )
}
