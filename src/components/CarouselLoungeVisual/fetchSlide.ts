interface SlideResponse {
  url: string
  cached: boolean
  hash: string
  shotTemplateId?: string
  shotTemplateName?: string
  slideIndex: number
  slideRole?: string
}

export const MAX_ATTEMPTS = 3
export const RETRY_REGEX = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i
export const CREDITS_REGEX = /prepayment credits|RESOURCE_EXHAUSTED.*credit|billing/i
export const PER_SLIDE_TIMEOUT_MS = 90_000

export function mapError(raw: string): string {
  if (CREDITS_REGEX.test(raw)) {
    return 'Gemini prepayment credits exhausted — top up at ai.studio/projects, then retry.'
  }
  return raw
}

export async function fetchSlide(
  body: Record<string, unknown>,
  isCancelled: () => boolean,
): Promise<{ url: string | null; error: string | null }> {
  let lastErr = 'generation failed'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (isCancelled()) return { url: null, error: null }
    const ctrl = new AbortController()
    const timeoutId = window.setTimeout(() => ctrl.abort(), PER_SLIDE_TIMEOUT_MS)
    try {
      const r = await fetch('/api/generate-carousel-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
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
      const aborted = err instanceof Error && err.name === 'AbortError'
      lastErr = aborted
        ? 'Slide timed out — click Reroll to try again.'
        : err instanceof Error
          ? err.message
          : String(err)
      if (attempt === MAX_ATTEMPTS) return { url: null, error: mapError(lastErr) }
    } finally {
      window.clearTimeout(timeoutId)
    }
    // Exponential backoff so queued slides have room to breathe under load.
    const backoff = 1000 * Math.pow(2, attempt - 1)
    await new Promise((resolve) => setTimeout(resolve, backoff))
  }
  return { url: null, error: mapError(lastErr) }
}
