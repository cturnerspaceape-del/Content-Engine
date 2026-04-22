import { useEffect, useMemo, useState } from 'react'
import { getFlavorTheme } from '../remotion/flavorThemes'
import type { SpaceApeFlavor } from '../remotion/types'

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

const MAX_ATTEMPTS = 2
const RETRY_REGEX = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i

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
      const transient = r.status >= 500 || r.status === 429 || RETRY_REGEX.test(lastErr)
      if (!transient || attempt === MAX_ATTEMPTS) {
        return { url: null, error: lastErr }
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      if (attempt === MAX_ATTEMPTS) return { url: null, error: lastErr }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return { url: null, error: lastErr }
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
  } = props
  const theme = getFlavorTheme(flavor)

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
    }),
    [flavor, hook, caption, pillar, subcategory, arcId, carouselSeed, variationSeed],
  )

  const [urls, setUrls] = useState<(string | null)[]>(() => Array(slideCount).fill(null))
  const [errors, setErrors] = useState<(string | null)[]>(() => Array(slideCount).fill(null))
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let cancelled = false
    setUrls(Array(slideCount).fill(null))
    setErrors(Array(slideCount).fill(null))
    setCurrent(0)
    const isCancelled = () => cancelled

    for (let i = 0; i < slideCount; i++) {
      const slideIndex = i
      fetchSlide({ ...body, slideIndex }, isCancelled).then(({ url, error }) => {
        if (isCancelled()) return
        if (url) {
          setUrls((prev) => {
            const next = prev.slice()
            next[slideIndex] = url
            return next
          })
        } else if (error) {
          setErrors((prev) => {
            const next = prev.slice()
            next[slideIndex] = error
            return next
          })
        }
      })
    }

    return () => {
      cancelled = true
    }
  }, [body, slideCount])

  const loadedCount = urls.filter((u) => u !== null).length
  const allDone = loadedCount + errors.filter((e) => e !== null).length === slideCount

  const currentUrl = urls[current]
  const currentError = errors[current]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: theme.backgroundColor }}>
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
          label={
            currentError
              ? 'Slide failed'
              : allDone
              ? 'Slide unavailable'
              : `Generating slide ${current + 1}/${slideCount}…`
          }
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
          {loadedCount}/{slideCount}
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
    </div>
  )
}

function SlidePlaceholder({
  theme,
  error,
  label,
}: {
  theme: ReturnType<typeof getFlavorTheme>
  error: string | null
  label: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: theme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 40,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: theme.primaryColor,
          opacity: error ? 0.3 : 0.8,
          animation: error ? undefined : 'pulse 1.6s ease-in-out infinite',
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
      {error ? (
        <div style={{ fontSize: 11, opacity: 0.75, maxWidth: 280 }}>{error}</div>
      ) : null}
      <style>{`@keyframes pulse { 0%,100% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } }`}</style>
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
