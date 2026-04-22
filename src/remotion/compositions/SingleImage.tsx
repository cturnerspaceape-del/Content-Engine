import { AbsoluteFill, Img, continueRender, delayRender } from 'remotion'
import { useEffect, useMemo, useState } from 'react'
import type { SingleImageProps } from '../types'
import { getFlavorTheme } from '../flavorThemes'

interface GenerateResponse {
  url: string
  cached: boolean
  hash: string
  shotTemplateId?: string
  shotTemplateName?: string
}

export default function SingleImage(props: SingleImageProps) {
  const { flavor, hook, caption, pillar, subcategory, shotTemplateId, variationSeed } = props
  const theme = getFlavorTheme(flavor)

  const body = useMemo(
    () => ({
      flavor,
      hook,
      caption,
      pillar,
      subcategory,
      ...(shotTemplateId ? { shotTemplateId } : {}),
      ...(typeof variationSeed === 'number' ? { variationSeed } : {}),
    }),
    [flavor, hook, caption, pillar, subcategory, shotTemplateId, variationSeed],
  )

  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [handle] = useState(() =>
    delayRender('generate-single-image', { timeoutInMilliseconds: 60_000 }),
  )

  useEffect(() => {
    let cancelled = false
    const MAX_ATTEMPTS = 2
    const RETRY_REGEX = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i

    async function attemptFetch(): Promise<void> {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelled) return
        try {
          const r = await fetch('/api/generate-single-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = (await r.json()) as GenerateResponse | { error: string }
          if (cancelled) return
          if (r.ok && !('error' in data)) {
            setUrl(data.url)
            return
          }
          const msg = 'error' in data ? data.error : `HTTP ${r.status}`
          const transient = r.status >= 500 || r.status === 429 || RETRY_REGEX.test(msg)
          if (!transient || attempt === MAX_ATTEMPTS) {
            setError(msg)
            return
          }
        } catch (err) {
          if (cancelled) return
          const msg = err instanceof Error ? err.message : String(err)
          if (attempt === MAX_ATTEMPTS) {
            setError(msg)
            return
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    attemptFetch().finally(() => {
      if (!cancelled) continueRender(handle)
    })

    return () => {
      cancelled = true
    }
  }, [body, handle])

  return (
    <AbsoluteFill style={{ background: theme.backgroundColor }}>
      {url ? (
        <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <LoadingState theme={theme} error={error} />
      )}
    </AbsoluteFill>
  )
}

function LoadingState({
  theme,
  error,
}: {
  theme: ReturnType<typeof getFlavorTheme>
  error: string | null
}) {
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24,
        color: theme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 80,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: theme.primaryColor,
          opacity: error ? 0.3 : 0.8,
          animation: error ? undefined : 'pulse 1.6s ease-in-out infinite',
        }}
      />
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '0.04em' }}>
        {error ? 'Generation failed' : 'Generating image…'}
      </div>
      {error ? (
        <div style={{ fontSize: 16, opacity: 0.8, maxWidth: 600 }}>{error}</div>
      ) : null}
      <style>{`@keyframes pulse { 0%,100% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } }`}</style>
    </AbsoluteFill>
  )
}
