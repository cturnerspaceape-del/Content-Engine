import { useEffect, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onCancel: () => void
  // Used as the panel's aria-labelledby; pair with an element id inside `children`.
  ariaLabelledBy?: string
  // Width cap for the panel. Different modals carry different content density,
  // so this is per-call. Defaults to 440 (matches CaptionEditDialog).
  maxWidth?: number
  // Disable cancel-on-backdrop-click and Escape while a long-running submit is
  // in flight. The X / Cancel button is still clickable since it lives inside
  // the panel and the parent decides what to do.
  busy?: boolean
  // Override the panel chrome. The default uses .glass-panel + var(--panel)
  // background, which fits most dialogs. ImageEditModal needs a gradient panel
  // so it passes its own.
  panelStyle?: CSSProperties
  panelClassName?: string
  // Padding inside the panel. Defaults to 20 — the unified value across the
  // existing modals after this pass.
  padding?: number
  children: ReactNode
}

const BACKDROP: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10_000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(26,18,48,0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: 16,
}

export default function Modal({
  open,
  onCancel,
  ariaLabelledBy,
  maxWidth = 440,
  busy = false,
  panelStyle,
  panelClassName,
  padding = 20,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || busy) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, busy, onCancel])

  if (!open) return null

  const mergedPanelStyle: CSSProperties = {
    width: '100%',
    maxWidth,
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    borderRadius: 16,
    padding,
    background: 'var(--panel)',
    ...panelStyle,
  }

  return createPortal(
    <div
      className="fade-in"
      style={BACKDROP}
      onClick={busy ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card-enter ${panelClassName ?? 'glass-panel'}`}
        style={mergedPanelStyle}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
