import { useEffect, useState } from 'react'
import type { ResearchedSeed } from '../../lib/research/types'
import {
  loadSlotResearch,
  saveSlotResearch,
  clearSlotResearch,
  pickedSeed,
  type SlotResearch,
} from '../../lib/research/slotResearch'

// Per-slot research control. Lives inside a CadenceCard's action row, to
// the left of the Schedule button. Three states:
//   - idle: no seeds yet → "🔍 Research" pill.
//   - browsing: 3 cards in a small popover; click one to pick.
//   - locked-in: chip with picked subcategory + "Change" link.
//
// Uses /api/research-trends with format=image because image seeds adapt to
// every format via the existing seed adapters; format here is just a
// trend-signal source, not a constraint on what the slot can be.

interface SlotResearchButtonProps {
  slotKey: string
  onChange?: (picked: ResearchedSeed | null) => void
}

interface ApiResponse {
  recommendation: ResearchedSeed
  candidates: ResearchedSeed[]
  fetchedAt: number
  cached?: boolean
  error?: string
}

export default function SlotResearchButton({ slotKey, onChange }: SlotResearchButtonProps) {
  const [data, setData] = useState<SlotResearch | null>(() => loadSlotResearch(slotKey))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setData(loadSlotResearch(slotKey))
    setError(null)
    setOpen(false)
  }, [slotKey])

  const picked = pickedSeed(data)

  const persist = (next: SlotResearch | null) => {
    if (next === null) {
      clearSlotResearch(slotKey)
      setData(null)
      onChange?.(null)
      return
    }
    saveSlotResearch(slotKey, next)
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
      const next: SlotResearch = { seeds, pickedIdx: -1, fetchedAt: json.fetchedAt }
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
    persist({ ...data, pickedIdx: idx })
    setOpen(false)
  }

  // Locked-in chip (picked seed)
  if (picked && !open) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,.18), rgba(139,92,246,.14))',
            color: '#ec4899',
            border: '1px solid #ec4899aa',
            maxWidth: 220,
          }}
          title={`${picked.angle}\n\nClick to change`}
        >
          <span>⭐</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {picked.subcategory}
          </span>
        </button>
        {open && <Picker data={data} onPick={handlePick} onClose={() => setOpen(false)} onRefresh={() => void fetchSeeds()} loading={loading} error={error} />}
      </>
    )
  }

  // Browsing seeds (have data, none picked OR open=true)
  if (data && data.seeds.length > 0 && open) {
    return (
      <Picker data={data} onPick={handlePick} onClose={() => setOpen(false)} onRefresh={() => void fetchSeeds()} loading={loading} error={error} />
    )
  }

  // Idle — no data fetched yet
  return (
    <>
      <button
        type="button"
        onClick={() => void fetchSeeds()}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,.14), rgba(139,92,246,.10))',
          color: '#ec4899',
          border: '1px solid #ec489955',
        }}
        title="Pull a trend signal for this slot"
      >
        {loading ? '🔭 …' : '🔍 Research'}
      </button>
      {error && (
        <p className="text-[10px]" style={{ color: '#fb923c' }}>
          {error}
        </p>
      )}
    </>
  )
}

interface PickerProps {
  data: SlotResearch | null
  loading: boolean
  error: string | null
  onPick: (idx: number) => void
  onClose: () => void
  onRefresh: () => void
}

function Picker({ data, loading, error, onPick, onClose, onRefresh }: PickerProps) {
  return (
    <div
      className="absolute z-30 rounded-xl shadow-xl"
      style={{
        right: 0,
        top: 'calc(100% + 6px)',
        width: 320,
        maxWidth: 'calc(100vw - 24px)',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: 12,
      }}
      role="dialog"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--muted)' }}
        >
          Pick a trend
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-[10px] font-semibold underline-offset-2 hover:underline disabled:opacity-60"
            style={{ color: 'var(--muted)' }}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-semibold"
            style={{ color: 'var(--muted)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
      {loading && (
        <p className="text-[11px] text-center py-2" style={{ color: 'var(--muted)' }}>
          🔭 Scanning trends…
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {data?.seeds.map((seed, i) => (
          <button
            key={`${seed.subcategory}-${i}`}
            type="button"
            onClick={() => onPick(i)}
            className="text-left rounded-lg px-2.5 py-2 transition-all hover:scale-[1.01]"
            style={{
              background: i === 0 ? 'rgba(236,72,153,.10)' : 'var(--panel-2)',
              border: i === 0 ? '1px solid #ec489966' : '1px solid var(--border)',
              cursor: 'pointer',
            }}
            title={seed.angle}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
              style={{ color: i === 0 ? '#ec4899' : 'var(--muted)' }}
            >
              {i === 0 ? <span>⭐</span> : null}
              <span>{seed.pillar}</span>
            </div>
            <div className="text-[12px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
              {seed.subcategory}
            </div>
            <p
              className="text-[11px] leading-snug mt-0.5"
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
          </button>
        ))}
      </div>
      {error && (
        <p className="text-[10px] mt-2" style={{ color: '#fb923c' }}>
          {error}
        </p>
      )}
    </div>
  )
}
