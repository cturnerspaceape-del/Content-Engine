import { useState } from 'react'
import GeneratingPlaceholder from './ui/GeneratingPlaceholder'

type EditKind = 'single-image' | 'carousel-slide' | 'email-image'

interface ImageEditModalProps {
  // Friendly label rendered in the header ("this image", "slide 3", "hero").
  label: string
  // Source image URL — the picture being edited. Shown as preview, sent as
  // the reference to /api/edit-image.
  imageUrl: string
  // Cache bucket — keeps edits filed alongside their lab's other assets.
  kind: EditKind
  // Called with the resulting URL once the edit completes.
  onApplied: (newUrl: string) => void
  onCancel: () => void
}

interface PresetChip {
  emoji: string
  label: string
  prompt: string
}

const PRESETS: ReadonlyArray<PresetChip> = [
  { emoji: '🌞', label: 'Brighter', prompt: 'increase brightness and exposure, lift the shadows slightly' },
  { emoji: '✨', label: 'More vivid', prompt: 'boost color saturation and vibrance, richer tones, more punchy' },
  { emoji: '🎬', label: 'Cinematic', prompt: 'cinematic color grade, slight teal-and-orange split, deeper blacks, filmic contrast' },
  { emoji: '🌫️', label: 'Softer', prompt: 'soften the lighting, reduce contrast, dreamier and more diffuse' },
  { emoji: '📸', label: 'Sharper', prompt: 'sharpen details and texture, crisper edges, more in-focus' },
  { emoji: '🌃', label: 'Night mode', prompt: 'shift to a nighttime scene with neon-leaning lighting, keep subject identical' },
]

export default function ImageEditModal({
  label,
  imageUrl,
  kind,
  onApplied,
  onCancel,
}: ImageEditModalProps) {
  const [editPrompt, setEditPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (promptOverride?: string) => {
    if (busy) return
    const promptToSend = (promptOverride ?? editPrompt).trim()
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          editPrompt: promptToSend,
          kind,
          variationSeed: Date.now(),
        }),
      })
      const data = (await r.json()) as { url?: string; error?: string }
      if (!r.ok || !data.url) throw new Error(data.error || `HTTP ${r.status}`)
      onApplied(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const applyPreset = (p: PresetChip) => {
    void submit(p.prompt)
  }

  return (
    <div
      onClick={busy ? undefined : onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 540,
          padding: 24,
          borderRadius: 24,
          background:
            'linear-gradient(135deg, rgba(29,155,240,0.12), rgba(139,92,246,0.12))',
          border: '1px solid var(--border)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>✏️</div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Edit {label}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>
            Tell us what to change &mdash; or grab a vibe below.
          </p>
        </div>

        {/* Preview */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: 16,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.4)',
            marginBottom: 16,
            border: '1px solid var(--border)',
          }}
        >
          <img
            src={imageUrl}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {busy && <GeneratingPlaceholder variant="tile" hint="cooking up your edit" />}
        </div>

        {/* Free-text edit input */}
        <textarea
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          disabled={busy}
          placeholder="e.g. make the sky purple, remove the bottle, add neon signs in the background…"
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.4)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: 12,
            opacity: busy ? 0.5 : 1,
          }}
        />

        {/* Preset chips */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 8,
            }}
          >
            Quick vibes
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                disabled={busy}
                title={p.prompt}
                style={{
                  padding: '7px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                  background: busy
                    ? 'rgba(148,163,184,0.04)'
                    : 'rgba(148,163,184,0.08)',
                  color: 'var(--text)',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 13 }}>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fb923c',
              background: 'rgba(251,146,60,0.12)',
              border: '1px solid #fb923c55',
              padding: '8px 12px',
              borderRadius: 10,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: '1 1 auto',
              minWidth: 90,
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(148,163,184,0.08)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => submit('')}
            disabled={busy}
            title="Fresh take with the same subject &amp; composition"
            style={{
              flex: '1 1 auto',
              minWidth: 110,
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
              border: '1px solid #f59e0b55',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            🎲 Variation
          </button>
          <button
            onClick={() => submit()}
            disabled={busy || !editPrompt.trim()}
            style={{
              flex: '2 1 auto',
              minWidth: 130,
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              background:
                busy || !editPrompt.trim()
                  ? 'rgba(148,163,184,0.15)'
                  : 'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
              color: busy || !editPrompt.trim() ? 'var(--muted)' : 'white',
              border: 'none',
              cursor: busy || !editPrompt.trim() ? 'not-allowed' : 'pointer',
              boxShadow:
                busy || !editPrompt.trim()
                  ? 'none'
                  : '0 6px 18px rgba(139,92,246,0.35)',
            }}
          >
            ✨ Apply edit
          </button>
        </div>
      </div>
    </div>
  )
}
