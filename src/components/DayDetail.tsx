import { useMemo, useState } from 'react'
import type { ContentItem, DayOfWeek, InstagramFormat, LoggedPost, Platform, ScheduledPost, ViewState } from '../types'
import {
  WEEKLY_CADENCE,
  PLATFORM_EMOJI,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  TIME_RECOMMENDATIONS,
  DAY_THEMES,
  type CadenceEntry,
} from '../data/postingCadence'
import IGSlotPanel from './scheduler/IGSlotPanel'

const DAY_ORDER: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

interface DayDetailProps {
  date: Date
  onBack: () => void
  loggedPosts: LoggedPost[]
  scheduledPosts: ScheduledPost[]
  onSchedule: (post: ScheduledPost) => void
  onUpdateSchedule: (post: ScheduledPost) => void
  onUnschedule: (id: string) => void
  onOpenLab: (lab: ViewState) => void
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayOfWeekName(d: Date): DayOfWeek {
  return DAY_ORDER[(d.getDay() + 6) % 7]
}

function fmtTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')}${period}`
}

function platformToLab(platform: Platform, format?: string): ViewState | null {
  if (platform === 'Instagram') {
    if (format === 'Carousel') return 'carousel-lab'
    if (format === 'Reel') return 'reel-lab'
    return 'image-lab'
  }
  if (platform === 'Email') return 'email-lab'
  if (platform === 'X' || platform === 'Threads' || platform === 'Facebook') return 'text-post-lab'
  return null
}

export default function DayDetail({
  date,
  onBack,
  loggedPosts,
  scheduledPosts,
  onSchedule,
  onUpdateSchedule,
  onUnschedule,
  onOpenLab,
}: DayDetailProps) {
  const dow = dayOfWeekName(date)
  const cadence = WEEKLY_CADENCE[dow]
  const dateKey = isoDate(date)
  const theme = DAY_THEMES[dow]

  const dayLogged = useMemo(
    () => loggedPosts.filter((p) => p.loggedAt && isoDate(new Date(p.loggedAt)) === dateKey),
    [loggedPosts, dateKey],
  )
  const dayScheduled = useMemo(
    () => scheduledPosts.filter((p) => p.date === dateKey),
    [scheduledPosts, dateKey],
  )

  const loggedByPlatform = useMemo(() => {
    const m = new Map<Platform, LoggedPost[]>()
    for (const p of dayLogged) {
      const arr = m.get(p.platform) ?? []
      arr.push(p)
      m.set(p.platform, arr)
    }
    return m
  }, [dayLogged])

  const scheduledBySlot = useMemo(() => {
    // Map keyed by `${platform}|${format ?? ''}|${slotIndex}` for matching to a cadence row.
    const byPlatform = new Map<Platform, ScheduledPost[]>()
    for (const s of dayScheduled) {
      const arr = byPlatform.get(s.platform) ?? []
      arr.push(s)
      byPlatform.set(s.platform, arr)
    }
    return byPlatform
  }, [dayScheduled])

  const totalDemanded = cadence.reduce((s, e) => s + e.count, 0)
  const totalDone = dayLogged.length
  const totalScheduled = dayScheduled.length

  const longDate = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

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
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="btn-glow flex items-center gap-1 px-3 py-2 rounded-xl font-medium text-sm flex-shrink-0"
            style={{
              background: 'rgba(184,164,255,.15)',
              border: '1px solid var(--border)',
              color: '#b8a4ff',
            }}
            aria-label="Back to scheduler"
          >
            <span>←</span>
            <span className="hidden sm:inline">Scheduler</span>
          </button>

          <div className="flex flex-col items-center min-w-0 flex-1">
            <h1 className="text-lg font-bold gradient-text leading-none">
              {longDate}
            </h1>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              {theme}
              {' · '}
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {totalDone}/{totalDemanded}
              </span>
              {' done'}
              {totalScheduled > 0 && (
                <>
                  {' · '}
                  <span style={{ color: '#b8a4ff', fontWeight: 600 }}>
                    {totalScheduled} scheduled
                  </span>
                </>
              )}
            </p>
          </div>

          <div style={{ width: 80 }} />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5 max-w-[1200px] mx-auto flex flex-col gap-3">
        {cadence.map((entry, i) => {
          const slotIndex = cadence.slice(0, i).filter((e) => e.platform === entry.platform).length
          const platformLogged = loggedByPlatform.get(entry.platform) ?? []
          const isDone = platformLogged.length > slotIndex
          const platformScheduled = scheduledBySlot.get(entry.platform) ?? []
          // Best-effort match: format-aware first, fall back to first unmatched scheduled item.
          const matchedScheduled =
            platformScheduled.find((s) => s.format === entry.format)
            ?? platformScheduled[slotIndex]

          return (
            <CadenceCard
              key={`${entry.platform}-${entry.format ?? ''}-${i}`}
              entry={entry}
              slotIndex={slotIndex}
              dateKey={dateKey}
              done={isDone}
              scheduled={matchedScheduled}
              onSchedule={onSchedule}
              onUpdateSchedule={onUpdateSchedule}
              onUnschedule={onUnschedule}
              onOpenLab={onOpenLab}
            />
          )
        })}

        {/* Bonus / unplanned logged posts */}
        {Array.from(loggedByPlatform.entries()).flatMap(([platform, logs]) => {
          const demanded = cadence
            .filter((e) => e.platform === platform)
            .reduce((s, e) => s + e.count, 0)
          const bonus = logs.length - demanded
          if (bonus <= 0) return []
          return [
            <BonusCard
              key={`bonus-${platform}`}
              platform={platform}
              count={bonus}
              unplanned={demanded === 0}
            />,
          ]
        })}

        <Footnote />
      </div>
    </div>
  )
}

interface CadenceCardProps {
  entry: CadenceEntry
  slotIndex: number
  dateKey: string
  done: boolean
  scheduled?: ScheduledPost
  onSchedule: (post: ScheduledPost) => void
  onUpdateSchedule: (post: ScheduledPost) => void
  onUnschedule: (id: string) => void
  onOpenLab: (lab: ViewState) => void
}

function CadenceCard({
  entry, slotIndex, dateKey, done, scheduled, onSchedule, onUpdateSchedule, onUnschedule, onOpenLab,
}: CadenceCardProps) {
  const recs = TIME_RECOMMENDATIONS[entry.platform] ?? []
  const defaultTime = recs[slotIndex] ?? recs[0] ?? '10:00'
  const [time, setTime] = useState<string>(scheduled?.time ?? defaultTime)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showGenerator, setShowGenerator] = useState(Boolean(scheduled?.item))
  const color = PLATFORM_COLOR[entry.platform]
  const labRoute = platformToLab(entry.platform, entry.format)
  const isIG = entry.platform === 'Instagram'
  const igFormat: InstagramFormat | undefined = isIG
    ? (entry.format === 'Carousel' || entry.format === 'Reel' ? entry.format : 'Single Image')
    : undefined

  // Ensures a ScheduledPost exists so generated content can persist. Returns the live record.
  const ensureSchedule = (): ScheduledPost => {
    if (scheduled) return scheduled
    const fresh: ScheduledPost = {
      id: `${dateKey}-${entry.platform}-${entry.format ?? ''}-${Date.now()}`,
      date: dateKey,
      time,
      platform: entry.platform,
      format: entry.format,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    onSchedule(fresh)
    return fresh
  }

  const handleItemChange = (item: ContentItem) => {
    const target = ensureSchedule()
    const wasPosted = !!item.postedToInstagram
    onUpdateSchedule({
      ...target,
      item,
      status: wasPosted ? 'posted' : target.status ?? 'pending',
      postedAt: wasPosted ? new Date().toISOString() : target.postedAt,
    })
  }

  const submitSchedule = () => {
    if (scheduled) {
      onUpdateSchedule({ ...scheduled, time })
    } else {
      onSchedule({
        id: `${dateKey}-${entry.platform}-${entry.format ?? ''}-${Date.now()}`,
        date: dateKey,
        time,
        platform: entry.platform,
        format: entry.format,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    }
    setShowSchedule(false)
  }

  const statusPill = (() => {
    if (done) return null
    if (scheduled?.status === 'posted') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,.12)', color: '#10b981' }}>
          ✓ Posted
        </span>
      )
    }
    if (scheduled?.status === 'failed') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,.12)', color: 'var(--danger)' }}>
          ⚠ Failed
        </span>
      )
    }
    if (scheduled?.item?.generatedVisual) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(184,164,255,.18)', color: '#7c5fff' }}>
          📦 Ready · auto-post {fmtTime12(scheduled.time)}
        </span>
      )
    }
    if (scheduled) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(184,164,255,.10)', color: '#7c5fff' }}>
          🕒 Scheduled · needs content
        </span>
      )
    }
    return null
  })()

  return (
    <section
      className="glass-panel card-enter"
      style={{
        padding: 14,
        borderColor: done ? '#10b98166' : `${color}33`,
        borderWidth: done ? 2 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 44, height: 44,
              background: `${color}1a`,
              border: `1px solid ${color}33`,
              fontSize: 22,
            }}
          >
            {PLATFORM_EMOJI[entry.platform]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold" style={{ color }}>
                {PLATFORM_LABEL[entry.platform]}
              </span>
              {entry.format && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: `${color}1a`, color }}
                >
                  {entry.format}
                </span>
              )}
              {entry.count > 1 && (
                <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                  ×{entry.count}
                </span>
              )}
              {done && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,.12)', color: '#10b981' }}
                >
                  ✓ Posted
                </span>
              )}
              {statusPill}
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
              Recommended: {recs.length > 0 ? recs.map(fmtTime12).join(' · ') : 'flexible'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {scheduled && !done && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{
                background: 'rgba(184,164,255,.18)',
                color: '#7c5fff',
                border: '1px solid #b8a4ff55',
              }}
            >
              <span>🕒</span>
              <span>{fmtTime12(scheduled.time)}</span>
              <button
                onClick={() => onUnschedule(scheduled.id)}
                aria-label="Remove schedule"
                style={{ marginLeft: 4, opacity: 0.7 }}
              >
                ×
              </button>
            </div>
          )}
          {!done && (
            <button
              onClick={() => setShowSchedule((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:scale-105"
              style={{
                background: showSchedule ? 'var(--panel-2)' : 'rgba(184,164,255,.15)',
                color: '#7c5fff',
                border: '1px solid var(--border)',
              }}
            >
              {scheduled ? 'Edit time' : 'Schedule'}
            </button>
          )}
          {isIG && !done && (
            <button
              onClick={() => setShowGenerator((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:scale-105"
              style={{
                background: showGenerator ? 'var(--panel-2)' : color,
                color: showGenerator ? color : '#fff',
                border: showGenerator ? `1px solid ${color}55` : 'none',
                boxShadow: showGenerator ? 'none' : 'var(--shadow-sm)',
              }}
            >
              {showGenerator
                ? 'Hide'
                : scheduled?.item?.generatedVisual
                ? 'Edit content'
                : '✨ Generate'}
            </button>
          )}
          {!isIG && labRoute && !done && (
            <button
              onClick={() => onOpenLab(labRoute)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:scale-105"
              style={{
                background: color,
                color: '#fff',
                border: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Open Lab ↗
            </button>
          )}
        </div>
      </div>

      {showSchedule && !done && (
        <div
          className="mt-3 pt-3 flex flex-wrap items-center gap-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <label className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
            Post at:
          </label>
          {recs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recs.map((r) => (
                <button
                  key={r}
                  onClick={() => setTime(r)}
                  className="px-2 py-1 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    background: time === r ? color : `${color}1a`,
                    color: time === r ? '#fff' : color,
                    border: `1px solid ${color}55`,
                  }}
                >
                  {fmtTime12(r)}
                </button>
              ))}
            </div>
          )}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <button
            onClick={submitSchedule}
            className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
            }}
          >
            {scheduled ? 'Save' : 'Schedule'}
          </button>
        </div>
      )}

      {/* Inline IG generator panel */}
      {isIG && igFormat && showGenerator && !done && (
        <IGSlotPanel
          format={igFormat}
          item={scheduled?.item}
          onChange={handleItemChange}
        />
      )}

      {!isIG && !labRoute && !done && (
        <p className="mt-3 text-[11px] italic" style={{ color: 'var(--muted)' }}>
          No generator wired for this channel yet — schedule the slot and post manually.
        </p>
      )}
      {!isIG && labRoute && !done && (
        <p className="mt-3 text-[11px] italic" style={{ color: 'var(--muted)' }}>
          Inline generator coming soon for this channel — open the Lab to compose, then return to schedule.
        </p>
      )}
    </section>
  )
}

function BonusCard({ platform, count, unplanned }: { platform: Platform; count: number; unplanned: boolean }) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: 12,
        borderStyle: 'dashed',
        borderColor: '#10b98166',
      }}
    >
      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#10b981' }}>
        <span style={{ fontSize: 18 }}>{PLATFORM_EMOJI[platform]}</span>
        <span>
          {unplanned
            ? `${PLATFORM_LABEL[platform]} ×${count} (unplanned)`
            : `+${count} bonus ${PLATFORM_LABEL[platform]}`}
        </span>
      </div>
    </div>
  )
}

function Footnote() {
  return (
    <p className="text-[10px] italic mt-2 text-center" style={{ color: 'var(--muted)' }}>
      Time recommendations are general engagement-window heuristics. Schedules are reminders only —
      posts still need to be sent through the relevant Lab.
    </p>
  )
}
