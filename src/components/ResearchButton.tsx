import type { ResearchedSeed, ResearchResult } from '../lib/research/types'

interface ResearchButtonProps {
  loading: boolean
  error: string | null
  result: ResearchResult | null
  // Fired with the recommended seed + the alternate candidates so labs can
  // store them and reuse for Shuffle.
  onResearched: (recommendation: ResearchedSeed, candidates: ResearchedSeed[]) => void
  fetchTrends: () => Promise<ResearchResult | null>
  // Optional override for the button label (Email/Print labs may want
  // "Research email trends" etc).
  label?: string
}

export default function ResearchButton({
  loading,
  error,
  result,
  onResearched,
  fetchTrends,
  label,
}: ResearchButtonProps) {
  const handleClick = async () => {
    const fresh = await fetchTrends()
    if (fresh) {
      onResearched(fresh.recommendation, fresh.candidates)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => void handleClick()}
        disabled={loading}
        className="text-sm font-bold px-5 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          color: 'white',
        }}
      >
        {loading ? '🔭 Researching…' : `🔍 ${label ?? 'Research trends'}`}
      </button>
      {result && !loading && (
        <p
          className="text-[11px] text-center"
          style={{ color: 'var(--muted)', maxWidth: 420 }}
          title={result.recommendation.sourceNotes}
        >
          Inspired by{' '}
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {result.recommendation.sourceBrands.join(', ') || 'admired brands'}
          </span>
          {' — '}
          {result.recommendation.subcategory}
        </p>
      )}
      {error && (
        <p className="text-[11px] text-center" style={{ color: '#fb923c' }}>
          {error}
        </p>
      )}
    </div>
  )
}
