import { useEffect, useMemo, useRef, useState } from 'react'
import { getFlavorTheme } from '../remotion/flavorThemes'
import type { SpaceApeFlavor } from '../remotion/types'
import { estimateReelCost, getReelArc } from '../data/reelArcs'

interface ReelLoungeVisualProps {
  flavor: SpaceApeFlavor
  hook: string
  caption: string
  pillar: string
  subcategory: string
  reelArcId: string
  reelSeed: number
  durationSeconds: number
  variationSeed?: number
  // Persisted result. Presence of url or error suppresses the mount fetch.
  // Only a Reroll click can re-arm it (by calling onResult(null, null, seed)).
  url?: string
  error?: string
  onResult: (url: string | null, error: string | null, variationSeed?: number) => void
}

interface ReelResponse {
  url: string
  cached: boolean
  hash: string
  reelArcId?: string
  reelArcName?: string
  durationSeconds?: number
}

const MAX_ATTEMPTS = 2
const RETRY_REGEX = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i
const CREDITS_REGEX = /prepayment credits|RESOURCE_EXHAUSTED.*credit|billing/i

function mapError(raw: string): string {
  if (CREDITS_REGEX.test(raw)) {
    return 'Gemini/Veo prepayment credits exhausted — top up at ai.studio/projects, then retry.'
  }
  return raw
}

async function fetchReel(
  body: Record<string, unknown>,
  isCancelled: () => boolean,
): Promise<{ url: string | null; error: string | null }> {
  let lastErr = 'generation failed'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (isCancelled()) return { url: null, error: null }
    try {
      const r = await fetch('/api/generate-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await r.json()) as ReelResponse | { error: string }
      if (isCancelled()) return { url: null, error: null }
      if (r.ok && !('error' in data)) {
        return { url: (data as ReelResponse).url, error: null }
      }
      lastErr = 'error' in data ? data.error : `HTTP ${r.status}`
      // Retrying a credits-exhausted 429 just wastes wall time — one Veo call
      // can burn a minute before failing. Surface the friendly message now.
      if (CREDITS_REGEX.test(lastErr)) return { url: null, error: mapError(lastErr) }
      const transient = r.status >= 500 || r.status === 429 || RETRY_REGEX.test(lastErr)
      if (!transient || attempt === MAX_ATTEMPTS) {
        return { url: null, error: mapError(lastErr) }
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      if (attempt === MAX_ATTEMPTS) return { url: null, error: mapError(lastErr) }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return { url: null, error: mapError(lastErr) }
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ReelLoungeVisual(props: ReelLoungeVisualProps) {
  const {
    flavor,
    hook,
    caption,
    pillar,
    subcategory,
    reelArcId,
    reelSeed,
    durationSeconds,
    variationSeed,
    url: persistedUrl,
    error: persistedError,
    onResult,
  } = props
  const theme = getFlavorTheme(flavor)
  const arc = getReelArc(reelArcId)
  const cost = estimateReelCost(durationSeconds)

  const body = useMemo(
    () => ({
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      reelArcId,
      reelSeed,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    }),
    [flavor, hook, caption, pillar, subcategory, reelArcId, reelSeed, variationSeed],
  )

  const [url, setUrl] = useState<string | null>(persistedUrl ?? null)
  const [error, setError] = useState<string | null>(persistedError ?? null)
  const [isRerolling, setIsRerolling] = useState(false)
  const [startedAt, setStartedAt] = useState<number>(() => Date.now())
  const [elapsedSec, setElapsedSec] = useState(0)
  const cancelledRef = useRef(false)

  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  // Mount fetch — GUARDED. If a URL or error is already persisted for this
  // brief, we render it directly and never hit the API. The only way a Veo
  // call fires is a Reroll click (clears URL+error → guard passes → fetch).
  useEffect(() => {
    cancelledRef.current = false

    if (persistedUrl) {
      setUrl(persistedUrl)
      setError(null)
      setIsRerolling(false)
      return () => {
        cancelledRef.current = true
      }
    }
    if (persistedError) {
      setUrl(null)
      setError(persistedError)
      setIsRerolling(false)
      return () => {
        cancelledRef.current = true
      }
    }

    setUrl(null)
    setError(null)
    setIsRerolling(false)
    setStartedAt(Date.now())
    setElapsedSec(0)
    const isCancelled = () => cancelledRef.current

    fetchReel(body, isCancelled).then(({ url: u, error: e }) => {
      if (isCancelled()) return
      if (u) {
        setUrl(u)
        onResultRef.current(u, null, typeof variationSeed === 'number' ? variationSeed : undefined)
      } else if (e) {
        setError(e)
        onResultRef.current(null, e, typeof variationSeed === 'number' ? variationSeed : undefined)
      }
    })

    return () => {
      cancelledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, persistedUrl, persistedError])

  // Elapsed-time ticker while pending
  useEffect(() => {
    if (url || error) return
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [url, error, startedAt])

  const handleReroll = () => {
    if (isRerolling) return
    const seed = Math.floor(Math.random() * 100_000)
    // Clear persisted state via callback so a refresh mid-reroll won't show stale.
    onResultRef.current(null, null, seed)
    setUrl(null)
    setError(null)
    setIsRerolling(true)
    setStartedAt(Date.now())
    setElapsedSec(0)

    const isCancelled = () => cancelledRef.current
    fetchReel({ ...body, variationSeed: seed }, isCancelled).then(({ url: u, error: e }) => {
      if (isCancelled()) return
      if (u) {
        setUrl(u)
        onResultRef.current(u, null, seed)
      } else if (e) {
        setError(e)
        onResultRef.current(null, e, seed)
      }
      setIsRerolling(false)
    })
  }

  const isPermissionError =
    error && /permission|not enabled|403|preview|access/i.test(error)
  const errorBlock = error ? (
    <div style={{ fontSize: 11, opacity: 0.8, maxWidth: 320, marginTop: 8, lineHeight: 1.4 }}>
      {isPermissionError ? (
        <>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Veo preview access needed</div>
          <div style={{ opacity: 0.8 }}>
            Enable Veo 3 (preview) on your Gemini API key to use Reel Lounge, or set
            <code style={{ background: 'rgba(0,0,0,0.25)', padding: '0 4px', margin: '0 4px', borderRadius: 3 }}>
              VEO_VIDEO_MODEL=veo-2.0-generate-001
            </code>
            to use Veo 2.
          </div>
        </>
      ) : (
        error
      )}
    </div>
  ) : null

  return (
    <div className="mb-3" style={{ width: '100%' }}>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '9/16',
          background: theme.backgroundColor,
          maxHeight: 420,
          margin: '0 auto',
        }}
      >
        {url ? (
          <video
            src={url}
            controls
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }}
          />
        ) : (
          <ReelPlaceholder
            theme={theme}
            error={errorBlock}
            arcName={arc?.name ?? 'Reel'}
            durationSeconds={durationSeconds}
            elapsed={elapsedSec}
            cost={cost}
          />
        )}

        {/* Cost + model chip — visible at all times so the user knows what every click costs */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.04em',
          }}
        >
          🎬 {durationSeconds}s · Veo 3 Fast · ~{cost}
        </div>

        {/* Reroll button (bottom-right) — only when we have a result to replace */}
        {(url !== null || error !== null) && !isRerolling && (
          <button
            onClick={handleReroll}
            title={`Regenerate this reel with a fresh variation (~${cost})`}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(251,146,60,0.92)',
              color: '#1a1a1a',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              padding: '6px 10px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            🎲 Reroll ~{cost}
          </button>
        )}
      </div>
    </div>
  )
}

function ReelPlaceholder({
  theme,
  error,
  arcName,
  durationSeconds,
  elapsed,
  cost,
}: {
  theme: ReturnType<typeof getFlavorTheme>
  error: React.ReactNode
  arcName: string
  durationSeconds: number
  elapsed: number
  cost: string
}) {
  const expectedWindow = '~2–4 min'
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        color: theme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 24,
        textAlign: 'center',
      }}
    >
      {/* Pulsing play triangle stands in for the video while Veo is working */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: theme.primaryColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: error ? 0.35 : 0.9,
          animation: error ? undefined : 'pulse-reel 1.8s ease-in-out infinite',
        }}
      >
        <span style={{ color: theme.textColor, fontSize: 24, marginLeft: 4 }}>▶</span>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: theme.accentColor,
          marginTop: 4,
        }}
      >
        {arcName}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', opacity: 0.7 }}>
        {durationSeconds}s · 9:16
      </div>
      {error ? (
        error
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.65, marginTop: 6 }}>
            Generating… {formatElapsed(elapsed)} / {expectedWindow}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.55, marginTop: 2 }}>
            Veo 3 Fast · ~{cost}
          </div>
        </>
      )}
      <style>{`@keyframes pulse-reel { 0%,100% { transform: scale(0.92); opacity: 0.65; } 50% { transform: scale(1.04); opacity: 1; } }`}</style>
    </div>
  )
}
