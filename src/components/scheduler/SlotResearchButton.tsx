import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
// The picker renders through a React portal anchored to the trigger
// button's bounding rect, so it floats above sibling cards and any
// stacking context the action row sits inside.
//
// Uses /api/research-trends with format=image because image seeds adapt to
// every format via the existing seed adapters; format here is just a
// trend-signal source, not a constraint on what the slot can be.

interface SlotResearchButtonProps {
  slotKey: string
  onChange?: (picked: ResearchedSeed | null) => void
  // Research format passed to /api/research-trends. Defaults to 'image'
  // because image seeds adapt to every visual format. Email cadence cards
  // override to 'email' so the prompt scopes to lifecycle email signal.
  format?: 'image' | 'carousel' | 'text' | 'email' | 'print'
  // Only meaningful when format === 'email'. Tells the prompt to narrow
  // research to a specific email type (promo, newsletter, etc.).
  emailType?: string
}

interface ApiResponse {
  recommendation: ResearchedSeed
  candidates: ResearchedSeed[]
  fetchedAt: number
  cached?: boolean
  error?: string
}

export default function SlotResearchButton({
  slotKey,
  onChange,
  format = 'image',
  emailType,
}: SlotResearchButtonProps) {
  const [data, setData] = useState<SlotResearch | null>(() => loadSlotResearch(slotKey))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setData(loadSlotResearch(slotKey))
    setError(null)
    setOpen(false)
  }, [slotKey])

  // When emailType switches under us (user changed the dropdown), prior
  // seeds were generated for a different type — drop them so the next
  // Research click pulls fresh signal scoped to the new type.
  const prevEmailTypeRef = useRef<string | undefined>(emailType)
  useEffect(() => {
    if (prevEmailTypeRef.current !== emailType) {
      prevEmailTypeRef.current = emailType
      clearSlotResearch(slotKey)
      setData(null)
      setError(null)
      setOpen(false)
      onChange?.(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailType, slotKey])

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

  const fetchSeeds = async (forceRefresh = false) => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      // slotKey scopes the server-side cache so each slot on the day gets
      // its own LLM call. forceRefresh adds a nonce that bypasses the cache
      // entirely — wired to the picker's 🔄 Refresh button.
      const body: Record<string, unknown> = { format, slotKey }
      if (format === 'email' && emailType) body.emailType = emailType
      if (forceRefresh) body.nonce = Date.now()
      const r = await fetch('/api/research-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const showPicker = open && data != null && data.seeds.length > 0

  return (
    <>
      {picked ? (
        <button
          ref={triggerRef}
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
      ) : (
        <button
          ref={triggerRef}
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
      )}
      {error && !showPicker && (
        <p className="text-[10px]" style={{ color: '#fb923c' }}>
          {error}
        </p>
      )}
      {showPicker && (
        <Picker
          data={data}
          loading={loading}
          error={error}
          anchor={triggerRef.current}
          onPick={handlePick}
          onClose={() => setOpen(false)}
          onRefresh={() => void fetchSeeds(true)}
        />
      )}
    </>
  )
}

interface PickerProps {
  data: SlotResearch | null
  loading: boolean
  error: string | null
  anchor: HTMLButtonElement | null
  onPick: (idx: number) => void
  onClose: () => void
  onRefresh: () => void
}

function Picker({ data, loading, error, anchor, onPick, onClose, onRefresh }: PickerProps) {
  const [pos, setPos] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
  } | null>(null)

  useLayoutEffect(() => {
    if (!anchor) return
    const update = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 12
      const width = Math.min(320, window.innerWidth - margin * 2)
      // On phone, center horizontally — the wrapped action row makes the
      // trigger position unreliable, so anchoring to it pushes the picker
      // off-screen. Desktop keeps the trigger-anchored right alignment.
      const isPhone = window.innerWidth < 640
      const left = isPhone
        ? Math.max(margin, (window.innerWidth - width) / 2)
        : Math.max(
            margin,
            Math.min(rect.right - width, window.innerWidth - width - margin),
          )
      const top = rect.bottom + 6
      // Cap height so the picker fits between the trigger and the bottom
      // edge — the inner card list scrolls when content exceeds this.
      const maxHeight = Math.max(200, window.innerHeight - top - margin)
      setPos({ top, left, width, maxHeight })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchor])

  // Dismiss on click outside the picker (and the trigger).
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchor && anchor.contains(target)) return
      const picker = document.getElementById('slot-research-picker')
      if (picker && picker.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [anchor, onClose])

  if (!pos) return null

  return createPortal(
    <div
      id="slot-research-picker"
      className="fixed rounded-xl shadow-xl"
      style={{
        zIndex: 50,
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        display: 'flex',
        flexDirection: 'column',
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
      <div
        className="flex flex-col gap-1.5"
        style={{
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
        }}
      >
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
    </div>,
    document.body,
  )
}
