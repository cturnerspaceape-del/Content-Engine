import { useCallback, useEffect, useState } from 'react'
import type { ResearchFormat, ResearchResult } from './types'

const TTL_MS = 24 * 60 * 60 * 1000

export interface ResearchScope {
  // EmailLab passes the user-selected email type so research is scoped to
  // that category. Changing types re-reads under a different storage key.
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

// Per-scope storage key so different email types cache independently and
// switching scopes re-reads from the right slot.
function storageKey(format: ResearchFormat, scope?: ResearchScope): string {
  if (format === 'email' && scope?.emailType) {
    return `sl:research:email:${scope.emailType}`
  }
  return `sl:research:${format}`
}

function readResult(key: string): ResearchResult | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as ResearchResult
  } catch {
    return null
  }
}

export function useResearch(format: ResearchFormat, scope?: ResearchScope): UseResearchReturn {
  const key = storageKey(format, scope)
  const [result, setResult] = useState<ResearchResult | null>(() => readResult(key))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When the scope-derived storage key changes (e.g. EmailLab switches from
  // promo to newsletter), re-read the slot for that scope so the panel shows
  // the right cached result without a refresh.
  useEffect(() => {
    setResult(readResult(key))
    setError(null)
  }, [key])

  // Persist whenever result changes for the current key.
  useEffect(() => {
    try {
      if (result) {
        localStorage.setItem(key, JSON.stringify(result))
      } else {
        localStorage.removeItem(key)
      }
    } catch {
      // storage full or unavailable — non-fatal
    }
  }, [key, result])

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
