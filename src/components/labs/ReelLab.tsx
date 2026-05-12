import { useEffect, useRef, useState } from 'react'
import { usePersistedState } from '../../utils/persistedState'

interface ReelLabProps {
  onBack: () => void
}

type AspectRatio = '9:16' | '16:9' | '1:1'
type Duration = 4 | 6 | 8

interface Frame {
  mime: string
  base64: string // raw base64 (no data: prefix)
  previewUrl: string // data URL for <img>
  name: string
}

const ASPECTS: { value: AspectRatio; label: string; hint: string }[] = [
  { value: '9:16', label: '9:16', hint: 'IG Reel · TikTok · Shorts' },
  { value: '16:9', label: '16:9', hint: 'YouTube · Landscape' },
  { value: '1:1', label: '1:1', hint: 'Square Feed' },
]

// Veo 3.1 first+last frame interpolation on the Gemini API only accepts 8s
// requests; 4s / 6s return INVALID_ARGUMENT. Locked to 8s here so the UI
// doesn't surface options the model will reject.
const DURATIONS: Duration[] = [8]

const CAMERA_PRESETS: { value: string; label: string; emoji: string }[] = [
  { value: '', label: 'Auto', emoji: '✨' },
  { value: 'static', label: 'Static', emoji: '📌' },
  { value: 'dolly-in', label: 'Dolly In', emoji: '➡️' },
  { value: 'dolly-out', label: 'Dolly Out', emoji: '⬅️' },
  { value: 'pan-left', label: 'Pan Left', emoji: '↖️' },
  { value: 'pan-right', label: 'Pan Right', emoji: '↗️' },
  { value: 'orbit', label: 'Orbit', emoji: '🔄' },
  { value: 'handheld', label: 'Handheld', emoji: '✋' },
  { value: 'zoom-in', label: 'Zoom In', emoji: '🔍' },
  { value: 'zoom-out', label: 'Zoom Out', emoji: '🔭' },
]

const VIBE_PRESETS: { value: string; label: string; emoji: string }[] = [
  { value: '', label: 'Auto', emoji: '✨' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎞️' },
  { value: 'dreamy', label: 'Dreamy', emoji: '☁️' },
  { value: 'neon', label: 'Neon Noir', emoji: '🌃' },
  { value: 'slow-mo', label: 'Slow-Mo', emoji: '🐢' },
  { value: 'film-grain', label: '35mm Grain', emoji: '📽️' },
  { value: 'anime', label: 'Anime', emoji: '🌀' },
  { value: 'space-ape', label: 'Space Ape', emoji: '🍌' },
]

async function fileToFrame(file: File): Promise<Frame> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`failed to read ${file.name}`))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const idx = result.indexOf(',')
      const base64 = idx >= 0 ? result.slice(idx + 1) : ''
      resolve({
        mime: file.type || 'image/png',
        base64,
        previewUrl: result,
        name: file.name,
      })
    }
    reader.readAsDataURL(file)
  })
}

export default function ReelLab({ onBack }: ReelLabProps) {
  const [startFrame, setStartFrame] = useState<Frame | null>(null)
  const [endFrame, setEndFrame] = useState<Frame | null>(null)

  const [prompt, setPrompt] = usePersistedState<string>('sl:reelLab:prompt', '')
  const [negativePrompt, setNegativePrompt] = usePersistedState<string>(
    'sl:reelLab:negativePrompt',
    '',
  )
  const [aspect, setAspect] = usePersistedState<AspectRatio>('sl:reelLab:aspect', '9:16')
  const [duration, setDuration] = usePersistedState<Duration>('sl:reelLab:duration', 8)
  // Snap legacy persisted 4s/6s selections to 8s — the API rejects anything else
  // in first+last frame mode.
  useEffect(() => {
    if (!DURATIONS.includes(duration)) setDuration(8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [camera, setCamera] = usePersistedState<string>('sl:reelLab:camera', '')
  const [vibe, setVibe] = usePersistedState<string>('sl:reelLab:vibe', '')

  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const canGenerate = !busy && !!startFrame && !!endFrame && prompt.trim().length > 0

  const handleGenerate = async () => {
    if (!canGenerate || !startFrame || !endFrame) return
    setBusy(true)
    setError(null)
    setVideoUrl(null)
    setElapsed(0)
    const tStart = Date.now()
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - tStart) / 1000)), 1000)
    try {
      const res = await fetch('/api/generate-veo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          startFrame: { mime: startFrame.mime, base64: startFrame.base64 },
          endFrame: { mime: endFrame.mime, base64: endFrame.base64 },
          aspectRatio: aspect,
          durationSeconds: duration,
          cameraMotion: camera || undefined,
          vibe: vibe || undefined,
          negativePrompt: negativePrompt.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error || `HTTP ${res.status}`)
      setVideoUrl(data.url)
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
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎬 Reel Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Start frame → end frame · Veo 3.1 · IG Reel format
          </p>
        </div>

        {/* Frame uploads */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 40px 1fr',
            gap: 12,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <FrameDropzone
            label="Start frame"
            frame={startFrame}
            onPick={setStartFrame}
            onClear={() => setStartFrame(null)}
            aspect={aspect}
            disabled={busy}
          />
          <div
            style={{
              textAlign: 'center',
              fontSize: 24,
              color: 'var(--muted)',
            }}
          >
            →
          </div>
          <FrameDropzone
            label="End frame"
            frame={endFrame}
            onPick={setEndFrame}
            onClear={() => setEndFrame(null)}
            aspect={aspect}
            disabled={busy}
          />
        </div>

        {/* Prompt */}
        <SectionLabel>Prompt</SectionLabel>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
          placeholder="Describe the motion between the two frames. e.g. The character lifts the can to their lips, condensation rolling, neon reflections flickering in the background."
          rows={3}
          style={textareaStyle(busy)}
        />

        {/* Aspect + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          <div>
            <SectionLabel>Aspect ratio</SectionLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ASPECTS.map((a) => (
                <ChipButton
                  key={a.value}
                  active={aspect === a.value}
                  disabled={busy}
                  onClick={() => setAspect(a.value)}
                  title={a.hint}
                >
                  {a.label}
                </ChipButton>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Duration</SectionLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DURATIONS.map((d) => (
                <ChipButton
                  key={d}
                  active={duration === d}
                  disabled={busy}
                  onClick={() => setDuration(d)}
                >
                  {d}s
                </ChipButton>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
              Veo 3.1 first+last frame supports 8s clips only.
            </div>
          </div>
        </div>

        {/* Camera */}
        <SectionLabel>Camera motion</SectionLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {CAMERA_PRESETS.map((c) => (
            <ChipButton
              key={c.value || 'auto'}
              active={camera === c.value}
              disabled={busy}
              onClick={() => setCamera(c.value)}
            >
              <span style={{ marginRight: 4 }}>{c.emoji}</span>
              {c.label}
            </ChipButton>
          ))}
        </div>

        {/* Vibe */}
        <SectionLabel>Vibe</SectionLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {VIBE_PRESETS.map((v) => (
            <ChipButton
              key={v.value || 'auto'}
              active={vibe === v.value}
              disabled={busy}
              onClick={() => setVibe(v.value)}
            >
              <span style={{ marginRight: 4 }}>{v.emoji}</span>
              {v.label}
            </ChipButton>
          ))}
        </div>

        {/* Negative prompt */}
        <SectionLabel>Negative prompt (optional)</SectionLabel>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          disabled={busy}
          placeholder="What to avoid — e.g. blurry, text, watermark, distorted hands"
          rows={2}
          style={textareaStyle(busy)}
        />

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

        {/* Generate */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            title={
              !startFrame || !endFrame
                ? 'Upload both a start and end frame first'
                : prompt.trim().length === 0
                  ? 'Describe the motion between the frames'
                  : ''
            }
            className="text-sm font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              color: 'white',
              boxShadow: canGenerate ? '0 8px 24px rgba(236,72,153,0.4)' : 'none',
            }}
          >
            {busy ? `🎬 Cooking… ${elapsed}s` : videoUrl ? '🔁 Regenerate' : '⚡ Generate video'}
          </button>
        </div>

        {/* Video result */}
        {videoUrl && (
          <div className="glass-panel" style={{ padding: 16, marginBottom: 12 }}>
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              style={{
                width: '100%',
                maxWidth: aspect === '9:16' ? 360 : aspect === '1:1' ? 480 : 720,
                margin: '0 auto',
                display: 'block',
                aspectRatio:
                  aspect === '9:16' ? '9 / 16' : aspect === '16:9' ? '16 / 9' : '1 / 1',
                borderRadius: 12,
                background: '#000',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <a
                href={videoUrl}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  )
}

function ChipButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '7px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: active ? '1px solid #ec489999' : '1px solid var(--border)',
        background: active
          ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(139,92,246,0.25))'
          : 'rgba(148,163,184,0.08)',
        color: active ? '#fff' : 'var(--text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function textareaStyle(busy: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(15,23,42,0.4)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: 14,
    opacity: busy ? 0.5 : 1,
  }
}

interface FrameDropzoneProps {
  label: string
  frame: Frame | null
  onPick: (frame: Frame) => void
  onClear: () => void
  aspect: AspectRatio
  disabled: boolean
}

function FrameDropzone({ label, frame, onPick, onClear, aspect, disabled }: FrameDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [hover, setHover] = useState(false)

  const ingest = async (files: FileList | File[]) => {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'))
    if (!file) return
    const f = await fileToFrame(file)
    onPick(f)
  }

  const aspectCss =
    aspect === '9:16' ? '9 / 16' : aspect === '16:9' ? '16 / 9' : '1 / 1'

  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        {label}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setHover(true)
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault()
          setHover(false)
          if (disabled) return
          void ingest(e.dataTransfer.files)
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspectCss,
          borderRadius: 14,
          border: `1px dashed ${hover ? '#ec4899' : 'var(--border)'}`,
          background: frame
            ? '#000'
            : hover
              ? 'linear-gradient(135deg, rgba(236,72,153,0.10), rgba(139,92,246,0.10))'
              : 'rgba(15,23,42,0.25)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {frame ? (
          <>
            <img
              src={frame.previewUrl}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              disabled={disabled}
              aria-label="Remove frame"
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
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 11,
                lineHeight: '20px',
                padding: 0,
              }}
            >
              ×
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 16, fontSize: 12, color: 'var(--muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Drop image</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>or click to pick</div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (!e.target.files) return
          void ingest(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
