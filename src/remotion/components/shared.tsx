import { Img, staticFile, spring } from 'remotion'
import { loadFont } from '@remotion/google-fonts/Oswald'
import { loadFont as loadBodyFont } from '@remotion/google-fonts/Inter'
import { loadFont as loadAccentFont } from '@remotion/google-fonts/SpaceGrotesk'
import { loadFont as loadHandFont } from '@remotion/google-fonts/PermanentMarker'

export const { fontFamily: headingFont } = loadFont()
export const { fontFamily: bodyFont } = loadBodyFont()
export const { fontFamily: accentFont } = loadAccentFont()
export const { fontFamily: handFont } = loadHandFont()

// ─── Seeded Randomization ───

export function seedFromText(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function seededRange(seed: number, slot: number, min: number, max: number): number {
  const mixed = Math.abs((seed * 2654435761 + slot * 40503) | 0)
  return min + (mixed % 1000) / 1000 * (max - min)
}

export function seededInt(seed: number, slot: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, slot, min, max + 0.999))
}

export function seededPick<T>(seed: number, slot: number, arr: T[]): T {
  return arr[Math.abs((seed * 2654435761 + slot * 40503) | 0) % arr.length]
}

// ─── Legacy decorative components (kept for compatibility) ───

export function Star({ x, y, size, color, opacity = 0.3 }: { x: number; y: number; size: number; color: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}
      style={{ position: 'absolute', left: x, top: y, opacity }}>
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
    </svg>
  )
}

export function Ring({ x, y, size, color, thickness = 3 }: { x: number; y: number; size: number; color: string; thickness?: number }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%', border: `${thickness}px solid ${color}`,
    }} />
  )
}

export function ConfettiDot({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%', background: color,
    }} />
  )
}

export function ProductImg({ src, style }: { src: string; style: React.CSSProperties }) {
  return <Img src={staticFile(`products/${src}`)} style={{ objectFit: 'contain', ...style }} />
}

// ─── @starface Decorative Components ───

export function StickerStar({ x, y, size, color, strokeWidth = 3, fill = 'none', rotation = 0 }: {
  x: number; y: number; size: number; color: string
  strokeWidth?: number; fill?: string; rotation?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotation}deg)` }}>
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z"
        fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}

const BLOB_PATHS = [
  'M45,-51C58,-41,68,-25,71,-9C73,8,69,26,59,39C49,52,33,59,15,63C-2,66,-20,67,-35,60C-50,53,-62,38,-67,22C-73,6,-72,-13,-63,-27C-55,-42,-40,-52,-24,-58C-9,-63,7,-64,21,-59C35,-55,48,-57,45,-51Z',
  'M42,-48C55,-38,64,-22,67,-5C70,12,67,31,56,43C45,56,27,62,9,63C-9,64,-27,60,-41,50C-55,40,-64,24,-66,7C-68,-10,-63,-28,-52,-41C-41,-54,-24,-62,-7,-62C10,-63,29,-58,42,-48Z',
  'M39,-50C52,-39,63,-24,66,-7C69,10,65,29,54,42C43,55,25,62,7,64C-11,65,-29,61,-42,50C-55,39,-63,22,-64,5C-66,-12,-61,-29,-50,-42C-39,-55,-22,-63,-5,-63C12,-63,26,-61,39,-50Z',
]

export function Blob({ x, y, size, color, variant = 0 }: {
  x: number; y: number; size: number; color: string; variant?: number
}) {
  return (
    <svg viewBox="-80 -80 160 160" width={size} height={size}
      style={{ position: 'absolute', left: x, top: y }}>
      <path d={BLOB_PATHS[variant % BLOB_PATHS.length]} fill={color} />
    </svg>
  )
}

export function Daisy({ x, y, size, petalColor, centerColor, rotation = 0 }: {
  x: number; y: number; size: number; petalColor: string; centerColor: string; rotation?: number
}) {
  const petals = 6
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotation}deg)` }}>
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse key={i} cx="50" cy="20" rx="14" ry="22" fill={petalColor}
          transform={`rotate(${i * (360 / petals)} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="14" fill={centerColor} />
    </svg>
  )
}

export function Heart({ x, y, size, color, fill = 'none', strokeWidth = 3, rotation = 0 }: {
  x: number; y: number; size: number; color: string
  fill?: string; strokeWidth?: number; rotation?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotation}deg)` }}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}

export function Sparkle({ x, y, size, color, rotation = 0 }: {
  x: number; y: number; size: number; color: string; rotation?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotation}deg)` }}>
      <path d="M12 0L13.5 9L22 12L13.5 15L12 24L10.5 15L2 12L10.5 9Z"
        fill={color} />
    </svg>
  )
}

export function WavyDivider({ y, width, color, amplitude = 20, strokeWidth = 3 }: {
  y: number; width: number; color: string; amplitude?: number; strokeWidth?: number
}) {
  const segments = 8
  const segW = width / segments
  let d = `M0,${amplitude}`
  for (let i = 0; i < segments; i++) {
    const x1 = i * segW + segW / 2
    const y1 = i % 2 === 0 ? 0 : amplitude * 2
    const x2 = (i + 1) * segW
    const y2 = amplitude
    d += ` Q${x1},${y1} ${x2},${y2}`
  }
  return (
    <svg width={width} height={amplitude * 2 + strokeWidth}
      style={{ position: 'absolute', left: 0, top: y }}>
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function StickerFrame({ children, borderColor = '#fff', borderWidth = 6, rotation = 0, borderRadius = 24, shadow = true }: {
  children: React.ReactNode; borderColor?: string; borderWidth?: number
  rotation?: number; borderRadius?: number; shadow?: boolean
}) {
  return (
    <div style={{
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius,
      transform: `rotate(${rotation}deg)`,
      background: borderColor,
      padding: borderWidth,
      boxShadow: shadow ? '5px 7px 0px rgba(0,0,0,0.15)' : 'none',
      display: 'inline-flex',
    }}>
      {children}
    </div>
  )
}

export function SpeechBubble({ x, y, width, height, color, borderColor, borderWidth = 4 }: {
  x: number; y: number; width: number; height: number
  color: string; borderColor?: string; borderWidth?: number
}) {
  const r = Math.min(height * 0.35, 30)
  return (
    <div style={{ position: 'absolute', left: x, top: y }}>
      <div style={{
        width, height, background: color,
        borderRadius: r,
        border: borderColor ? `${borderWidth}px solid ${borderColor}` : 'none',
      }} />
      {/* Tail */}
      <svg width={24} height={16} style={{ position: 'absolute', bottom: -14, left: 30 }}>
        <polygon points="0,0 24,0 8,16" fill={color}
          stroke={borderColor || 'none'} strokeWidth={borderColor ? borderWidth : 0} />
      </svg>
    </div>
  )
}

// ─── Background Patterns ───

export function polkaDotBg(dotColor: string, bgColor: string, dotSize = 10, spacing = 36): React.CSSProperties {
  return {
    backgroundColor: bgColor,
    backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
    backgroundSize: `${spacing}px ${spacing}px`,
  }
}

export function checkerboardBg(color1: string, color2: string, cellSize = 40): React.CSSProperties {
  return {
    background: `repeating-conic-gradient(${color1} 0% 25%, ${color2} 0% 50%) 0 0 / ${cellSize}px ${cellSize}px`,
  }
}

export function stripesBg(color1: string, color2: string, angle = 45, width = 20): React.CSSProperties {
  return {
    background: `repeating-linear-gradient(${angle}deg, ${color1}, ${color1} ${width}px, ${color2} ${width}px, ${color2} ${width * 2}px)`,
  }
}

export function diagonalHatchBg(color: string, bgColor: string, width = 8, gap = 24): React.CSSProperties {
  return {
    backgroundColor: bgColor,
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent ${gap}px, ${color} ${gap}px, ${color} ${gap + width}px)`,
  }
}

export function concentricCirclesBg(color: string, bgColor: string, size = 80): React.CSSProperties {
  return {
    backgroundColor: bgColor,
    backgroundImage: `radial-gradient(circle, transparent ${size * 0.4}px, ${color} ${size * 0.4}px, ${color} ${size * 0.45}px, transparent ${size * 0.45}px)`,
    backgroundSize: `${size}px ${size}px`,
  }
}

// ─── Seeded Pattern Wrappers ───

export function seededStripesBg(seed: number, color1: string, color2: string): React.CSSProperties {
  const angle = 30 + (seed % 120)
  const width = 18 + (seed % 20)
  return stripesBg(color1, color2, angle, width)
}

export function seededPolkaDotBg(seed: number, dotColor: string, bgColor: string): React.CSSProperties {
  const dotSize = 5 + (seed % 8)
  const spacing = 22 + (seed % 20)
  return polkaDotBg(dotColor, bgColor, dotSize, spacing)
}

// ─── Typography Styles ───

export function outlinedTextStyle(fillColor: string, strokeColor: string, strokeWidth = 3): React.CSSProperties {
  return {
    color: fillColor,
    WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
    paintOrder: 'stroke fill',
  } as React.CSSProperties
}

export function boldShadowStyle(textColor: string, shadowColor: string, offset = 4): React.CSSProperties {
  return {
    color: textColor,
    textShadow: `${offset}px ${offset}px 0px ${shadowColor}`,
  }
}

// ─── Animation Helpers ───

export function bouncySpring(frame: number, fps: number, delay = 0) {
  return spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 7, stiffness: 180, overshootClamping: false } })
}

export function popIn(frame: number, fps: number, delay = 0) {
  return spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 6, stiffness: 200, overshootClamping: false } })
}

export function wiggle(frame: number, amplitude = 3, frequency = 0.1) {
  return Math.sin(frame * frequency) * amplitude
}

// ─── Color Utilities ───

function hexToHsl(hex: string): [number, number, number] {
  const h6 = hex.replace('#', '')
  const r = parseInt(h6.substring(0, 2), 16) / 255
  const g = parseInt(h6.substring(2, 4), 16) / 255
  const b = parseInt(h6.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hue = 0, sat = 0
  const lit = (max + min) / 2
  if (max !== min) {
    const d = max - min
    sat = lit > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) hue = ((b - r) / d + 2) / 6
    else hue = ((r - g) / d + 4) / 6
  }
  return [hue * 360, sat * 100, lit * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  const s1 = s / 100, l1 = l / 100
  const c = (1 - Math.abs(2 * l1 - 1)) * s1
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l1 - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function brightBg(hexColor: string): string {
  const [h, s] = hexToHsl(hexColor)
  return hslToHex(h, Math.min(s, 70), 88)
}

export function saturateColor(hexColor: string, factor = 1.3): string {
  const [h, s, l] = hexToHsl(hexColor)
  return hslToHex(h, Math.min(s * factor, 100), l)
}

// ─── Shadow & Text Utilities ───

const SHADOW_PRESETS = {
  soft: (c: string) => `drop-shadow(0 10px 25px ${c}20) drop-shadow(0 4px 12px rgba(0,0,0,0.15))`,
  medium: (c: string) => `drop-shadow(0 20px 40px ${c}35) drop-shadow(0 8px 20px rgba(0,0,0,0.25))`,
  dramatic: (c: string) => `drop-shadow(0 30px 60px ${c}50) drop-shadow(0 12px 30px rgba(0,0,0,0.35))`,
} as const

export function themeShadow(themeColor: string, intensity: 'soft' | 'medium' | 'dramatic' = 'medium'): string {
  return SHADOW_PRESETS[intensity](themeColor)
}

export function clampText(maxLines: number): React.CSSProperties {
  return {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
  } as React.CSSProperties
}

// ─── Color Utilities (extended) ───

export function lightenColor(hexColor: string, amount: number): string {
  const [h, s, l] = hexToHsl(hexColor)
  return hslToHex(h, s, Math.min(l + amount, 100))
}

export function darkenColor(hexColor: string, amount: number): string {
  const [h, s, l] = hexToHsl(hexColor)
  return hslToHex(h, s, Math.max(l - amount, 0))
}

// ─── Photo Treatment Components ───

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`

export function GrainOverlay({ opacity = 0.04, frame }: { opacity?: number; frame?: number }) {
  const offset = frame !== undefined ? (frame * 37) % 200 : 0
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none' as const, zIndex: 10,
      backgroundImage: GRAIN_SVG,
      backgroundRepeat: 'repeat',
      backgroundSize: '200px 200px',
      backgroundPosition: `${offset}px ${offset}px`,
      opacity,
      mixBlendMode: 'overlay' as const,
    }} />
  )
}

export function VignetteOverlay({ intensity = 0.25, color = '#000000' }: { intensity?: number; color?: string }) {
  const alpha = Math.round(intensity * 255).toString(16).padStart(2, '0')
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none' as const, zIndex: 10,
      background: `radial-gradient(ellipse at center, transparent 45%, ${color}${alpha} 100%)`,
    }} />
  )
}

export function WarmTint({ opacity = 0.06, tint = 'rgba(255,200,150,1)' }: { opacity?: number; tint?: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none' as const, zIndex: 10,
      background: tint,
      opacity,
    }} />
  )
}

export function GlossHighlight({ angle = 135, opacity = 0.08, coverage = 40 }: { angle?: number; opacity?: number; coverage?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none' as const, zIndex: 9,
      background: `linear-gradient(${angle}deg, rgba(255,255,255,${opacity}) 0%, transparent ${coverage}%)`,
    }} />
  )
}

const PHOTO_PRESETS = {
  subtle:  { grain: 0.03, vignette: 0.20, warmth: 0.04 },
  medium:  { grain: 0.05, vignette: 0.30, warmth: 0.07 },
  strong:  { grain: 0.07, vignette: 0.40, warmth: 0.10 },
} as const

export function PhotoStack({ children, intensity = 'subtle' }: { children: React.ReactNode; intensity?: 'subtle' | 'medium' | 'strong' }) {
  const p = PHOTO_PRESETS[intensity]
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      <GrainOverlay opacity={p.grain} />
      <VignetteOverlay intensity={p.vignette} />
      <WarmTint opacity={p.warmth} />
    </div>
  )
}

// ─── Visual Mode System ───

export type VisualMode = 'default' | 'education' | 'reveal' | 'spotlight' | 'process' | 'hottake' | 'comparison'

const subcategoryModeMap: Record<string, VisualMode> = {
  'Strain Education': 'education',
  'Hardware Explainer': 'education',
  'Live Resin Process': 'education',
  'Dosing Guide': 'education',
  'New Drop Reveal': 'reveal',
  'Flavor Highlight': 'reveal',
  'Flavor Breakdown': 'reveal',
  'Retail Partner Spotlight': 'spotlight',
  'Media Attention': 'spotlight',
  'Founder Story': 'process',
  'Quality Process': 'process',
  'How It\'s Made': 'process',
  'Hot Take': 'hottake',
  'Internet Culture Reference': 'hottake',
  'Would You Rather': 'comparison',
  'First Timer Reaction': 'spotlight',
}

export function getVisualMode(subcategory: string): VisualMode {
  return subcategoryModeMap[subcategory] || 'default'
}

// ─── Subcategory Visual Overlay Components ───

export function BadgeOverlay({ label, color, bgColor, x, y, rotation = -12 }: {
  label: string; color: string; bgColor: string; x?: number; y?: number; rotation?: number
}) {
  return (
    <div style={{
      position: 'absolute', top: y ?? 40, right: x ?? 40, zIndex: 20,
      background: bgColor, color, border: `3px solid ${color}`,
      fontFamily: headingFont, fontSize: 16, fontWeight: 700,
      padding: '8px 20px', borderRadius: 8,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      transform: `rotate(${rotation}deg)`,
      boxShadow: '4px 5px 0px rgba(0,0,0,0.15)',
    }}>
      {label}
    </div>
  )
}

export function StepIndicator({ step, total, color, x, y }: {
  step: number; total: number; color: string; x?: number; y?: number
}) {
  return (
    <div style={{
      position: 'absolute', top: y ?? 50, left: x ?? 50, zIndex: 15,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: headingFont, fontSize: 18, fontWeight: 700,
        border: '3px solid #fff',
        boxShadow: '3px 3px 0px rgba(0,0,0,0.12)',
      }}>
        {step}
      </div>
      <div style={{
        fontFamily: bodyFont, fontSize: 13, fontWeight: 600,
        color: '#ffffff90', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        of {total}
      </div>
    </div>
  )
}

export function QuoteFrame({ x, y, size, color }: {
  x: number; y: number; size: number; color: string
}) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: headingFont, fontSize: size, fontWeight: 700,
      color, lineHeight: 0.6, opacity: 0.3,
    }}>
      &ldquo;
    </div>
  )
}

export function ShelfLines({ y, width, color, count = 3 }: {
  y: number; width: number; color: string; count?: number
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, width,
          top: y + i * 80, height: 3,
          background: color, opacity: 0.2,
        }} />
      ))}
    </>
  )
}

export function ComparisonDivider({ height, color }: {
  width?: number; height: number; color: string
}) {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: 0,
      width: 6, height, background: color,
      transform: 'translateX(-50%)',
      zIndex: 10,
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: color, color: '#fff',
        fontFamily: headingFont, fontSize: 20, fontWeight: 700,
        width: 48, height: 48, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '3px solid #fff',
        boxShadow: '3px 4px 0px rgba(0,0,0,0.15)',
      }}>
        VS
      </div>
    </div>
  )
}

// Badge labels by visual mode
export function getBadgeLabel(mode: VisualMode): string | null {
  switch (mode) {
    case 'education': return 'LEARN'
    case 'reveal': return 'NEW DROP'
    case 'spotlight': return 'SPOTLIGHT'
    case 'process': return 'BEHIND THE SCENES'
    case 'hottake': return 'HOT TAKE'
    case 'comparison': return 'YOU DECIDE'
    default: return null
  }
}
