import { useEffect, useMemo, useRef, useState } from 'react'
import { getFlavorTheme } from '../remotion/flavorThemes'
import type { SpaceApeFlavor } from '../remotion/types'
import { getCarouselArc } from '../data/carouselArcs'
import ImageEditModal from './ImageEditModal'
import { fetchSlide } from './CarouselLoungeVisual/fetchSlide'
import { SlidePlaceholder } from './CarouselLoungeVisual/SlidePlaceholder'
import { ThumbnailStrip } from './CarouselLoungeVisual/ThumbnailStrip'
import CarouselNav from './ui/CarouselNav'
import IconActionButton from './ui/IconActionButton'

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
  // Executable photo brief from the picked seed — replaces the generic
  // shot template in the SHOT BRIEF section of the Gemini prompt.
  // Used as the fallback per-slide prompt when researchSlides isn't set.
  researchShotBrief?: string
  // Research-driven per-slide briefs. When provided (length >= 2), each
  // slide's prompt is its own brief, and slideCount equals slides.length.
  // Supersedes the static carouselArcs.ts template + single shotBrief.
  researchSlides?: { brief: string }[]
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

export default function CarouselLoungeVisual(props: CarouselLoungeVisualProps) {
  const {
    flavor,
    arcId,
    slideCount,
    carouselSeed,
    variationSeed,
    researchShotBrief,
    researchSlides,
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
  const slidesKey = (researchSlides ?? []).map((s) => s.brief).join('|')

  // Per-slide prompt resolution. Research-driven flow: each slide's prompt
  // is its own brief from the selected research result. Legacy flow: all
  // slides share the seed's shotBrief.
  const promptForSlide = (slideIndex: number): string => {
    const slideBrief = researchSlides?.[slideIndex]?.brief
    if (slideBrief) {
      // Concatenate the overall shot brief (when present) with the per-slide
      // direction so cohesion across the arc is preserved while each slide
      // still drives its own beat.
      return researchShotBrief ? `${researchShotBrief}\n\n${slideBrief}` : slideBrief
    }
    return researchShotBrief ?? ''
  }

  // Per-slide variation still comes from slideIndex + carouselSeed in the
  // server's cache key (and from any per-slot variationSeed bumped via reroll).
  // Old fields (flavor/hook/caption/pillar/arcId) are intentionally dropped —
  // server only consumes prompt + slide identity + optional URLs.
  const body = useMemo(
    () => ({
      carouselSeed,
      flavor,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
      ...(researchSourceUrls?.length ? { researchSourceUrls } : {}),
      ...(researchSourceImageUrls?.length ? { researchSourceImageUrls } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flavor, carouselSeed, variationSeed, urlsKey, imageUrlsKey],
  )
  // hasAnyPrompt drives the early-return guard below — at least one slide
  // must have something to send before we kick off any fetches.
  const hasAnyPrompt = Boolean(
    researchShotBrief || (researchSlides && researchSlides.some((s) => s.brief)),
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
  const [editingSlide, setEditingSlide] = useState<number | null>(null)
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

    // Research-only flow: nothing fires until at least one prompt is in hand.
    // Surface this as a per-slide error rather than leaving every slot in the
    // null/null state, which would leave the SlidePlaceholder spinners running
    // forever — the silent-failure UX trap that bit "Write my own" seeds.
    if (!hasAnyPrompt) {
      const msg =
        'No visual brief — pick a research card or add a Visual brief on the custom strategy.'
      const errs: (string | null)[] = Array(slideCount).fill(msg)
      setErrors(errs)
      for (let i = 0; i < slideCount; i++) {
        onSlideResultRef.current(i, null, msg, undefined)
      }
      return () => {
        cancelledRef.current = true
      }
    }

    for (let i = 0; i < slideCount; i++) {
      const slideIndex = i
      // GUARD: skip any slot that already has a persisted URL or error.
      // Only unresolved slots fire a fetch. This is the cost-safety invariant.
      if (seededUrls[slideIndex] || seededErrors[slideIndex]) continue

      const slidePrompt = promptForSlide(slideIndex)
      // Skip slides that have no prompt to send — no point firing an empty call.
      if (!slidePrompt) continue

      const slotSeed = slideVariationSeeds?.[slideIndex]
      const fetchBody = {
        ...body,
        prompt: slidePrompt,
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
  }, [body, slideCount, researchShotBrief, slidesKey, hasAnyPrompt])

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
    const slidePrompt = promptForSlide(slideIndex)
    fetchSlide(
      { ...body, prompt: slidePrompt, slideIndex, variationSeed: seed },
      isCancelled,
    ).then(({ url, error }) => {
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

        <CarouselNav
          size="lg"
          current={current}
          total={slideCount}
          onPrev={() => setCurrent((s) => Math.max(0, s - 1))}
          onNext={() => setCurrent((s) => Math.min(slideCount - 1, s + 1))}
        />

        {/* Per-slide actions: edit (full ImageEditModal) + reroll (instant
            regenerate). Use the same affordance vocabulary as the rest of the
            app — accent color for Edit, amber for Reroll. */}
        {showRerollButton && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              right: 8,
              display: 'flex',
              gap: 6,
            }}
          >
            {currentUrl && (
              <IconActionButton
                icon="✏️"
                label="Edit"
                tone="edit"
                size="md"
                title="Edit just this slide"
                onClick={() => setEditingSlide(current)}
              />
            )}
            <IconActionButton
              icon="🎲"
              label="Reroll"
              tone="reroll"
              size="md"
              title="Regenerate just this slide with a fresh variation (~$0.05)"
              onClick={() => handleReroll(current)}
            />
          </div>
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
      {editingSlide !== null && urls[editingSlide] && (
        <ImageEditModal
          label={`slide ${editingSlide + 1}`}
          imageUrl={urls[editingSlide]!}
          kind="carousel-slide"
          onCancel={() => setEditingSlide(null)}
          onApplied={(newUrl) => {
            const idx = editingSlide
            setUrls((prev) => {
              const next = prev.slice()
              next[idx] = newUrl
              return next
            })
            setErrors((prev) => {
              const next = prev.slice()
              next[idx] = null
              return next
            })
            onSlideResultRef.current(idx, newUrl, null, undefined)
            setEditingSlide(null)
          }}
        />
      )}
    </div>
  )
}
