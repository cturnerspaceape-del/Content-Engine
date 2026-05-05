import { useEffect, useState } from 'react'
import type { ResearchedSeed } from '../../lib/research/types'
import {
  loadDayResearch,
  saveDayResearch,
  clearDayResearch,
  pickedSeed,
  type DayResearch,
} from '../../lib/research/dayResearch'

// Per-day research control. Lives on each Scheduler week-card and on the
// DayDetail header. Three states:
//   - idle: no seeds yet → "🔍 Research" button.
//   - browsing: seeds fetched but none picked → 3 chips, click to pick.
//   - locked-in: chip with picked angle + "Change" link.
//
// Uses /api/research-trends with format=image because image seeds adapt to
// every other format via the existing to{Pillar|Carousel|Text|Email} adapters.
// Storing format='image' here doesn't constrain the day; it's just a generic
// trend-signal source.

interface DayResearchButtonProps {
  dateKey: string // YYYY-MM-DD
  // Notified whenever the picked seed changes (including pick/clear).
  onChange?: (picked: ResearchedSeed | null) => void
  // Compact variant for week-card placement (smaller chip, no full panel).
  compact?: boolean
}

interface ApiResponse {
  recommendation: ResearchedSeed
  candidates: ResearchedSeed[]
  fetchedAt: number
  cached?: boolean
  error?: string
}

export default function DayResearchButton({ dateKey, onChange, compact }: DayResearchButtonProps) {
  const [data, setData] = useState<DayResearch | null>(() => loadDayResearch(dateKey))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setData(loadDayResearch(dateKey))
    setError(null)
    setOpen(false)
  }, [dateKey])

  const picked = pickedSeed(data)

  const persist = (next: DayResearch | null) => {
    if (next === null) {
      clearDayResearch(dateKey)
      setData(null)
      onChange?.(null)
      return
    }
    saveDayResearch(dateKey, next)
    setData(next)
    onChange?.(pickedSeed(next))
  }

  const fetchSeeds = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/research-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'image' }),
      })
      const json = (await r.json()) as ApiResponse
      if (!r.ok || json.error) {
        throw new Error(json.error || `research failed (${r.status})`)
      }
      const seeds = [json.recommendation, ...json.candidates].slice(0, 3)
      const next: DayResearch = { seeds, pickedIdx: -1, fetchedAt: json.fetchedAt }
      persist(next)
      setOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handlePick = (idx: number) => {
    if (!data) return
    const next: DayResearch = { ...data, pickedIdx: idx }
    persist(next)
    setOpen(false)
  }

  const handleClear = () => {
    persist(null)
  }

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
  }

  // Locked-in chip (picked seed)
  if (picked && !open) {
    return (
      <div
        className="flex items-center gap-1.5 flex-wrap"
        onClick={stop}
        onKeyDown={stop}
        role="presentation"
      >
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,.18), rgba(139,92,246,.14))',
            color: '#ec4899',
            border: '1px solid #ec4899aa',
            maxWidth: '100%',
          }}
          title={picked.angle}
        >
          <span>⭐</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {picked.subcategory}
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            stop(e)
            setOpen(true)
          }}
          className="text-[10px] font-semibold underline-offset-2 hover:underline"
          style={{ color: 'var(--muted)' }}
        >
          Change
        </button>
      </div>
    )
  }

  // Browsing seeds (have data, none picked OR open=true)
  if (data && data.seeds.length > 0 && open) {
    return (
      <div
        className="flex flex-col gap-1.5"
        onClick={stop}
        onKeyDown={stop}
        role="presentation"
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--muted)' }}
          >
            Pick one
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                stop(e)
                void fetchSeeds()
              }}
              disabled={loading}
              className="text-[10px] font-semibold underline-offset-2 hover:underline"
              style={{ color: 'var(--muted)' }}
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={(e) => {
                stop(e)
                setOpen(false)
              }}
              className="text-[10px] font-semibold"
              style={{ color: 'var(--muted)' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {data.seeds.map((seed, i) => (
            <button
              key={`${seed.subcategory}-${i}`}
              type="button"
              onClick={(e) => {
                stop(e)
                handlePick(i)
              }}
              className="text-left rounded-lg px-2 py-1.5 transition-all hover:scale-[1.01]"
              style={{
                background: i === 0 ? 'rgba(236,72,153,.10)' : 'var(--panel-2)',
                border:
                  i === 0
                    ? '1px solid #ec489966'
                    : '1px solid var(--border)',
                cursor: 'pointer',
              }}
              title={seed.angle}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                style={{ color: i === 0 ? '#ec4899' : 'var(--muted)' }}
              >
                {i === 0 ? <span>⭐</span> : null}
                <span>{seed.pillar}</span>
              </div>
              <div className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {seed.subcategory}
              </div>
              {!compact && (
                <p
                  className="text-[10px] leading-snug mt-0.5"
                  style={{
                    color: 'var(--text)',
                    opacity: 0.75,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {seed.angle}
                </p>
              )}
            </button>
          ))}
        </div>
        {error && (
          <p className="text-[10px]" style={{ color: '#fb923c' }}>
            {error}
          </p>
        )}
        {data && data.pickedIdx < 0 && (
          <button
            type="button"
            onClick={(e) => {
              stop(e)
              handleClear()
            }}
            className="text-[10px] font-semibold underline-offset-2 hover:underline self-start"
            style={{ color: 'var(--muted)' }}
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  // Idle — no data fetched yet
  return (
    <div onClick={stop} onKeyDown={stop} role="presentation">
      <button
        type="button"
        onClick={(e) => {
          stop(e)
          void fetchSeeds()
        }}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,.14), rgba(139,92,246,.10))',
          color: '#ec4899',
          border: '1px solid #ec489955',
        }}
        title="Pull trend signal for this day"
      >
        {loading ? '🔭 Scanning…' : '🔍 Research'}
      </button>
      {error && (
        <p className="text-[10px] mt-1" style={{ color: '#fb923c' }}>
          {error}
        </p>
      )}
    </div>
  )
}
