import React from 'react'
import { Easing, interpolate, spring } from 'remotion'

// ═══════════════════════════════════════════════════════════
// Professional Easing Presets
// ═══════════════════════════════════════════════════════════

/** Text slam-in: fast arrival, gentle settle. Use for hook text. */
export const SLAM = Easing.out(Easing.exp)

/** Apple's premium ease curve. Use for product reveals, hero moments. */
export const PREMIUM = Easing.bezier(0.16, 1, 0.3, 1)

/** Playful overshoot then settle. @starface energy. Use for badges, pops. */
export const POP = Easing.out(Easing.back(1.7))

/** Organic drift. Use for background movements, breathing animations. */
export const BREATHE = Easing.inOut(Easing.sin)

// ═══════════════════════════════════════════════════════════
// Phase System
// ═══════════════════════════════════════════════════════════

export const FPS = 30
export const TOTAL_FRAMES = 360 // 12 seconds

export interface PhaseConfig {
  hookEnd: number       // ~60 frames (2s)
  revealEnd: number     // ~150 frames (5s)
  storyEnd: number      // ~280 frames (9.3s)
  // close runs storyEnd → TOTAL_FRAMES
}

const OVERLAP = 10 // frames of cross-fade between phases

/**
 * Returns which phase the current frame is in, plus local frame,
 * progress (0-1), and exit/enter opacity for cross-fade transitions.
 */
export function getPhase(frame: number, config: PhaseConfig) {
  const { hookEnd, revealEnd, storyEnd } = config

  // Determine phase with overlap awareness
  if (frame < hookEnd) {
    const exitFade = frame >= hookEnd - OVERLAP
      ? interpolate(frame, [hookEnd - OVERLAP, hookEnd], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1
    return { name: 'hook' as const, localFrame: frame, progress: frame / hookEnd, opacity: exitFade }
  }

  if (frame < revealEnd) {
    const localFrame = frame - hookEnd + OVERLAP // overlap means we start a few frames early
    const enterFade = frame < hookEnd + OVERLAP
      ? interpolate(frame, [hookEnd - OVERLAP, hookEnd + OVERLAP], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1
    const exitFade = frame >= revealEnd - OVERLAP
      ? interpolate(frame, [revealEnd - OVERLAP, revealEnd], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1
    return { name: 'reveal' as const, localFrame: frame - hookEnd, progress: (frame - hookEnd) / (revealEnd - hookEnd), opacity: Math.min(enterFade, exitFade) }
  }

  if (frame < storyEnd) {
    const enterFade = frame < revealEnd + OVERLAP
      ? interpolate(frame, [revealEnd - OVERLAP, revealEnd + OVERLAP], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1
    const exitFade = frame >= storyEnd - OVERLAP
      ? interpolate(frame, [storyEnd - OVERLAP, storyEnd], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1
    return { name: 'story' as const, localFrame: frame - revealEnd, progress: (frame - revealEnd) / (storyEnd - revealEnd), opacity: Math.min(enterFade, exitFade) }
  }

  const enterFade = frame < storyEnd + OVERLAP
    ? interpolate(frame, [storyEnd - OVERLAP, storyEnd + OVERLAP], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1
  return { name: 'close' as const, localFrame: frame - storyEnd, progress: (frame - storyEnd) / (TOTAL_FRAMES - storyEnd), opacity: enterFade }
}

// ═══════════════════════════════════════════════════════════
// MaskReveal — Premium text entrance (Apple/Nike style)
// ═══════════════════════════════════════════════════════════

/**
 * Text slides up from behind an overflow:hidden container.
 * The single biggest quality upgrade for text animation.
 */
export function MaskReveal({ children, frame, delay = 0, duration = 12, direction = 'up', style }: {
  children: React.ReactNode
  frame: number
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  style?: React.CSSProperties
}) {
  const progress = interpolate(
    Math.max(0, frame - delay),
    [0, duration],
    [0, 1],
    { extrapolateRight: 'clamp', easing: PREMIUM }
  )

  const translate = {
    up: `translateY(${(1 - progress) * 100}%)`,
    down: `translateY(${(progress - 1) * 100}%)`,
    left: `translateX(${(1 - progress) * 100}%)`,
    right: `translateX(${(progress - 1) * 100}%)`,
  }

  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <div style={{
        transform: translate[direction],
        opacity: interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SlowDrift — Subtle camera breathing for entire composition
// ═══════════════════════════════════════════════════════════

/**
 * Wraps content in subtle scale + sway. Makes static layouts feel alive.
 */
export function SlowDrift({ children, frame, intensity = 1 }: {
  children: React.ReactNode
  frame: number
  intensity?: number
}) {
  const scale = 1 + interpolate(frame, [0, TOTAL_FRAMES], [0, 0.02 * intensity], {
    easing: BREATHE, extrapolateRight: 'clamp',
  })
  const swayX = Math.sin(frame * 0.015) * 4 * intensity
  const swayY = Math.cos(frame * 0.012) * 3 * intensity

  return (
    <div style={{
      position: 'absolute', inset: -20, // extra padding to avoid edge reveal during sway
      transform: `scale(${scale}) translate(${swayX}px, ${swayY}px)`,
    }}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ScaleSnap — Anticipation + overshoot product entrance
// ═══════════════════════════════════════════════════════════

/**
 * Professional scale animation: anticipation → overshoot → settle.
 * Returns a scale value to use in transform.
 */
export function scaleSnap(frame: number, delay = 0, target = 1): number {
  const f = Math.max(0, frame - delay)
  if (f <= 0) return 0

  // Anticipation (shrink slightly), then spring overshoot, then settle
  const raw = interpolate(f, [0, 5, 12, 20], [0, target * 0.92, target * 1.06, target], {
    extrapolateRight: 'clamp',
    easing: PREMIUM,
  })
  return raw
}

// ═══════════════════════════════════════════════════════════
// Brand Close — Reusable animated outro
// ═══════════════════════════════════════════════════════════

import { headingFont, accentFont } from './shared'

export function BrandClose({ frame, accentColor, style }: {
  frame: number
  accentColor: string
  style?: React.CSSProperties
}) {
  const logoScale = interpolate(frame, [0, 5, 14, 22], [0, 0.9, 1.06, 1], {
    extrapolateRight: 'clamp', easing: PREMIUM,
  })
  const logoOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const tagOpacity = interpolate(frame, [12, 24], [0, 0.6], { extrapolateRight: 'clamp', easing: SLAM })
  const ctaOpacity = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: 'clamp', easing: SLAM })
  const ctaScale = interpolate(frame, [20, 28, 35], [0.8, 1.05, 1], { extrapolateRight: 'clamp', easing: POP })
  const glowIntensity = interpolate(frame, [10, 40, 60], [0, 50, 30], { extrapolateRight: 'clamp', easing: BREATHE })

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      ...style,
    }}>
      <div style={{
        fontFamily: headingFont, fontSize: 58, fontWeight: 700,
        color: '#fff', letterSpacing: '0.06em',
        transform: `scale(${logoScale})`,
        opacity: logoOpacity,
        textShadow: `0 0 ${glowIntensity}px ${accentColor}60, 0 0 ${glowIntensity * 2}px ${accentColor}25`,
      }}>
        SPACE APE
      </div>
      <div style={{
        fontFamily: accentFont, fontSize: 15, fontWeight: 600,
        color: '#ffffff50', textTransform: 'uppercase', letterSpacing: '0.12em',
        opacity: tagOpacity,
      }}>
        Ultra Premium • Live Resin
      </div>
      <div style={{
        border: `2px solid ${accentColor}`,
        color: accentColor,
        fontFamily: headingFont, fontSize: 21, fontWeight: 700,
        padding: '14px 44px', borderRadius: 40, textTransform: 'uppercase',
        boxShadow: `0 0 ${glowIntensity * 0.8}px ${accentColor}40`,
        opacity: ctaOpacity,
        transform: `scale(${ctaScale})`,
        marginTop: 6,
      }}>
        Follow @SpaceApe
      </div>
    </div>
  )
}
