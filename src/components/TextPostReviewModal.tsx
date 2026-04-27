import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PlatformVariant, TunerPlatform } from '../lib/platformTuners'
import { platformColors } from './PlatformContentItem'

interface TextPostReviewModalProps {
  platforms: ReadonlyArray<TunerPlatform>
  variants: Partial<Record<TunerPlatform, PlatformVariant>>
  onCancel: () => void
  onConfirm: () => void
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  'IG/FB': 'IG/FB',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
}

const PLATFORM_ICONS: Record<TunerPlatform, string> = {
  'IG/FB': '📷',
  X: '𝕏',
  Threads: '@',
  TikTok: '🎵',
  'YouTube Shorts': '▶',
}

const PLATFORM_COLOR_KEY: Record<TunerPlatform, string> = {
  'IG/FB': 'Instagram',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'YouTube Shorts',
}

export default function TextPostReviewModal({
  platforms,
  variants,
  onCancel,
  onConfirm,
}: TextPostReviewModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const populated = platforms.filter((p) => variants[p])
  const labels = populated.map((p) => PLATFORM_LABELS[p]).join(' & ')

  return createPortal(
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10_000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26,18,48,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: 16,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter glass-panel"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: 16,
          padding: 20,
          background: 'var(--panel)',
        }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
          Post to {labels || 'selected platforms'}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Review each caption, then copy the bundle and paste into the apps.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          {populated.map((platform) => {
            const v = variants[platform]
            if (!v) return null
            const accent = platformColors[PLATFORM_COLOR_KEY[platform]] ?? 'var(--accent)'
            return (
              <div
                key={platform}
                className="glass-panel"
                style={{
                  borderTop: `3px solid ${accent}`,
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--panel-2)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex items-center gap-2 text-sm font-bold"
                    style={{ color: accent }}
                  >
                    <span style={{ fontSize: 14 }}>{PLATFORM_ICONS[platform]}</span>
                    <span>{PLATFORM_LABELS[platform]}</span>
                  </div>
                  <span
                    className="text-[11px] font-mono"
                    style={{
                      color:
                        v.caption.length > v.charLimit
                          ? '#ef4444'
                          : v.caption.length / v.charLimit > 0.9
                          ? '#f59e0b'
                          : 'var(--muted)',
                    }}
                  >
                    {v.caption.length}/{v.charLimit}
                  </span>
                </div>
                <div
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: 'var(--text)', lineHeight: 1.5 }}
                >
                  {v.caption}
                </div>
                {v.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {v.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--panel)',
                          color: 'var(--muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-sm font-bold px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(148,163,184,.1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={populated.length === 0}
            className="text-sm font-bold px-4 py-2 rounded-lg transition-all"
            style={{
              background: populated.length === 0 ? 'rgba(148,163,184,.1)' : 'var(--accent)',
              color: populated.length === 0 ? 'var(--muted)' : 'white',
              cursor: populated.length === 0 ? 'not-allowed' : 'pointer',
              border: '1px solid transparent',
            }}
          >
            📋 Copy &amp; finish
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
