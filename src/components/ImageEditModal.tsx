import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import GeneratingPlaceholder from './ui/GeneratingPlaceholder'
import AdvancedPanel from './ImageEditModal/AdvancedPanel'
import AspectChips from './ImageEditModal/AspectChips'
import MaskCanvas, { type MaskCanvasHandle } from './ImageEditModal/MaskCanvas'
import RefDropzone from './ImageEditModal/RefDropzone'
import { PRESETS, type PresetChip } from './ImageEditModal/presets'
import {
  DEFAULT_ADVANCED,
  type AdvancedSettings,
  type ImageSize,
  type UserRef,
} from './ImageEditModal/types'

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

// Aspect → CSS aspect-ratio for the preview frame.
function aspectRatioFor(size: ImageSize): string {
  if (size === '1024x1536') return '2 / 3'
  if (size === '1536x1024') return '3 / 2'
  return '1 / 1'
}

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

  const [size, setSize] = useState<ImageSize>('1024x1024')
  const [advanced, setAdvanced] = useState<AdvancedSettings>(DEFAULT_ADVANCED)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [userRefs, setUserRefs] = useState<UserRef[]>([])

  const [maskOn, setMaskOn] = useState(false)
  const [maskTool, setMaskTool] = useState<'brush' | 'eraser'>('brush')
  const [brushSize, setBrushSize] = useState(40)
  const [maskHasStrokes, setMaskHasStrokes] = useState(false)
  const maskRef = useRef<MaskCanvasHandle | null>(null)

  // The mask canvas needs CSS dimensions to scale brush stroke width. Measure
  // the preview frame on mount + whenever aspect changes.
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [previewSize, setPreviewSize] = useState({ width: 480, height: 480 })
  useLayoutEffect(() => {
    const el = previewRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setPreviewSize({ width: rect.width, height: rect.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [size])

  // If the user hides the mask layer mid-edit, drop their strokes — keeping
  // a hidden mask around would invisibly alter the next submit.
  useEffect(() => {
    if (!maskOn) maskRef.current?.clear()
  }, [maskOn])

  const buildBody = (overrides: { editPrompt?: string; skipMask?: boolean; skipRefs?: boolean }) => {
    const maskBase64 =
      !overrides.skipMask && maskOn && maskHasStrokes ? maskRef.current?.exportMask() : null
    return {
      imageUrl,
      editPrompt: overrides.editPrompt ?? editPrompt.trim(),
      kind,
      variationSeed: Date.now(),
      ...(maskBase64 ? { maskBase64 } : {}),
      ...(!overrides.skipRefs && userRefs.length > 0
        ? { userRefs: userRefs.map((r) => ({ mime: r.mime, base64: r.base64 })) }
        : {}),
      size,
      quality: advanced.quality,
      background: advanced.background,
      inputFidelity: advanced.fidelity,
      outputFormat: advanced.outputFormat,
      ...(advanced.outputFormat !== 'png'
        ? { outputCompression: advanced.outputCompression }
        : {}),
    }
  }

  const submit = async (overrides: { editPrompt?: string; skipMask?: boolean; skipRefs?: boolean } = {}) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(overrides)),
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
    void submit({ editPrompt: p.prompt })
  }

  const applyEdit = () => {
    void submit({})
  }

  const applyVariation = () => {
    // Variation is a clean restart of the source — no mask, no extra refs.
    void submit({ editPrompt: '', skipMask: true, skipRefs: true })
  }

  const aspect = useMemo(() => aspectRatioFor(size), [size])
  const canApply = !busy && (editPrompt.trim().length > 0 || maskHasStrokes || userRefs.length > 0)

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
          maxWidth: 600,
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

        <AspectChips value={size} onChange={setSize} disabled={busy} />

        {/* Preview + mask overlay */}
        <div
          ref={previewRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: aspect,
            borderRadius: 16,
            overflow: 'hidden',
            background:
              advanced.background === 'transparent'
                ? // Checker pattern hint when sticker mode is on.
                  'repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, rgba(0,0,0,0.4) 0% 50%) 50% / 16px 16px'
                : 'rgba(0,0,0,0.4)',
            marginBottom: 8,
            border: '1px solid var(--border)',
          }}
        >
          <img
            src={imageUrl}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
          <MaskCanvas
            ref={maskRef}
            imageUrl={imageUrl}
            width={previewSize.width}
            height={previewSize.height}
            enabled={maskOn && !busy}
            tool={maskTool}
            brushSize={brushSize}
            onChange={setMaskHasStrokes}
          />
          {maskOn && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 4,
                padding: 4,
                borderRadius: 999,
                background: 'rgba(15,23,42,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => setMaskTool('brush')}
                disabled={busy}
                title="Paint regions to edit"
                style={miniBtn(maskTool === 'brush', busy)}
              >
                🖌️
              </button>
              <button
                onClick={() => setMaskTool('eraser')}
                disabled={busy}
                title="Erase mask strokes"
                style={miniBtn(maskTool === 'eraser', busy)}
              >
                🧽
              </button>
              <button
                onClick={() => maskRef.current?.clear()}
                disabled={busy}
                title="Clear mask"
                style={miniBtn(false, busy)}
              >
                ✕
              </button>
              <input
                type="range"
                min={6}
                max={120}
                step={2}
                value={brushSize}
                disabled={busy}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                aria-label="Brush size"
                style={{ width: 80, accentColor: '#8b5cf6' }}
              />
            </div>
          )}
          {busy && <GeneratingPlaceholder variant="tile" hint="cooking up your edit" />}
        </div>

        {/* Mask toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button
            onClick={() => setMaskOn((v) => !v)}
            disabled={busy}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              border: maskOn ? '1px solid #ec4899aa' : '1px solid var(--border)',
              background: maskOn
                ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(139,92,246,0.25))'
                : 'rgba(148,163,184,0.08)',
              color: maskOn ? '#fff' : 'var(--text)',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🎨</span>
            <span>{maskOn ? 'Painting just this part' : 'Paint to edit part of it'}</span>
          </button>
          {maskOn && maskHasStrokes && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              ✦ mask active
            </span>
          )}
        </div>

        {/* Free-text edit input */}
        <textarea
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          disabled={busy}
          placeholder={
            maskOn
              ? 'e.g. replace this with a neon sign, make this part purple…'
              : 'e.g. make the sky purple, remove the bottle, add neon signs in the background…'
          }
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
        <div style={{ marginBottom: 14 }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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

        <RefDropzone refs={userRefs} onChange={setUserRefs} disabled={busy} />

        <AdvancedPanel
          open={advancedOpen}
          onToggle={() => setAdvancedOpen((v) => !v)}
          value={advanced}
          onChange={setAdvanced}
          disabled={busy}
        />

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
            onClick={applyVariation}
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
            onClick={applyEdit}
            disabled={!canApply}
            style={{
              flex: '2 1 auto',
              minWidth: 130,
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              background: !canApply
                ? 'rgba(148,163,184,0.15)'
                : 'linear-gradient(135deg, #1d9bf0, #8b5cf6)',
              color: !canApply ? 'var(--muted)' : 'white',
              border: 'none',
              cursor: !canApply ? 'not-allowed' : 'pointer',
              boxShadow: !canApply ? 'none' : '0 6px 18px rgba(139,92,246,0.35)',
            }}
          >
            ✨ Apply edit
          </button>
        </div>
      </div>
    </div>
  )
}

function miniBtn(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: 999,
    fontSize: 12,
    border: 'none',
    background: active ? 'linear-gradient(135deg, #1d9bf0, #8b5cf6)' : 'rgba(148,163,184,0.10)',
    color: active ? '#fff' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }
}
