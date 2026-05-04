import { useCallback, useState } from 'react'
import { usePersistedState } from '../../utils/persistedState'
import type { ResearchFormat, ResearchResult } from './types'

const TTL_MS = 24 * 60 * 60 * 1000

interface UseResearchReturn {
  result: ResearchResult | null
  loading: boolean
  error: string | null
  // True when result exists but is older than TTL_MS — UI can show a "refresh"
  // affordance. fetchTrends() forces a new call regardless of staleness.
  stale: boolean
  fetchTrends: () => Promise<ResearchResult | null>
  clear: () => void
}

export function useResearch(format: ResearchFormat): UseResearchReturn {
  const [result, setResult] = usePersistedState<ResearchResult | null>(
    `sl:research:${format}`,
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async (): Promise<ResearchResult | null> => {
    if (loading) return result
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/research-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      const data = (await resp.json().catch(() => ({}))) as
        | (ResearchResult & { error?: string })
        | { error: string }
      if (!resp.ok || 'error' in data && data.error) {
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
  }, [format, loading, result, setResult])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [setResult])

  const stale = Boolean(result && Date.now() - result.fetchedAt > TTL_MS)

  return { result, loading, error, stale, fetchTrends, clear }
}
