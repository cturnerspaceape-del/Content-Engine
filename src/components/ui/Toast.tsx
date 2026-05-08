import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastKind = 'success' | 'warn' | 'error'

export interface Toast {
  kind: ToastKind
  text: string
}

const TONES: Record<ToastKind, { bg: string; color: string; border: string }> = {
  success: {
    bg: 'rgba(16,185,129,0.14)',
    color: '#10b981',
    border: 'rgba(16,185,129,0.55)',
  },
  warn: {
    bg: 'rgba(251,146,60,0.14)',
    color: '#fb923c',
    border: 'rgba(251,146,60,0.55)',
  },
  error: {
    bg: 'rgba(239,68,68,0.14)',
    color: '#ef4444',
    border: 'rgba(239,68,68,0.55)',
  },
}

// Single-slot toast: a new show() cancels the previous timer and replaces the
// content rather than stacking. That's how the labs currently behave; pulling
// it into one hook means a fix here lands everywhere at once.
export function useToast(autoDismissMs = 4000) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timerRef = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const show = useCallback(
    (next: Toast) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      setToast(next)
      timerRef.current = window.setTimeout(() => {
        setToast(null)
        timerRef.current = null
      }, autoDismissMs)
    },
    [autoDismissMs],
  )

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return { toast, show, clear }
}

export function ToastView({ toast, onDismiss }: { toast: Toast | null; onDismiss?: () => void }) {
  if (!toast) return null
  const tone = TONES[toast.kind]
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10_001,
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border}`,
        padding: '10px 16px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        cursor: onDismiss ? 'pointer' : 'default',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {toast.text}
    </div>
  )
}
