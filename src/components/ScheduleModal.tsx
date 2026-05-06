import { useMemo, useState } from 'react'
import type { Platform, ScheduledPost } from '../types'

interface ScheduleModalProps {
  // Friendly label rendered in the modal header so the user knows what
  // they're scheduling (e.g. "this carousel", "this email").
  label: string
  // Default platform stamped on the ScheduledPost. The modal doesn't change
  // it — just carries it through to the persisted record.
  platform: Platform
  // Slots already taken across upcoming days, used to grey out conflicts.
  // Keyed by 'YYYY-MM-DD HH:mm'.
  takenSlots: Set<string>
  onConfirm: (date: string, time: string) => void
  onCancel: () => void
}

const TIME_SLOTS: ReadonlyArray<{ time: string; label: string }> = [
  { time: '09:00', label: 'Morning' },
  { time: '12:00', label: 'Midday' },
  { time: '15:00', label: 'Afternoon' },
  { time: '18:00', label: 'Evening' },
  { time: '21:00', label: 'Night' },
]

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayLabel(d: Date, today: Date): string {
  const diff = Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return WEEKDAY_NAMES[d.getDay()]
}

export default function ScheduleModal({
  label,
  takenSlots,
  onConfirm,
  onCancel,
}: ScheduleModalProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const days = useMemo(() => {
    const out: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      out.push(d)
    }
    return out
  }, [today])

  const [selectedDate, setSelectedDate] = useState<string>(ymd(days[0]))
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const canConfirm = selectedDate && selectedTime

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 24,
          borderRadius: 24,
          background:
            'linear-gradient(135deg, rgba(29,155,240,0.12), rgba(139,92,246,0.12))',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📅</div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Lock in {label}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>
            Pick a day &amp; vibe. We'll handle the rest.
          </p>
        </div>

        {/* 7-day strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
            marginBottom: 18,
          }}
        >
          {days.map((d) => {
            const key = ymd(d)
            const active = selectedDate === key
            const day = d.getDate()
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className="transition-all"
                style={{
                  padding: '10px 4px',
                  borderRadius: 12,
                  border: active ? '2px solid #1d9bf0' : '1px solid var(--border)',
                  background: active
                    ? 'rgba(29,155,240,0.18)'
                    : 'rgba(148,163,184,0.05)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: active ? '#1d9bf0' : 'var(--muted)',
                  }}
                >
                  {dayLabel(d, today)}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{day}</span>
              </button>
            )
          })}
        </div>

        {/* Time-slot pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            marginBottom: 22,
          }}
        >
          {TIME_SLOTS.map((slot) => {
            const taken = takenSlots.has(`${selectedDate} ${slot.time}`)
            const active = selectedTime === slot.time && !taken
            return (
              <button
                key={slot.time}
                onClick={() => !taken && setSelectedTime(slot.time)}
                disabled={taken}
                title={taken ? 'Already scheduled — pick another' : ''}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  border: active
                    ? '2px solid #8b5cf6'
                    : taken
                      ? '1px dashed var(--border)'
                      : '1px solid var(--border)',
                  background: active
                    ? 'rgba(139,92,246,0.18)'
                    : taken
                      ? 'rgba(148,163,184,0.04)'
                      : 'rgba(148,163,184,0.08)',
                  color: taken ? 'var(--muted)' : 'var(--text)',
                  textDecoration: taken ? 'line-through' : 'none',
                  cursor: taken ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {slot.time === '09:00'
                    ? '☀️'
                    : slot.time === '12:00'
                      ? '🍽️'
                      : slot.time === '15:00'
                        ? '☕'
                        : slot.time === '18:00'
                          ? '🌆'
                          : '🌙'}
                </span>
                <span>{slot.label}</span>
                <span style={{ opacity: 0.6, fontSize: 10 }}>{slot.time}</span>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(148,163,184,0.08)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => canConfirm && onConfirm(selectedDate, selectedTime!)}
            disabled={!canConfirm}
            style={{
              flex: 2,
              padding: '11px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              background: canConfirm
                ? 'linear-gradient(135deg, #1d9bf0, #8b5cf6)'
                : 'rgba(148,163,184,0.15)',
              color: canConfirm ? 'white' : 'var(--muted)',
              border: 'none',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              boxShadow: canConfirm ? '0 6px 18px rgba(139,92,246,0.35)' : 'none',
            }}
          >
            ✨ Schedule it
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper: build the takenSlots set from the existing scheduledPosts list so
// the modal can grey out conflicts. Kept here so labs don't have to know the
// internal key format.
export function buildTakenSlots(scheduledPosts: ScheduledPost[]): Set<string> {
  const taken = new Set<string>()
  for (const s of scheduledPosts) taken.add(`${s.date} ${s.time}`)
  return taken
}
