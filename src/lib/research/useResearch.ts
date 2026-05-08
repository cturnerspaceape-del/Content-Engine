import { useCallback, useEffect, useState } from 'react'
import type { ResearchFormat, ResearchResult } from './types'

const TTL_MS = 24 * 60 * 60 * 1000

export interface ResearchScope {
  // EmailLab passes the user-selected email type so research is scoped to
  // that category. Switching types resets the result so the panel returns
  // to its idle CTA for the new scope.
  emailType?: string
  // Recent style/voice anchor (e.g. last few subject lines + section kinds).
  // Hashed server-side and folded into the cache key.
  historicalContext?: string
}

interface UseResearchReturn {
  result: ResearchResult | null
  loading: boolean
  error: string | null
  stale: boolean
  fetchTrends: (scope?: ResearchScope) => Promise<ResearchResult | null>
  clear: () => void
}

export function useResearch(format: ResearchFormat, scope?: ResearchScope): UseResearchReturn {
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when the scope changes (e.g. EmailLab switches from promo to
  // newsletter) so the panel lands on its idle CTA for the new scope
  // instead of showing the previous scope's seeds.
  const scopeKey = format === 'email' ? `email:${scope?.emailType ?? ''}` : format
  useEffect(() => {
    setResult(null)
    setError(null)
  }, [scopeKey])

  const fetchTrends = useCallback(
    async (callScope?: ResearchScope): Promise<ResearchResult | null> => {
      if (loading) return result
      setLoading(true)
      setError(null)
      try {
        const merged: ResearchScope = { ...scope, ...callScope }
        const resp = await fetch('/api/research-trends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format,
            emailType: merged.emailType,
            historicalContext: merged.historicalContext,
          }),
        })
        const data = (await resp.json().catch(() => ({}))) as
          | (ResearchResult & { error?: string })
          | { error: string }
        if (!resp.ok || ('error' in data && data.error)) {
          const msg = ('error' in data && data.error) || `research failed (${resp.status})`
          throw new Error(msg)
        }
        const fresh = data as ResearchResult
        setResult(fresh)
        return fresh
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [format, loading, result, scope],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  const stale = Boolean(result && Date.now() - result.fetchedAt > TTL_MS)

  return { result, loading, error, stale, fetchTrends, clear }
}
