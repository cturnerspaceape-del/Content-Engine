import { useEffect, useMemo, useRef, useState } from 'react'
import { getFlavorTheme } from '../remotion/flavorThemes'
import type { SpaceApeFlavor } from '../remotion/types'
import { getCarouselArc } from '../data/carouselArcs'

interface CarouselLoungeVisualProps {
  flavor: SpaceApeFlavor
  hook: string
  caption: string
  pillar: string
  subcategory: string
  arcId: string
  slideCount: number
  carouselSeed: number
  variationSeed?: number
  // Picked research seed — anchors each slide to a specific trend signal.
  // Forwarded to /api/generate-carousel-slide and into the Gemini prompt's
  // TREND CONTEXT section.
  researchAngle?: string
  researchNotes?: string
  // URLs from the picked seed. Server downloads images from these and
  // uses them as inspo refs in place of the static manifest pool.
  researchSourceUrls?: string[]
  researchSourceImageUrls?: string[]
  // Persisted per-slide results. A slot that has either a URL or an error set
  // will NOT be auto-fetched on mount — the guard is the whole cost-safety story.
  slideUrls?: (string | null)[]
  slideErrors?: (string | null)[]
  slideVariationSeeds?: (number | undefined)[]
  onSlideResult: (index: number, url: string | null, error: string | null, variationSeed?: number) => void
}

interface SlideResponse {
  url: string
  cached: boolean
  hash: string
  shotTemplateId?: string
  shotTemplateName?: string
  slideIndex: number
  slideRole?: string
}

const MAX_ATTEMPTS = 3
const RETRY_REGEX = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i
const CREDITS_REGEX = /prepayment credits|RESOURCE_EXHAUSTED.*credit|billing/i

function mapError(raw: string): string {
  if (CREDITS_REGEX.test(raw)) {
    return 'Gemini prepayment credits exhausted — top up at ai.studio/projects, then retry.'
  }
  return raw
}

async function fetchSlide(
  body: Record<string, unknown>,
  isCancelled: () => boolean,
): Promise<{ url: string | null; error: string | null }> {
  let lastErr = 'generation failed'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (isCancelled()) return { url: null, error: null }
    try {
      const r = await fetch('/api/generate-carousel-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await r.json()) as SlideResponse | { error: string }
      if (isCancelled()) return { url: null, error: null }
      if (r.ok && !('error' in data)) {
        return { url: (data as SlideResponse).url, error: null }
      }
      lastErr = 'error' in data ? data.error : `HTTP ${r.status}`
      // Don't retry a credits-exhausted 429 — it'll just keep failing until
      // the user tops up. Surface the friendly message immediately.
      const creditsGone = CREDITS_REGEX.test(lastErr)
      if (creditsGone) return { url: null, error: mapError(lastErr) }
      const transient = r.status >= 500 || r.status === 429 || RETRY_REGEX.test(lastErr)
      if (!transient || attempt === MAX_ATTEMPTS) {
        return { url: null, error: mapError(lastErr) }
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      if (attempt === MAX_ATTEMPTS) return { url: null, error: mapError(lastErr) }
    }
    // Exponential backoff so queued slides have room to breathe under load.
    const backoff = 1000 * Math.pow(2, attempt - 1)
    await new Promise((resolve) => setTimeout(resolve, backoff))
  }
  return { url: null, error: mapError(lastErr) }
}

export default function CarouselLoungeVisual(props: CarouselLoungeVisualProps) {
  const {
    flavor,
    hook,
    caption,
    pillar,
    subcategory,
    arcId,
    slideCount,
    carouselSeed,
    variationSeed,
    researchAngle,
    researchNotes,
    researchSourceUrls,
    researchSourceImageUrls,
    slideUrls,
    slideErrors,
    slideVariationSeeds,
    onSlideResult,
  } = props
  const theme = getFlavorTheme(flavor)
  const arc = getCarouselArc(arcId)

  const urlsKey = (researchSourceUrls ?? []).join('|')
  const imageUrlsKey = (researchSourceImageUrls ?? []).join('|')

  const body = useMemo(
    () => ({
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      arcId,
      carouselSeed,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
      ...(researchAngle ? { researchAngle } : {}),
      ...(researchNotes ? { researchNotes } : {}),
      ...(researchSourceUrls?.length ? { researchSourceUrls } : {}),
      ...(researchSourceImageUrls?.length ? { researchSourceImageUrls } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flavor, hook, caption, pillar, subcategory, arcId, carouselSeed, variationSeed, researchAngle, researchNotes, urlsKey, imageUrlsKey],
  )

  // Seed local state from persisted results so a refresh/remount re-renders
  // instantly without any network.
  const [urls, setUrls] = useState<(string | null)[]>(() => {
    const arr = Array<string | null>(slideCount).fill(null)
    slideUrls?.forEach((u, i) => {
      if (i < slideCount && u) arr[i] = u
    })
    return arr
  })
  const [errors, setErrors] = useState<(string | null)[]>(() => {
    const arr = Array<string | null>(slideCount).fill(null)
    slideErrors?.forEach((e, i) => {
      if (i < slideCount && e) arr[i] = e
    })
    return arr
  })
  // Set of slide indices currently rerolling. Multiple rerolls can be in
  // flight simultaneously — the server semaphore handles fairness.
  const [rerollingIndices, setRerollingIndices] = useState<Set<number>>(() => new Set())
  const [current, setCurrent] = useState(0)
  // Mount-cancel ref — shared by the initial fetch loop and any in-flight reroll,
  // so unmount cancels both.
  const cancelledRef = useRef(false)

  // Keep callback in a ref so the fetch effect doesn't re-fire on parent re-renders.
  const onSlideResultRef = useRef(onSlideResult)
  useEffect(() => {
    onSlideResultRef.current = onSlideResult
  }, [onSlideResult])

  useEffect(() => {
    cancelledRef.current = false
    // Seed state from persisted values.
    const seededUrls: (string | null)[] = Array(slideCount).fill(null)
    const seededErrors: (string | null)[] = Array(slideCount).fill(null)
    slideUrls?.forEach((u, i) => {
      if (i < slideCount && u) seededUrls[i] = u
    })
    slideErrors?.forEach((e, i) => {
      if (i < slideCount && e) seededErrors[i] = e
    })
    setUrls(seededUrls)
    setErrors(seededErrors)
    setRerollingIndices(new Set())
    setCurrent(0)
    const isCancelled = () => cancelledRef.current

    for (let i = 0; i < slideCount; i++) {
      const slideIndex = i
      // GUARD: skip any slot that already has a persisted URL or error.
      // Only unresolved slots fire a fetch. This is the cost-safety invariant.
      if (seededUrls[slideIndex] || seededErrors[slideIndex]) continue

      const slotSeed = slideVariationSeeds?.[slideIndex]
      const fetchBody = {
        ...body,
        slideIndex,
        ...(typeof slotSeed === 'number' ? { variationSeed: slotSeed } : {}),
      }
      fetchSlide(fetchBody, isCancelled).then(({ url, error }) => {
        if (isCancelled()) return
        if (url) {
          setUrls((prev) => {
            const next = prev.slice()
            next[slideIndex] = url
            return next
          })
          onSlideResultRef.current(slideIndex, url, null, slotSeed)
        } else if (error) {
          setErrors((prev) => {
            const next = prev.slice()
            next[slideIndex] = error
            return next
          })
          onSlideResultRef.current(slideIndex, null, error, slotSeed)
        }
      })
    }

    return () => {
      cancelledRef.current = true
    }
    // slideUrls / slideErrors / slideVariationSeeds intentionally NOT in deps —
    // we only re-read them when the underlying brief (body) or slideCount changes.
    // Otherwise a parent-triggered persist would re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, slideCount])

  const handleReroll = (slideIndex: number) => {
    // Idempotent per slide: don't double-fire for the same index, but allow
    // other slides to reroll in parallel.
    if (rerollingIndices.has(slideIndex)) return
    const seed = Math.floor(Math.random() * 100_000)
    // Clear persisted + local state for this slot so the UI shows "regenerating".
    onSlideResultRef.current(slideIndex, null, null, seed)
    setUrls((prev) => {
      const next = prev.slice()
      next[slideIndex] = null
      return next
    })
    setErrors((prev) => {
      const next = prev.slice()
      next[slideIndex] = null
      return next
    })
    setRerollingIndices((prev) => {
      const next = new Set(prev)
      next.add(slideIndex)
      return next
    })

    const isCancelled = () => cancelledRef.current
    fetchSlide({ ...body, slideIndex, variationSeed: seed }, isCancelled).then(({ url, error }) => {
      if (isCancelled()) return
      if (url) {
        setUrls((prev) => {
          const next = prev.slice()
          next[slideIndex] = url
          return next
        })
        onSlideResultRef.current(slideIndex, url, null, seed)
      } else if (error) {
        setErrors((prev) => {
          const next = prev.slice()
          next[slideIndex] = error
          return next
        })
        onSlideResultRef.current(slideIndex, null, error, seed)
      }
      setRerollingIndices((prev) => {
        if (!prev.has(slideIndex)) return prev
        const next = new Set(prev)
        next.delete(slideIndex)
        return next
      })
    })
  }

  const loadedCount = urls.filter((u) => u !== null).length
  const allDone = loadedCount + errors.filter((e) => e !== null).length === slideCount

  const currentUrl = urls[current]
  const currentError = errors[current]
  const currentRole = arc?.slides[current]?.role ?? ''
  const isRerollingCurrent = rerollingIndices.has(current)
  const showRerollButton = (currentUrl !== null || currentError !== null) && !isRerollingCurrent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Main 1:1 square */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
          background: theme.backgroundColor,
        }}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={`Slide ${current + 1} of ${slideCount}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <SlidePlaceholder
            theme={theme}
            error={currentError}
            slideNumber={current + 1}
            slideTotal={slideCount}
            role={currentRole}
            status={currentError ? 'failed' : allDone ? 'unavailable' : 'generating'}
          />
        )}

        {/* Progress ticker while slides are still being generated */}
        {!allDone && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: '0.04em',
            }}
          >
            {loadedCount}/{slideCount} ready
          </div>
        )}

        {/* Slide index badge */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.04em',
          }}
        >
          {current + 1} / {slideCount}
        </div>

        <CarouselLoungeNav
          current={current}
          total={slideCount}
          onPrev={() => setCurrent((s) => Math.max(0, s - 1))}
          onNext={() => setCurrent((s) => Math.min(slideCount - 1, s + 1))}
        />

        {/* Per-slide reroll — keeps other slides untouched; fires one fresh Gemini call */}
        {showRerollButton && (
          <button
            onClick={() => handleReroll(current)}
            title="Regenerate just this slide with a fresh variation (~$0.05)"
            style={{
              position: 'absolute',
              bottom: 24,
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
            🎲 Reroll
          </button>
        )}
      </div>

      {/* Thumbnail strip — all N slides at a glance */}
      <ThumbnailStrip
        urls={urls}
        errors={errors}
        current={current}
        onSelect={setCurrent}
        onReroll={handleReroll}
        rerollingIndices={rerollingIndices}
        theme={theme}
        arcRoles={arc?.slides.map((s) => s.role) ?? []}
      />
    </div>
  )
}

function SlidePlaceholder({
  theme,
  error,
  slideNumber,
  slideTotal,
  role,
  status,
}: {
  theme: ReturnType<typeof getFlavorTheme>
  error: string | null
  slideNumber: number
  slideTotal: number
  role: string
  status: 'generating' | 'failed' | 'unavailable'
}) {
  const statusLabel =
    status === 'failed' ? 'Slide failed' : status === 'unavailable' ? 'Slide unavailable' : 'Generating…'
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
        color: theme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 24,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Big slide position number — dominant, so the user instantly sees which slide this is */}
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: theme.primaryColor,
          opacity: status === 'generating' ? 0.9 : 0.45,
          animation: status === 'generating' ? 'pulse 1.6s ease-in-out infinite' : undefined,
        }}
      >
        {slideNumber}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', opacity: 0.7 }}>
        OF {slideTotal}
      </div>
      {role ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.85,
            marginTop: 4,
            color: theme.accentColor,
          }}
        >
          {role.replace(/-/g, ' ')}
        </div>
      ) : null}
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, marginTop: 2 }}>{statusLabel}</div>
      {error ? (
        <div style={{ fontSize: 10, opacity: 0.55, maxWidth: 260, marginTop: 4 }}>{error}</div>
      ) : null}
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }`}</style>
    </div>
  )
}

function ThumbnailStrip({
  urls,
  errors,
  current,
  onSelect,
  onReroll,
  rerollingIndices,
  theme,
  arcRoles,
}: {
  urls: (string | null)[]
  errors: (string | null)[]
  current: number
  onSelect: (idx: number) => void
  onReroll: (idx: number) => void
  rerollingIndices: Set<number>
  theme: ReturnType<typeof getFlavorTheme>
  arcRoles: string[]
}) {
  return (
    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
      {urls.map((url, idx) => {
        const isCurrent = idx === current
        const isLoaded = url !== null
        const err = errors[idx]
        const role = arcRoles[idx]
        const isRerolling = rerollingIndices.has(idx)
        // Reroll icon only makes sense once the slot is settled (has a url or
        // a persisted error) and isn't mid-reroll already.
        const showRerollIcon = (isLoaded || err !== null) && !isRerolling
        return (
          <div
            key={idx}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(idx)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(idx)
              }
            }}
            title={role ? `${idx + 1}. ${role.replace(/-/g, ' ')}` : `Slide ${idx + 1}`}
            style={{
              flex: 1,
              aspectRatio: '1/1',
              border: isCurrent ? `2px solid ${theme.primaryColor}` : '1px solid rgba(148,163,184,0.25)',
              borderRadius: 6,
              padding: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              background: isLoaded ? 'transparent' : theme.backgroundColor,
              minWidth: 0,
            }}
          >
            {isLoaded ? (
              <img
                src={url!}
                alt={`Slide ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: err ? 'rgba(239,68,68,0.9)' : theme.textColor,
                  fontSize: 14,
                  fontWeight: 800,
                  opacity: err ? 0.8 : 0.9,
                }}
              >
                {isRerolling ? '…' : err ? '!' : idx + 1}
              </div>
            )}
            {showRerollIcon && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onReroll(idx)
                }}
                title={`Reroll slide ${idx + 1} (~$0.05)`}
                aria-label={`Reroll slide ${idx + 1}`}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: 'rgba(251,146,60,0.92)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 10,
                  lineHeight: '20px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              >
                🎲
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CarouselLoungeNav({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <>
      {current > 0 && (
        <button
          onClick={onPrev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: '32px',
            textAlign: 'center',
          }}
        >
          ‹
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={onNext}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: '32px',
            textAlign: 'center',
          }}
        >
          ›
        </button>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>
    </>
  )
}
