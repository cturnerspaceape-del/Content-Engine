import { useState, useCallback } from 'react'
import { generateWeeklyInstagramContent, generateRandomPost } from '../data/instagramContentGenerator'
import { generateContentForPost } from '../data/instagramContentTemplates'
import type { ContentItem, DayContent, DayOfWeek, LoggedPost, PostDestination } from '../types'
import ContentCard from './ContentCard'
import { postItemToSocials } from '../lib/postToInstagram'

// Carousels can't be Stories (Graph API limitation). Everything else can.
function allowedDestinationsFor(item: ContentItem): PostDestination[] {
  const format = item.generatedVisual?.format
  if (format === 'Carousel') return ['feed']
  return ['feed', 'story']
}

interface WeeklyCalendarProps {
  onBack: () => void
  onLogPost: (post: LoggedPost) => void
  onViewLog: () => void
  loggedCount: number
}

const DAY_LETTERS: Record<DayOfWeek, string> = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'T',
  Friday: 'F',
  Saturday: 'S',
  Sunday: 'S',
}

export default function WeeklyCalendar({ onBack, onLogPost, onViewLog, loggedCount }: WeeklyCalendarProps) {
  const [content, setContent] = useState<DayContent[]>(() => generateWeeklyInstagramContent())

  const totalPosts = content.reduce(
    (sum, day) => sum + day.items.filter((i) => !i.logged).length,
    0
  )

  const handleShuffle = useCallback((dayIdx: number, itemIdx: number) => {
    setContent((prev) =>
      prev.map((day, di) => {
        if (di !== dayIdx) return day
        const newItems = [...day.items]
        newItems[itemIdx] = generateRandomPost()
        return { ...day, items: newItems }
      })
    )
  }, [])

  const handleGenerate = useCallback((dayIdx: number, itemIdx: number) => {
    setContent((prev) =>
      prev.map((day, di) => {
        if (di !== dayIdx) return day
        const newItems = [...day.items]
        newItems[itemIdx] = generateContentForPost(newItems[itemIdx])
        return { ...day, items: newItems }
      })
    )
  }, [])

  const handleLogPost = useCallback((dayIdx: number, itemIdx: number, day: string) => {
    const item = content[dayIdx].items[itemIdx]
    onLogPost({
      ...item,
      day,
      logged: true,
      loggedAt: new Date().toISOString(),
    })
    setContent((prev) =>
      prev.map((d, di) => {
        if (di !== dayIdx) return d
        const newItems = [...d.items]
        newItems[itemIdx] = { ...newItems[itemIdx], logged: true }
        return { ...d, items: newItems }
      })
    )
  }, [content, onLogPost])

  const handlePost = useCallback(
    async (
      dayIdx: number,
      itemIdx: number,
      day: string,
      destination: PostDestination,
      opts: { alsoFacebook: boolean },
    ) => {
      const current = content[dayIdx].items[itemIdx]
      const result = await postItemToSocials(current, destination, opts)
      // Also log it so it shows up in the Post Log view — posting to IG is a
      // superset of logging ("logged" = it's done, "postedToInstagram" = it's
      // live on IG).
      onLogPost({
        ...current,
        day,
        logged: true,
        loggedAt: new Date().toISOString(),
        postedToInstagram: result.instagram,
        postedToFacebook: result.facebook,
        facebookError: result.facebookError,
      })
      setContent((prev) =>
        prev.map((d, di) => {
          if (di !== dayIdx) return d
          const newItems = [...d.items]
          newItems[itemIdx] = {
            ...newItems[itemIdx],
            logged: true,
            postedToInstagram: result.instagram,
            postedToFacebook: result.facebook,
            facebookError: result.facebookError,
            postError: undefined,
          }
          return { ...d, items: newItems }
        }),
      )
      return { facebookError: result.facebookError }
    },
    [content, onLogPost],
  )

  const handleShuffleAll = useCallback(() => {
    setContent(generateWeeklyInstagramContent())
  }, [])

  const handleVisualResult = useCallback(
    (dayIdx: number, itemIdx: number, patch: Partial<NonNullable<ContentItem['generatedVisual']>>) => {
      setContent((prev) =>
        prev.map((day, di) => {
          if (di !== dayIdx) return day
          const newItems = [...day.items]
          const cur = newItems[itemIdx]
          if (!cur.generatedVisual) return day
          newItems[itemIdx] = { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
          return { ...day, items: newItems }
        }),
      )
    },
    [],
  )

  const scrollToDay = useCallback((day: DayOfWeek | 'all') => {
    if (day === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    document.getElementById(`day-${day}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

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
              background: 'rgba(59,130,246,.1)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
            }}
            aria-label="Back"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex flex-col items-center min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 22 }}>🚀</span>
              <h1 className="text-xl font-bold gradient-text leading-none">Spacelauncher</h1>
            </div>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              Your week · {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}
              {loggedCount > 0 && (
                <>
                  {' · '}
                  <button
                    onClick={onViewLog}
                    className="font-bold underline-offset-2 hover:underline"
                    style={{ color: '#10b981' }}
                  >
                    {loggedCount} logged →
                  </button>
                </>
              )}
            </p>
          </div>

          <button
            onClick={handleShuffleAll}
            className="flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 flex-shrink-0"
            style={{
              background: '#10b981',
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
            }}
            aria-label="Shuffle all posts"
          >
            <span>🔀</span>
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>

        {/* Day pills */}
        <div className="px-3 pb-3">
          <div className="max-w-[1800px] mx-auto flex items-center gap-1.5 overflow-x-auto">
            <DayPill label="All" onClick={() => scrollToDay('all')} />
            {content.map((day) => {
              const remaining = day.items.filter((i) => !i.logged).length
              return (
                <DayPill
                  key={day.day}
                  label={DAY_LETTERS[day.day as DayOfWeek]}
                  count={remaining}
                  fullName={day.day}
                  onClick={() => scrollToDay(day.day as DayOfWeek)}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Day sections */}
      <div className="px-4 py-5 max-w-[1800px] mx-auto">
        {totalPosts === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
              All posts logged!
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              View your logged posts or shuffle for a new week.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onViewLog}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                View Post Log
              </button>
              <button
                onClick={handleShuffleAll}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: '#10b981', color: '#fff' }}
              >
                New Week
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {content.map((day, dayIdx) => {
              const remaining = day.items.filter((i) => !i.logged)
              const allLogged = remaining.length === 0
              return (
                <section
                  key={day.day}
                  id={`day-${day.day}`}
                  className="day-anchor glass-panel card-enter"
                  style={{
                    animationDelay: `${dayIdx * 0.05}s`,
                    padding: 16,
                  }}
                >
                  {/* Day section header */}
                  <div className="flex items-baseline justify-between mb-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="min-w-0">
                      <h2
                        className="text-2xl font-extrabold gradient-text leading-none"
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        {day.day}
                      </h2>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                        {day.theme}
                        {' · '}
                        {allLogged ? 'all posted ✓' : `${remaining.length} ${remaining.length === 1 ? 'post' : 'posts'}`}
                      </p>
                    </div>
                  </div>

                  {/* Day's posts */}
                  {allLogged ? (
                    <div
                      className="text-center text-xs font-bold py-3 rounded-xl"
                      style={{ background: 'rgba(16,185,129,.08)', color: '#10b981' }}
                    >
                      All posted ✓
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {day.items.map((item, itemIdx) => {
                        if (item.logged) return null
                        return (
                          <ContentCard
                            key={`${day.day}-${itemIdx}`}
                            item={item}
                            index={itemIdx}
                            onShuffle={() => handleShuffle(dayIdx, itemIdx)}
                            onGenerate={() => handleGenerate(dayIdx, itemIdx)}
                            onLogPost={() => handleLogPost(dayIdx, itemIdx, day.day)}
                            onPost={(destination, opts) => handlePost(dayIdx, itemIdx, day.day, destination, opts)}
                            allowedDestinations={allowedDestinationsFor(item)}
                            onVisualResult={(patch) => handleVisualResult(dayIdx, itemIdx, patch)}
                          />
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface DayPillProps {
  label: string
  count?: number
  fullName?: string
  onClick: () => void
}

function DayPill({ label, count, fullName, onClick }: DayPillProps) {
  const isEmpty = count === 0
  return (
    <button
      onClick={onClick}
      aria-label={fullName || label}
      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105"
      style={{
        background: isEmpty ? 'var(--panel-2)' : 'rgba(59,130,246,.1)',
        color: isEmpty ? 'var(--muted)' : 'var(--accent)',
        border: '1px solid var(--border)',
        minWidth: 36,
        justifyContent: 'center',
      }}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className="text-[9px] font-bold rounded-full px-1.5"
          style={{ background: 'var(--accent)', color: '#fff', minWidth: 14, textAlign: 'center' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
