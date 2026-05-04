import { useMemo, useState } from 'react'
import type { DayOfWeek, LoggedPost, Platform } from '../types'
import {
  WEEKLY_CADENCE,
  PLATFORM_EMOJI,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  totalDemandForDay,
  type CadenceEntry,
} from '../data/postingCadence'

const DAY_ORDER: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]
const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

type Mode = 'week' | 'month'

interface SchedulerProps {
  onBack: () => void
  loggedPosts: LoggedPost[]
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d)
  const dow = c.getDay() // 0 Sun .. 6 Sat
  const diff = (dow + 6) % 7 // days since Monday
  c.setDate(c.getDate() - diff)
  return c
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

function dayOfWeekName(d: Date): DayOfWeek {
  return DAY_ORDER[(d.getDay() + 6) % 7]
}

function isoDate(d: Date): string {
  // local YYYY-MM-DD
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b)
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function weekRangeLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = sameMonth
    ? end.toLocaleDateString('en-US', { day: 'numeric' })
    : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startStr} – ${endStr}`
}

function monthMatrix(anchor: Date): Date[][] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  const gridEndCandidate = addDays(startOfWeek(last), 6)
  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= gridEndCandidate) {
    const row: Date[] = []
    for (let i = 0; i < 7; i++) row.push(addDays(cursor, i))
    weeks.push(row)
    cursor = addDays(cursor, 7)
  }
  return weeks
}

interface PostsByDate {
  [iso: string]: LoggedPost[]
}

function groupPostsByDate(posts: LoggedPost[]): PostsByDate {
  const out: PostsByDate = {}
  for (const p of posts) {
    if (!p.loggedAt) continue
    const d = new Date(p.loggedAt)
    if (Number.isNaN(d.getTime())) continue
    const key = isoDate(d)
    ;(out[key] ||= []).push(p)
  }
  return out
}

function countByPlatform(posts: LoggedPost[]): Map<Platform, number> {
  const m = new Map<Platform, number>()
  for (const p of posts) m.set(p.platform, (m.get(p.platform) ?? 0) + 1)
  return m
}

export default function Scheduler({ onBack, loggedPosts }: SchedulerProps) {
  const [mode, setMode] = useState<Mode>('week')
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()))

  const today = startOfDay(new Date())
  const postsByDate = useMemo(() => groupPostsByDate(loggedPosts), [loggedPosts])

  const weekStart = startOfWeek(anchor)
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const monthDates = useMemo(() => monthMatrix(anchor), [anchor])

  const totals = useMemo(() => {
    const dates = mode === 'week'
      ? weekDates
      : monthDates.flat().filter((d) => d.getMonth() === anchor.getMonth())
    let demanded = 0
    let completed = 0
    for (const d of dates) {
      demanded += totalDemandForDay(dayOfWeekName(d))
      const posts = postsByDate[isoDate(d)] ?? []
      completed += posts.length
    }
    return { demanded, completed }
  }, [mode, weekDates, monthDates, anchor, postsByDate])

  const stepBack = () => {
    if (mode === 'week') setAnchor((a) => addDays(a, -7))
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))
  }
  const stepForward = () => {
    if (mode === 'week') setAnchor((a) => addDays(a, 7))
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))
  }
  const goToday = () => setAnchor(startOfDay(new Date()))

  const headerLabel = mode === 'week' ? weekRangeLabel(weekStart) : monthLabel(anchor)

  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Header */}
      <div
        className="glass-panel fade-in"
        style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backdropFilter: 'saturate(180%) blur(10px)',
          background: 'rgba(255,255,255,.85)',
        }}
      >
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="btn-glow flex items-center gap-1 px-3 py-2 rounded-xl font-medium text-sm flex-shrink-0"
            style={{
              background: 'rgba(184,164,255,.15)',
              border: '1px solid var(--border)',
              color: '#b8a4ff',
            }}
            aria-label="Back"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex flex-col items-center min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 22 }}>📅</span>
              <h1 className="text-xl font-bold gradient-text leading-none">Scheduler</h1>
            </div>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              {headerLabel}
              {' · '}
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {totals.completed}/{totals.demanded}
              </span>
              {' '}done
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        </div>

        {/* Sub-nav: prev / today / next */}
        <div className="px-4 pb-3 max-w-[1800px] mx-auto flex items-center justify-center gap-2">
          <NavButton onClick={stepBack} label="‹" />
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(184,164,255,.18)',
              color: '#7c5fff',
              border: '1px solid var(--border)',
            }}
          >
            Today
          </button>
          <NavButton onClick={stepForward} label="›" />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5 max-w-[1800px] mx-auto">
        {mode === 'week' ? (
          <WeekView
            weekDates={weekDates}
            today={today}
            postsByDate={postsByDate}
          />
        ) : (
          <MonthView
            weeks={monthDates}
            anchorMonth={anchor.getMonth()}
            today={today}
            postsByDate={postsByDate}
            onPickDay={(d) => { setAnchor(d); setMode('week') }}
          />
        )}

        <Legend />
      </div>
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const opt = (m: Mode, label: string) => (
    <button
      onClick={() => onChange(m)}
      className="px-3 py-1.5 text-xs font-bold transition-all duration-150"
      style={{
        background: mode === m ? '#b8a4ff' : 'transparent',
        color: mode === m ? '#fff' : 'var(--muted)',
        border: 'none',
      }}
    >
      {label}
    </button>
  )
  return (
    <div
      className="flex rounded-full overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {opt('week', 'Week')}
      {opt('month', 'Month')}
    </div>
  )
}

function NavButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full text-base font-bold transition-all duration-200 hover:scale-110"
      style={{
        background: 'var(--panel-2)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
      }}
    >
      {label}
    </button>
  )
}

interface WeekViewProps {
  weekDates: Date[]
  today: Date
  postsByDate: PostsByDate
}

function WeekView({ weekDates, today, postsByDate }: WeekViewProps) {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-7">
      {weekDates.map((d) => {
        const dow = dayOfWeekName(d)
        const cadence = WEEKLY_CADENCE[dow]
        const posts = postsByDate[isoDate(d)] ?? []
        const counts = countByPlatform(posts)
        const isToday = sameDay(d, today)
        return (
          <section
            key={isoDate(d)}
            className="glass-panel card-enter"
            style={{
              padding: 12,
              borderColor: isToday ? '#b8a4ff' : undefined,
              borderWidth: isToday ? 2 : undefined,
            }}
          >
            <DayHeader date={d} isToday={isToday} />
            <div className="flex flex-row flex-wrap md:flex-col gap-1.5 mt-2">
              {cadence.map((entry, i) => (
                <DemandPill
                  key={`${entry.platform}-${entry.format ?? ''}-${i}`}
                  entry={entry}
                  loggedCount={counts.get(entry.platform) ?? 0}
                  // Each pill claims one slot of the demanded count for that platform.
                  pillIndex={cadence.slice(0, i).filter((e) => e.platform === entry.platform).length}
                />
              ))}
              {Array.from(counts.entries()).map(([platform, n]) => {
                const demanded = cadence
                  .filter((e) => e.platform === platform)
                  .reduce((s, e) => s + e.count, 0)
                const bonus = n - demanded
                if (bonus <= 0) return null
                return (
                  <BonusPill key={`bonus-${platform}`} platform={platform} count={bonus} />
                )
              })}
              {Array.from(counts.entries()).map(([platform, n]) => {
                const demanded = cadence
                  .filter((e) => e.platform === platform)
                  .reduce((s, e) => s + e.count, 0)
                if (demanded > 0) return null
                return (
                  <BonusPill key={`unplanned-${platform}`} platform={platform} count={n} unplanned />
                )
              })}
            </div>
            <DayFooter cadence={cadence} posts={posts} />
          </section>
        )
      })}
    </div>
  )
}

function DayHeader({ date, isToday }: { date: Date; isToday: boolean }) {
  const dow = dayOfWeekName(date)
  const fullDay = date.toLocaleDateString('en-US', { weekday: 'long' })
  return (
    <div
      className="flex items-center justify-between gap-2"
      style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}
    >
      {/* Mobile: inline day name + date. Desktop: stacked short label + big date. */}
      <div className="flex items-baseline gap-2 md:block">
        <div
          className="text-sm md:text-[11px] font-bold tracking-wide"
          style={{ color: 'var(--muted)' }}
        >
          <span className="md:hidden">{fullDay}</span>
          <span className="hidden md:inline">{DAY_SHORT[dow].toUpperCase()}</span>
        </div>
        <div
          className="text-xl md:text-2xl font-extrabold leading-none"
          style={{ color: isToday ? '#b8a4ff' : 'var(--text)' }}
        >
          {date.getDate()}
        </div>
      </div>
      {isToday && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: '#b8a4ff', color: '#fff' }}
        >
          TODAY
        </span>
      )}
    </div>
  )
}

interface DemandPillProps {
  entry: CadenceEntry
  loggedCount: number
  pillIndex: number
}

function DemandPill({ entry, loggedCount, pillIndex }: DemandPillProps) {
  // This pill's slot is "done" if the running logged count covers it.
  const done = loggedCount > pillIndex
  const color = PLATFORM_COLOR[entry.platform]
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs md:text-[11px] font-bold whitespace-nowrap"
      style={{
        background: done ? 'rgba(16,185,129,.10)' : `${color}1a`,
        color: done ? '#10b981' : color,
        border: `1px solid ${done ? '#10b98155' : color + '33'}`,
        opacity: done ? 0.85 : 1,
      }}
    >
      <span style={{ fontSize: 14 }}>{PLATFORM_EMOJI[entry.platform]}</span>
      <span style={{ textDecoration: done ? 'line-through' : undefined }}>
        {PLATFORM_LABEL[entry.platform]}
        {entry.count > 1 ? ` ×${entry.count}` : ''}
        {entry.format ? ` · ${entry.format}` : ''}
      </span>
      {done && <span style={{ marginLeft: 4 }}>✓</span>}
    </div>
  )
}

function BonusPill({ platform, count, unplanned }: { platform: Platform; count: number; unplanned?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs md:text-[11px] font-bold whitespace-nowrap"
      style={{
        background: 'rgba(16,185,129,.06)',
        color: '#10b981',
        border: '1px dashed #10b98166',
      }}
    >
      <span style={{ fontSize: 14 }}>{PLATFORM_EMOJI[platform]}</span>
      <span>
        {unplanned ? `${PLATFORM_LABEL[platform]} ×${count} (extra)` : `+${count} bonus ${PLATFORM_LABEL[platform]}`}
      </span>
    </div>
  )
}

function DayFooter({ cadence, posts }: { cadence: CadenceEntry[]; posts: LoggedPost[] }) {
  const demanded = cadence.reduce((s, e) => s + e.count, 0)
  const done = Math.min(posts.length, demanded)
  return (
    <div className="text-[10px] mt-2 font-bold" style={{ color: 'var(--muted)', textAlign: 'right' }}>
      {done}/{demanded} done
    </div>
  )
}

interface MonthViewProps {
  weeks: Date[][]
  anchorMonth: number
  today: Date
  postsByDate: PostsByDate
  onPickDay: (d: Date) => void
}

function MonthView({ weeks, anchorMonth, today, postsByDate, onPickDay }: MonthViewProps) {
  return (
    <div>
      <div
        className="grid mb-2"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}
      >
        {DAY_ORDER.map((d) => (
          <div
            key={d}
            className="text-[10px] font-bold tracking-wider text-center"
            style={{ color: 'var(--muted)' }}
          >
            {DAY_SHORT[d].toUpperCase()}
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}
      >
        {weeks.flat().map((d) => {
          const inMonth = d.getMonth() === anchorMonth
          const dow = dayOfWeekName(d)
          const demanded = totalDemandForDay(dow)
          const posts = postsByDate[isoDate(d)] ?? []
          const done = posts.length
          const isToday = sameDay(d, today)
          const ratio = demanded > 0 ? Math.min(done / demanded, 1) : 0
          return (
            <button
              key={isoDate(d)}
              onClick={() => onPickDay(d)}
              className="text-left card-enter glass-panel transition-all duration-150 hover:scale-[1.02]"
              style={{
                padding: 8,
                opacity: inMonth ? 1 : 0.4,
                borderColor: isToday ? '#b8a4ff' : undefined,
                borderWidth: isToday ? 2 : undefined,
                minHeight: 78,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-extrabold"
                  style={{ color: isToday ? '#b8a4ff' : 'var(--text)' }}
                >
                  {d.getDate()}
                </span>
                {isToday && (
                  <span
                    className="text-[8px] font-bold px-1 py-0.5 rounded-full"
                    style={{ background: '#b8a4ff', color: '#fff' }}
                  >
                    TODAY
                  </span>
                )}
              </div>
              {inMonth && (
                <>
                  <div className="text-[10px] mt-1 font-bold" style={{ color: 'var(--muted)' }}>
                    {done}/{demanded}
                  </div>
                  <div
                    className="mt-1 rounded-full overflow-hidden"
                    style={{ height: 4, background: 'var(--panel-2)' }}
                  >
                    <div
                      style={{
                        width: `${ratio * 100}%`,
                        height: '100%',
                        background: ratio >= 1 ? '#10b981' : '#b8a4ff',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Legend() {
  const platforms: Platform[] = ['Instagram', 'Facebook', 'Threads', 'X', 'Email']
  return (
    <div
      className="mt-6 glass-panel p-3 flex flex-wrap items-center gap-x-4 gap-y-2 justify-center"
      style={{ fontSize: 11, color: 'var(--muted)' }}
    >
      <span style={{ fontWeight: 700 }}>Channels:</span>
      {platforms.map((p) => (
        <span key={p} className="flex items-center gap-1">
          <span>{PLATFORM_EMOJI[p]}</span>
          <span style={{ color: PLATFORM_COLOR[p], fontWeight: 700 }}>{PLATFORM_LABEL[p]}</span>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Done</span>
      </span>
      <span className="flex items-center gap-1" style={{ color: '#10b981' }}>
        <span style={{ fontWeight: 700 }}>+ Bonus</span>
      </span>
    </div>
  )
}
