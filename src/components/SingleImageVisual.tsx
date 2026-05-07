import { useEffect, useMemo, useRef, useState } from 'react'
import { Player } from '@remotion/player'
import { SingleImage } from '../remotion/compositions'
import type { SingleImageProps, SpaceApeFlavor } from '../remotion/types'
import GeneratingPlaceholder from './ui/GeneratingPlaceholder'

// Cast for @remotion/player's LooseComponentType constraint.
const SingleImageComponent = SingleImage as unknown as React.FC<Record<string, unknown>>

interface SingleImageVisualProps {
  flavor: SpaceApeFlavor
  hook: string
  caption: string
  hashtags: string[]
  pillar: string
  subcategory: string
  shotTemplateId?: string
  variationSeed?: number
  // Picked research seed — anchors the visual to a specific trend signal.
  // Forwarded to /api/generate-single-image and into the Gemini prompt's
  // TREND CONTEXT section.
  researchAngle?: string
  researchNotes?: string
  // Executable photo brief from the picked seed — replaces the generic
  // shot template in the SHOT BRIEF section of the Gemini prompt.
  researchShotBrief?: string
  // URLs from the picked seed. Server downloads images from these and
  // uses them as inspo refs in place of the static manifest pool.
  researchSourceUrls?: string[]
  researchSourceImageUrls?: string[]
  // Persisted generation result. If either is defined, the mount-fetch is
  // skipped — that's the core cost-safety invariant: only a click can fire a
  // new /api call (a click clears these via onResult(null, null)).
  imageUrl?: string
  imageError?: string
  onResult: (url: string | null, error: string | null) => void
}

interface GenerateResponse {
  url: string
  cached: boolean
  hash: string
  shotTemplateId?: string
  shotTemplateName?: string
}

const MAX_ATTEMPTS = 2
const RETRY_REGEX = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i
const CREDITS_REGEX = /prepayment credits|RESOURCE_EXHAUSTED.*credit|billing/i

function mapError(raw: string): string {
  if (CREDITS_REGEX.test(raw)) {
    return 'OpenAI credits exhausted — top up at platform.openai.com, then retry.'
  }
  return raw
}

export default function SingleImageVisual(props: SingleImageVisualProps) {
  const {
    flavor,
    hook,
    caption,
    pillar,
    subcategory,
    shotTemplateId,
    variationSeed,
    researchAngle,
    researchNotes,
    researchShotBrief,
    researchSourceUrls,
    researchSourceImageUrls,
    imageUrl,
    imageError,
    onResult,
  } = props

  // Stable join keys for URL arrays — referential identity may change on
  // every render even when the values match, so we hash to strings for
  // useMemo deps.
  const urlsKey = (researchSourceUrls ?? []).join('|')
  const imageUrlsKey = (researchSourceImageUrls ?? []).join('|')

  // Research-only flow: the picked seed's shotBrief IS the prompt sent to
  // the image model. Everything else (flavor, hook, caption, pillar, shot
  // template ids, etc.) is intentionally absent — server expects only the
  // research prompt + optional source URLs + variationSeed.
  const body = useMemo(
    () => ({
      prompt: researchShotBrief ?? '',
      flavor,
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
      ...(researchSourceUrls?.length ? { researchSourceUrls } : {}),
      ...(researchSourceImageUrls?.length ? { researchSourceImageUrls } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flavor, variationSeed, researchShotBrief, urlsKey, imageUrlsKey],
  )

  const [localUrl, setLocalUrl] = useState<string | null>(imageUrl ?? null)
  const [localError, setLocalError] = useState<string | null>(imageError ?? null)
  const cancelledRef = useRef(false)

  // Keep onResult in a ref so the fetch effect doesn't re-fire just because
  // the parent re-rendered with a new inline callback.
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    cancelledRef.current = false
    console.log('[SingleImageVisual] effect', {
      hasImageUrl: !!imageUrl,
      hasImageError: !!imageError,
      promptLen: body.prompt?.length ?? 0,
      bodyKeys: Object.keys(body),
    })
    // Guard: if we already have a persisted result (URL or error), render it
    // and do NOT fire a fetch. This is the whole point of the refactor.
    if (imageUrl) {
      console.log('[SingleImageVisual] guard: persisted imageUrl — skip fetch')
      setLocalUrl(imageUrl)
      setLocalError(null)
      return () => {
        cancelledRef.current = true
      }
    }
    if (imageError) {
      console.log('[SingleImageVisual] guard: persisted imageError — skip fetch:', imageError)
      setLocalUrl(null)
      setLocalError(imageError)
      return () => {
        cancelledRef.current = true
      }
    }

    // Research-only flow: no prompt → no generation. Server would 400 anyway.
    if (!body.prompt) {
      console.log('[SingleImageVisual] guard: empty prompt — skip fetch')
      setLocalUrl(null)
      setLocalError(null)
      return () => {
        cancelledRef.current = true
      }
    }
    console.log('[SingleImageVisual] firing /api/generate-single-image')

    setLocalUrl(null)
    setLocalError(null)

    const PER_ATTEMPT_TIMEOUT_MS = 90_000
    const run = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelledRef.current) return
        const ctrl = new AbortController()
        const timeoutId = window.setTimeout(() => ctrl.abort(), PER_ATTEMPT_TIMEOUT_MS)
        try {
          const r = await fetch('/api/generate-single-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ctrl.signal,
          })
          const data = (await r.json()) as GenerateResponse | { error: string }
          if (cancelledRef.current) return
          if (r.ok && !('error' in data)) {
            setLocalUrl(data.url)
            onResultRef.current(data.url, null)
            return
          }
          const msg = 'error' in data ? data.error : `HTTP ${r.status}`
          // Don't retry on credits-exhausted — it'll fail identically until top-up.
          if (CREDITS_REGEX.test(msg)) {
            const friendly = mapError(msg)
            setLocalError(friendly)
            onResultRef.current(null, friendly)
            return
          }
          const transient = r.status >= 500 || r.status === 429 || RETRY_REGEX.test(msg)
          if (!transient || attempt === MAX_ATTEMPTS) {
            const friendly = mapError(msg)
            setLocalError(friendly)
            onResultRef.current(null, friendly)
            return
          }
        } catch (err) {
          if (cancelledRef.current) return
          const aborted = err instanceof Error && err.name === 'AbortError'
          const msg = aborted
            ? 'Generation timed out — try again.'
            : err instanceof Error
              ? err.message
              : String(err)
          if (attempt === MAX_ATTEMPTS) {
            setLocalError(msg)
            onResultRef.current(null, msg)
            return
          }
        } finally {
          window.clearTimeout(timeoutId)
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    void run()

    return () => {
      cancelledRef.current = true
    }
  }, [body, imageUrl, imageError])

  const playerInputProps: SingleImageProps = {
    flavor,
    hook,
    caption,
    hashtags: props.hashtags,
    pillar,
    subcategory,
    ...(shotTemplateId ? { shotTemplateId } : {}),
    ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    ...(localUrl ? { imageUrl: localUrl } : {}),
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Player
        component={SingleImageComponent}
        compositionWidth={1080}
        compositionHeight={1080}
        durationInFrames={1}
        fps={30}
        style={{ width: '100%', height: '100%' }}
        inputProps={playerInputProps as unknown as Record<string, unknown>}
      />
      {!localUrl &&
        (localError ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              padding: 24,
              textAlign: 'center',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>Generation failed</div>
            <div style={{ fontSize: 12, opacity: 0.9, maxWidth: 360, lineHeight: 1.4 }}>
              {localError}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Click Reroll to try again.</div>
          </div>
        ) : (
          <GeneratingPlaceholder variant="tile" />
        ))}
    </div>
  )
}
