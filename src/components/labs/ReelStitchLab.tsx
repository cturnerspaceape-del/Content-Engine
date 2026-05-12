import { useEffect, useRef, useState } from 'react'

interface ReelStitchLabProps {
  onBack: () => void
}

const MAX_SLOTS = 7
const MIN_TO_STITCH = 2
const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

interface ClipSlot {
  // Stable id so React keys don't shuffle when we mutate the array.
  id: string
  // null = empty slot.
  file: File | null
  // Object URL for inline <video> preview. Revoked when the slot is replaced/cleared.
  previewUrl: string | null
  base64: string | null
  mime: string
  duration: number | null
  trimStart: number
  trimEnd: number | null // null until duration is known; then defaults to duration
  speed: number
}

function makeEmptySlot(): ClipSlot {
  return {
    id: `slot-${Math.random().toString(36).slice(2, 9)}`,
    file: null,
    previewUrl: null,
    base64: null,
    mime: 'video/mp4',
    duration: null,
    trimStart: 0,
    trimEnd: null,
    speed: 1,
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`failed to read ${file.name}`))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : '')
    }
    reader.readAsDataURL(file)
  })
}

function fmtSeconds(s: number | null): string {
  if (s == null || !Number.isFinite(s)) return '—'
  return s.toFixed(s < 10 ? 1 : 0) + 's'
}

function outputSeconds(slot: ClipSlot): number {
  if (slot.duration == null) return 0
  const start = slot.trimStart
  const end = slot.trimEnd ?? slot.duration
  const trimmed = Math.max(0, end - start)
  return trimmed / slot.speed
}

export default function ReelStitchLab({ onBack }: ReelStitchLabProps) {
  const [slots, setSlots] = useState<ClipSlot[]>(() => [
    makeEmptySlot(),
    makeEmptySlot(),
    makeEmptySlot(),
    makeEmptySlot(),
  ])

  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stitchedUrl, setStitchedUrl] = useState<string | null>(null)
  const [stitchedDuration, setStitchedDuration] = useState<number | null>(null)
  // Smart Match Cut: drops 1 duplicate frame at each cut. Default on because
  // the user's Veo workflow chains end-frame → next start-frame, which would
  // otherwise produce a 1-frame stutter.
  const [smartCut, setSmartCut] = useState(true)

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      slots.forEach((s) => {
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filledSlots = slots.filter((s) => s.file && s.base64 && s.duration != null)
  const totalSeconds = filledSlots.reduce((acc, s) => acc + outputSeconds(s), 0)
  const canStitch =
    !busy && filledSlots.length >= MIN_TO_STITCH

  const updateSlot = (id: string, patch: Partial<ClipSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const handlePickFile = async (slotId: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      setError(`${file.name} is not a video file`)
      return
    }
    setError(null)
    const previewUrl = URL.createObjectURL(file)
    // Revoke any old preview for this slot.
    const old = slots.find((s) => s.id === slotId)?.previewUrl
    if (old) URL.revokeObjectURL(old)
    updateSlot(slotId, {
      file,
      previewUrl,
      mime: file.type || 'video/mp4',
      base64: null,
      duration: null,
      trimStart: 0,
      trimEnd: null,
      speed: 1,
    })
    try {
      const base64 = await fileToBase64(file)
      updateSlot(slotId, { base64 })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleClearSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl)
    setSlots((prev) => prev.map((s) => (s.id === slotId ? makeEmptySlot() : s)))
  }

  const handleAddSlot = () => {
    if (slots.length >= MAX_SLOTS) return
    setSlots((prev) => [...prev, makeEmptySlot()])
  }

  const handleClearAll = () => {
    slots.forEach((s) => {
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl)
    })
    setSlots([makeEmptySlot(), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()])
    setStitchedUrl(null)
    setStitchedDuration(null)
    setError(null)
  }

  const handleStitch = async () => {
    if (!canStitch) return
    setBusy(true)
    setError(null)
    setStitchedUrl(null)
    setStitchedDuration(null)
    setElapsed(0)
    const tStart = Date.now()
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - tStart) / 1000)), 1000)
    try {
      const payload = {
        smartCut,
        clips: filledSlots.map((s) => ({
          mime: s.mime,
          base64: s.base64!,
          ...(s.trimStart > 0 ? { trimStart: s.trimStart } : {}),
          ...(s.trimEnd != null && s.duration != null && s.trimEnd < s.duration
            ? { trimEnd: s.trimEnd }
            : {}),
          ...(s.speed !== 1 ? { speed: s.speed } : {}),
        })),
      }
      const res = await fetch('/api/stitch-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as {
        url?: string
        error?: string
        durationSeconds?: number | null
      }
      if (!res.ok || !data.url) throw new Error(data.error || `HTTP ${res.status}`)
      setStitchedUrl(data.url)
      setStitchedDuration(data.durationSeconds ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      clearInterval(tick)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4" style={{ position: 'relative', textAlign: 'center' }}>
          <button
            onClick={onBack}
            disabled={busy}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              background: 'rgba(148,163,184,.1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              opacity: busy ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            ← Back
          </button>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🧵 Reel Stitch Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Drop up to {MAX_SLOTS} clips, trim & re-speed each, then splice into one Reel.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          {slots.map((slot, idx) => (
            <ClipRow
              key={slot.id}
              slot={slot}
              position={idx + 1}
              busy={busy}
              onPickFile={(f) => handlePickFile(slot.id, f)}
              onClear={() => handleClearSlot(slot.id)}
              onChange={(patch) => updateSlot(slot.id, patch)}
            />
          ))}
        </div>

        {slots.length < MAX_SLOTS && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <button
              onClick={handleAddSlot}
              disabled={busy}
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(168,85,247,.10)',
                border: '1px dashed #a855f7',
                color: '#a855f7',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.5 : 1,
              }}
            >
              + Add slot ({slots.length}/{MAX_SLOTS})
            </button>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.3)',
            border: '1px solid var(--border)',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>
              {filledSlots.length}
            </span>{' '}
            clip{filledSlots.length === 1 ? '' : 's'} ready · est total{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>
              {fmtSeconds(totalSeconds)}
            </span>
          </div>
          <button
            onClick={handleClearAll}
            disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(148,163,184,.08)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            🗑️ Clear all
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 12,
            background: smartCut
              ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.12))'
              : 'rgba(15,23,42,0.3)',
            border: smartCut ? '1px solid #a855f799' : '1px solid var(--border)',
            marginBottom: 16,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.5 : 1,
          }}
          onClick={() => {
            if (!busy) setSmartCut((v) => !v)
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: smartCut ? '#a855f7' : 'var(--text)',
              }}
            >
              {smartCut ? '✨ Smart Match Cut · on' : 'Smart Match Cut · off'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              Drops the duplicate frame at every cut so chained Veo clips splice seamlessly.
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 999,
              background: smartCut ? '#a855f7' : 'rgba(148,163,184,0.3)',
              position: 'relative',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: smartCut ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: '#fff',
                transition: 'left 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#fb923c',
              background: 'rgba(251,146,60,0.12)',
              border: '1px solid #fb923c55',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button
            onClick={handleStitch}
            disabled={!canStitch}
            title={
              filledSlots.length < MIN_TO_STITCH
                ? `Need at least ${MIN_TO_STITCH} clips`
                : ''
            }
            className="text-sm font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: 'white',
              boxShadow: canStitch ? '0 8px 24px rgba(168,85,247,0.4)' : 'none',
            }}
          >
            {busy
              ? `🧵 Splicing… ${elapsed}s`
              : stitchedUrl
                ? '🔁 Re-stitch'
                : `⚡ Stitch ${filledSlots.length} clip${filledSlots.length === 1 ? '' : 's'}`}
          </button>
        </div>

        {stitchedUrl && (
          <div className="glass-panel" style={{ padding: 16, marginBottom: 12 }}>
            <video
              src={stitchedUrl}
              controls
              autoPlay
              loop
              playsInline
              style={{
                width: '100%',
                maxWidth: 360,
                margin: '0 auto',
                display: 'block',
                aspectRatio: '9 / 16',
                borderRadius: 12,
                background: '#000',
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Stitched · {fmtSeconds(stitchedDuration ?? totalSeconds)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <a
                href={stitchedUrl}
                download
                className="text-sm font-bold px-4 py-2 rounded-lg"
                style={{
                  background: 'rgba(59,130,246,.1)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                }}
              >
                ⬇️ Download mp4
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ClipRowProps {
  slot: ClipSlot
  position: number
  busy: boolean
  onPickFile: (file: File) => void
  onClear: () => void
  onChange: (patch: Partial<ClipSlot>) => void
}

function ClipRow({ slot, position, busy, onPickFile, onClear, onChange }: ClipRowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hover, setHover] = useState(false)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setHover(false)
    if (busy) return
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('video/'))
    if (file) onPickFile(file)
  }

  const onMetadata = () => {
    const el = videoRef.current
    if (!el) return
    const d = el.duration
    if (Number.isFinite(d) && d > 0) {
      onChange({ duration: d, trimEnd: slot.trimEnd ?? d })
    }
  }

  // Seek preview to the trim-in point so the user sees what they'll start on.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (slot.trimStart >= 0 && slot.duration) {
      try {
        el.currentTime = Math.min(slot.trimStart, slot.duration - 0.1)
      } catch {
        // some browsers throw if metadata isn't fully ready — non-fatal
      }
    }
  }, [slot.trimStart, slot.duration])

  const label =
    position === 1 ? 'Start video' : position === 7 ? 'Final video' : `Video ${position}`

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 14,
        padding: 12,
        borderRadius: 14,
        background: 'rgba(15,23,42,0.25)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy && !slot.file) setHover(true)
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        onClick={() => {
          if (busy || slot.file) return
          inputRef.current?.click()
        }}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '9 / 16',
          borderRadius: 12,
          border: `1px dashed ${slot.file ? 'var(--border)' : hover ? '#a855f7' : 'var(--border)'}`,
          background: slot.previewUrl
            ? '#000'
            : hover
              ? 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(99,102,241,0.10))'
              : 'rgba(15,23,42,0.4)',
          cursor: busy || slot.file ? 'default' : 'pointer',
          opacity: busy ? 0.5 : 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {slot.previewUrl ? (
          <>
            <video
              ref={videoRef}
              src={slot.previewUrl}
              muted
              preload="metadata"
              playsInline
              onLoadedMetadata={onMetadata}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              disabled={busy}
              aria-label="Remove clip"
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 22,
                height: 22,
                borderRadius: 999,
                background: 'rgba(15,23,42,0.85)',
                color: '#fff',
                border: '1px solid var(--border)',
                fontSize: 11,
                lineHeight: '20px',
                padding: 0,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              ×
            </button>
            <div
              style={{
                position: 'absolute',
                left: 6,
                top: 6,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(15,23,42,0.85)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {position}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 12, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🎥</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{label}</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>drop or click</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPickFile(f)
            e.target.value = ''
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {slot.file ? `raw ${fmtSeconds(slot.duration)}` : 'empty'}
          </div>
        </div>

        {slot.file ? (
          slot.duration == null ? (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Reading metadata…</div>
          ) : (
            <>
              <TrimControl
                duration={slot.duration}
                start={slot.trimStart}
                end={slot.trimEnd ?? slot.duration}
                disabled={busy}
                onChange={(start, end) => onChange({ trimStart: start, trimEnd: end })}
              />
              <SpeedControl
                value={slot.speed}
                disabled={busy}
                onChange={(v) => onChange({ speed: v })}
              />
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Out: <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {fmtSeconds(outputSeconds(slot))}
                </span>
              </div>
            </>
          )
        ) : (
          <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
            {position === 1
              ? 'This clip plays first.'
              : 'Optional — leave empty to skip.'}
          </div>
        )}
      </div>
    </div>
  )
}

interface TrimControlProps {
  duration: number
  start: number
  end: number
  disabled: boolean
  onChange: (start: number, end: number) => void
}

function TrimControl({ duration, start, end, disabled, onChange }: TrimControlProps) {
  const STEP = 0.1
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 4,
        }}
      >
        Trim · {start.toFixed(1)}s → {end.toFixed(1)}s ({(end - start).toFixed(1)}s)
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="range"
          min={0}
          max={duration}
          step={STEP}
          value={start}
          disabled={disabled}
          onChange={(e) => {
            const v = Math.min(parseFloat(e.target.value), end - STEP)
            onChange(v, end)
          }}
          style={{ flex: 1, accentColor: '#a855f7' }}
          aria-label="Trim start"
        />
        <input
          type="range"
          min={0}
          max={duration}
          step={STEP}
          value={end}
          disabled={disabled}
          onChange={(e) => {
            const v = Math.max(parseFloat(e.target.value), start + STEP)
            onChange(start, v)
          }}
          style={{ flex: 1, accentColor: '#a855f7' }}
          aria-label="Trim end"
        />
      </div>
    </div>
  )
}

interface SpeedControlProps {
  value: number
  disabled: boolean
  onChange: (v: number) => void
}

function SpeedControl({ value, disabled, onChange }: SpeedControlProps) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 4,
        }}
      >
        Speed · {value}×
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {SPEED_STEPS.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            disabled={disabled}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              border: value === s ? '1px solid #a855f7' : '1px solid var(--border)',
              background:
                value === s
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25))'
                  : 'rgba(148,163,184,0.08)',
              color: value === s ? '#fff' : 'var(--text)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  )
}
