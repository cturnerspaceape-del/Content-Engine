import React from 'react'
import { AbsoluteFill, spring, interpolate } from 'remotion'

// ═══════════════════════════════════════════════════════════
// Style Helpers — return React.CSSProperties
// ═══════════════════════════════════════════════════════════

/** Gradient text fill via background-clip: text */
export function gradientTextStyle(colors: string[], angle = 135): React.CSSProperties {
  return {
    background: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties
}

/** Subtle 3D card perspective tilt */
export function perspectiveTilt(rotateX = 2, rotateY = -3, perspective = 1200): React.CSSProperties {
  return {
    transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    transformStyle: 'preserve-3d' as const,
  }
}

/** Expanding circle clip-path reveal (progress 0→1) */
export function clipCircleReveal(progress: number, cx = 50, cy = 50): React.CSSProperties {
  return {
    clipPath: `circle(${progress * 75}% at ${cx}% ${cy}%)`,
  }
}

/** Diagonal wipe clip-path transition (progress 0→1) */
export function clipDiagonalWipe(progress: number, angle = -30): React.CSSProperties {
  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  // Sweep a line across the frame based on progress
  const offset = progress * 200 - 50 // -50 to 150 range
  if (progress >= 1) return {}
  if (progress <= 0) return { clipPath: 'polygon(0 0, 0 0, 0 0)' }
  // Create a polygon that covers the revealed portion
  const p = offset
  return {
    clipPath: `polygon(
      0 0,
      ${Math.min(100, p + 100 * Math.abs(dx))}% 0,
      ${Math.min(100, p + 50)}% 100%,
      0 100%
    )`.replace(/\s+/g, ' '),
  }
}

// ═══════════════════════════════════════════════════════════
// Overlay Components — return JSX
// ═══════════════════════════════════════════════════════════

/** Frosted glass panel with backdrop blur */
export function GlassPanel({ children, blur = 20, opacity = 0.15, borderColor = '#ffffff30', borderRadius = 24, style }: {
  children: React.ReactNode
  blur?: number
  opacity?: number
  borderColor?: string
  borderRadius?: number
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      background: `rgba(255,255,255,${opacity})`,
      border: `1px solid ${borderColor}`,
      borderRadius,
      ...style,
    } as React.CSSProperties}>
      {children}
    </div>
  )
}

/** Frame-driven animated gradient background */
export function AnimatedGradient({ frame, colors, speed = 0.5, type = 'linear' }: {
  frame: number
  colors: string[]
  speed?: number
  type?: 'linear' | 'mesh'
}) {
  if (type === 'mesh') {
    // Multi-point radial gradients that drift
    const x1 = 30 + Math.sin(frame * speed * 0.02) * 20
    const y1 = 30 + Math.cos(frame * speed * 0.015) * 20
    const x2 = 70 + Math.sin(frame * speed * 0.025 + 2) * 20
    const y2 = 70 + Math.cos(frame * speed * 0.02 + 1) * 20
    const x3 = 50 + Math.sin(frame * speed * 0.018 + 4) * 25
    const y3 = 50 + Math.cos(frame * speed * 0.022 + 3) * 25
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          `radial-gradient(ellipse at ${x1}% ${y1}%, ${colors[0]}CC 0%, transparent 50%)`,
          `radial-gradient(ellipse at ${x2}% ${y2}%, ${colors[1] || colors[0]}CC 0%, transparent 50%)`,
          `radial-gradient(ellipse at ${x3}% ${y3}%, ${colors[2] || colors[1] || colors[0]}88 0%, transparent 60%)`,
          `linear-gradient(180deg, ${colors[0]}40 0%, ${colors[colors.length - 1]}60 100%)`,
        ].join(', '),
      }} />
    )
  }

  // Linear: rotating angle
  const angle = frame * speed
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
    }} />
  )
}

/** Chromatic aberration — RGB channel offset */
export function ChromaShift({ children, offset = 3, frame, animated = false, style }: {
  children: React.ReactNode
  offset?: number
  frame?: number
  animated?: boolean
  style?: React.CSSProperties
}) {
  const o = animated && frame !== undefined
    ? Math.sin(frame * 0.05) * offset
    : offset
  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Red channel */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${-o}px, 0)`,
        mixBlendMode: 'screen' as const,
        opacity: 0.7,
        filter: 'url(#chroma-r)',
      }}>
        {children}
      </div>
      {/* Blue channel */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${o}px, 0)`,
        mixBlendMode: 'screen' as const,
        opacity: 0.7,
        filter: 'url(#chroma-b)',
      }}>
        {children}
      </div>
      {/* Main (green-ish center) */}
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      {/* SVG filters for channel isolation */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="chroma-r">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="chroma-b">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

/** Per-character spring animation with stagger */
export function CharacterReveal({ text, frame, fps, delay = 0, stagger = 2, style }: {
  text: string
  frame: number
  fps: number
  delay?: number
  stagger?: number
  style?: React.CSSProperties
}) {
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}>
      {text.split('').map((char, i) => {
        const charDelay = delay + i * stagger
        const s = spring({ frame: Math.max(0, frame - charDelay), fps, config: { damping: 8, stiffness: 200 } })
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: s,
            transform: `translateY(${(1 - s) * 30}px)`,
            whiteSpace: char === ' ' ? 'pre' : undefined,
          }}>
            {char}
          </span>
        )
      })}
    </span>
  )
}

/** Moving light highlight sweep across surfaces */
export function ShimmerSweep({ frame, color = 'rgba(255,255,255,0.15)', width = 200, angle = 25, speed = 2 }: {
  frame: number
  color?: string
  width?: number
  angle?: number
  speed?: number
}) {
  const position = (frame * speed) % 300 - 100 // sweeps -100 to 200
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none' as const, zIndex: 15,
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%', bottom: '-50%',
        width,
        left: `${position}%`,
        background: `linear-gradient(${angle}deg, transparent 0%, ${color} 50%, transparent 100%)`,
        transform: `skewX(${angle}deg)`,
      }} />
    </div>
  )
}

/** CRT/retro scan line overlay */
export function ScanLines({ spacing = 4, opacity = 0.08, color = '#000', thickness = 1 }: {
  spacing?: number
  opacity?: number
  color?: string
  thickness?: number
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none' as const, zIndex: 12,
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${spacing - thickness}px, ${color} ${spacing - thickness}px, ${color} ${spacing}px)`,
      opacity,
    }} />
  )
}

/** Animated radial gradient light leak overlay */
export function LightLeak({ frame, color = '#ffa94d', position = 'top-right', intensity = 0.15 }: {
  frame: number
  color?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'center'
  intensity?: number
}) {
  const posMap = {
    'top-right': { bx: 80, by: 15 },
    'top-left': { bx: 20, by: 15 },
    'bottom-right': { bx: 80, by: 85 },
    'center': { bx: 50, by: 50 },
  }
  const { bx, by } = posMap[position]
  const drift = Math.sin(frame * 0.03) * 5
  const pulse = 0.85 + Math.sin(frame * 0.04) * 0.15

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none' as const, zIndex: 11,
      background: `radial-gradient(ellipse at ${bx + drift}% ${by + drift * 0.5}%, ${color} 0%, transparent 60%)`,
      opacity: intensity * pulse,
      mixBlendMode: 'screen' as const,
    }} />
  )
}

/** Print-style halftone dot pattern overlay */
export function HalftoneOverlay({ dotSize = 2, spacing = 6, color = '#000', opacity = 0.12 }: {
  dotSize?: number
  spacing?: number
  color?: string
  opacity?: number
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none' as const, zIndex: 11,
      backgroundImage: `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize}px)`,
      backgroundSize: `${spacing}px ${spacing}px`,
      opacity,
      mixBlendMode: 'multiply' as const,
    }} />
  )
}

// ═══════════════════════════════════════════════════════════
// SVG Filter — Duotone Image Treatment
// ═══════════════════════════════════════════════════════════

function hexToRgbNorm(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ]
}

/** Inline SVG duotone filter — place in component tree, apply via duotoneStyle(id) */
export function DuotoneFilter({ id, darkColor, lightColor }: {
  id: string
  darkColor: string
  lightColor: string
}) {
  const [dr, dg, db] = hexToRgbNorm(darkColor)
  const [lr, lg, lb] = hexToRgbNorm(lightColor)
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id={id}>
          {/* Desaturate to grayscale */}
          <feColorMatrix type="saturate" values="0" />
          {/* Map grayscale to duotone */}
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${dr} ${lr}`} />
            <feFuncG type="table" tableValues={`${dg} ${lg}`} />
            <feFuncB type="table" tableValues={`${db} ${lb}`} />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}

/** Style to apply a DuotoneFilter by id */
export function duotoneStyle(id: string): React.CSSProperties {
  return { filter: `url(#${id})` }
}
