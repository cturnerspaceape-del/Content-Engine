import type { CSSProperties, MouseEvent } from 'react'

export type IconActionTone = 'edit' | 'reroll' | 'neutral'
export type IconActionSize = 'sm' | 'md' | 'lg'

interface IconActionButtonProps {
  // Leading glyph — typically an emoji like ✏️ or 🎲. Pass an empty string to
  // omit. Kept as its own prop (vs. embedding in label) so sizing/spacing is
  // handled here.
  icon?: string
  // Visible label. Use an empty string for icon-only buttons (sm size, mobile
  // overlays); the button still gets aria-label from `title`.
  label: string
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  // Tooltip + accessible name. Always required so we never ship icon-only
  // buttons that screen readers can't announce.
  title: string
  tone?: IconActionTone
  size?: IconActionSize
  // Stop the event from bubbling to the underlying clickable region (e.g.
  // thumbnail tiles where the wrapper is itself a button).
  stopPropagation?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}

// Color tokens — match the rest of the app:
//   edit    = primary accent (caption + image full-edit modal)
//   reroll  = amber (#fb923c — the existing reroll color in ActionButtons)
//   neutral = subtle / muted (used for tertiary affordances)
function tonePalette(tone: IconActionTone) {
  if (tone === 'edit') {
    return {
      bg: 'rgba(59,130,246,0.14)',
      color: 'var(--accent)',
      border: 'rgba(59,130,246,0.55)',
    }
  }
  if (tone === 'reroll') {
    return {
      bg: 'rgba(251,146,60,0.14)',
      color: '#fb923c',
      border: 'rgba(251,146,60,0.55)',
    }
  }
  return {
    bg: 'var(--panel-2)',
    color: 'var(--text)',
    border: 'var(--border)',
  }
}

function sizing(size: IconActionSize): { padding: string; fontSize: number; gap: number; minHeight: number } {
  if (size === 'sm') {
    return { padding: '4px 8px', fontSize: 10, gap: 4, minHeight: 22 }
  }
  if (size === 'lg') {
    return { padding: '8px 14px', fontSize: 13, gap: 8, minHeight: 32 }
  }
  return { padding: '6px 10px', fontSize: 11, gap: 6, minHeight: 26 }
}

export default function IconActionButton({
  icon,
  label,
  onClick,
  title,
  tone = 'neutral',
  size = 'md',
  stopPropagation = false,
  disabled = false,
  type = 'button',
}: IconActionButtonProps) {
  const palette = tonePalette(tone)
  const sz = sizing(size)
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sz.gap,
    padding: sz.padding,
    minHeight: sz.minHeight,
    borderRadius: 8,
    fontSize: sz.fontSize,
    fontWeight: 800,
    letterSpacing: '0.02em',
    background: palette.bg,
    color: palette.color,
    border: `1px solid ${palette.border}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.15s, background 0.15s',
    lineHeight: 1.15,
  }
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation()
        if (!disabled) onClick(e)
      }}
      style={style}
    >
      {icon && <span aria-hidden style={{ fontSize: sz.fontSize + 1 }}>{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  )
}
