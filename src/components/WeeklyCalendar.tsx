import { useState, useCallback } from 'react'
import { generateWeeklyInstagramContent, generateRandomPost } from '../data/instagramContentGenerator'
import { generateContentForPost } from '../data/instagramContentTemplates'
import type { DayContent, LoggedPost } from '../types'
import ContentCard from './ContentCard'

interface WeeklyCalendarProps {
  onBack: () => void
  onLogPost: (post: LoggedPost) => void
  onViewLog: () => void
  loggedCount: number
}

interface FlatPost {
  dayIdx: number
  itemIdx: number
  day: string
  theme: string
}

export default function WeeklyCalendar({ onBack, onLogPost, onViewLog, loggedCount }: WeeklyCalendarProps) {
  const [content, setContent] = useState<DayContent[]>(() => generateWeeklyInstagramContent())

  // Flatten only non-logged posts
  const flatPosts: FlatPost[] = content.flatMap((day, dayIdx) =>
    day.items
      .map((item, itemIdx) => ({ item, itemIdx }))
      .filter(({ item }) => !item.logged)
      .map(({ itemIdx }) => ({
        dayIdx,
        itemIdx,
        day: day.day,
        theme: day.theme,
      }))
  )

  const totalPosts = flatPosts.length

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

  const handleShuffleAll = useCallback(() => {
    setContent(generateWeeklyInstagramContent())
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
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
          zIndex: 10,
        }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
            style={{
              background: 'rgba(59,130,246,.1)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
            }}
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--accent)' }}>📸</span>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Weekly Content ({totalPosts})
            </h1>
            {loggedCount > 0 && (
              <button
                onClick={onViewLog}
                className="text-xs font-bold px-2 py-1 rounded-full transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', cursor: 'pointer' }}
              >
                Logged: {loggedCount} →
              </button>
            )}
          </div>

          <button
            onClick={handleShuffleAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
            style={{
              background: '#10b981',
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Shuffle
          </button>
        </div>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="px-6 py-6">
        {totalPosts === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>All posts logged!</p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>View your logged posts or shuffle for a new week.</p>
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
          <div
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {flatPosts.map((fp, i) => {
              const item = content[fp.dayIdx].items[fp.itemIdx]
              return (
                <ContentCard
                  key={`${fp.day}-${fp.itemIdx}`}
                  item={item}
                  day={fp.day}
                  theme={fp.theme}
                  index={i}
                  onShuffle={() => handleShuffle(fp.dayIdx, fp.itemIdx)}
                  onGenerate={() => handleGenerate(fp.dayIdx, fp.itemIdx)}
                  onLogPost={() => handleLogPost(fp.dayIdx, fp.itemIdx, fp.day)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
