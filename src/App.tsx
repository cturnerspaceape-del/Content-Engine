import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import WeeklyCalendar from './components/WeeklyCalendar'
import Scheduler from './components/Scheduler'
import DayDetail from './components/DayDetail'
import StrategyDashboard from './components/StrategyDashboard'
import PostLog from './components/PostLog'
import ImageLab from './components/labs/ImageLab'
import ReelLab from './components/labs/ReelLab'
import TextPostLab from './components/labs/TextPostLab'
import CarouselLab from './components/labs/CarouselLab'
import EmailLab from './components/labs/EmailLab'
import PrintLab from './components/labs/PrintLab'
import { usePersistedState } from './utils/persistedState'
import type { ViewState, LoggedPost, ScheduledPost } from './types'

// Migrate persisted view names from the legacy Lab routes (sil-lab,
// x-post-lab, reel-lounge, etc.) to the new format-based Labs.
const VIEW_MIGRATIONS: Record<string, ViewState> = {
  'sil-lab': 'image-lab',
  'x-post-lab': 'text-post-lab',
  'reel-lounge': 'reel-lab',
  'shorts-lab': 'reel-lab',
  'carousel-lounge': 'carousel-lab',
}

export default function App() {
  const [view, setView] = usePersistedState<ViewState>('sl:view', 'home')
  const [animating, setAnimating] = useState(false)
  const [loggedPosts, setLoggedPosts] = usePersistedState<LoggedPost[]>('sl:loggedPosts', [])
  const [scheduledPosts, setScheduledPosts] = usePersistedState<ScheduledPost[]>('sl:scheduledPosts', [])
  const [selectedDate, setSelectedDate] = usePersistedState<string | null>('sl:selectedDate', null)

  const handleSchedulePost = (post: ScheduledPost) => {
    setScheduledPosts((prev) => [...prev, post])
  }
  const handleUpdateSchedule = (post: ScheduledPost) => {
    setScheduledPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)))
  }
  const handleUnschedulePost = (id: string) => {
    setScheduledPosts((prev) => prev.filter((p) => p.id !== id))
  }
  const openDay = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${y}-${m}-${day}`)
    switchView('day-detail')
  }
  const parseSelectedDate = (): Date => {
    if (!selectedDate) return new Date()
    const [y, m, d] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // Run migration once on mount: if the user was last on a deleted route,
  // bounce them to the corresponding new Lab.
  useEffect(() => {
    const migrated = VIEW_MIGRATIONS[view as string]
    if (migrated) setView(migrated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchView = (target: ViewState) => {
    setAnimating(true)
    setTimeout(() => {
      setView(target)
      setAnimating(false)
    }, 200)
  }

  const handleLogPost = (post: LoggedPost) => {
    setLoggedPosts((prev) => [...prev, post])
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {view === 'home' && (
          <div className="fade-in">
            <HomeScreen
              onPostLog={() => switchView('postlog')}
              onScheduler={() => switchView('scheduler')}
              onImageLab={() => switchView('image-lab')}
              onReelLab={() => switchView('reel-lab')}
              onTextPostLab={() => switchView('text-post-lab')}
              onCarouselLab={() => switchView('carousel-lab')}
              onEmailLab={() => switchView('email-lab')}
              onPrintLab={() => switchView('print-lab')}
              loggedCount={loggedPosts.length}
            />
          </div>
        )}
        {view === 'calendar' && (
          <div className="fade-in">
            <WeeklyCalendar
              onBack={() => switchView('home')}
              onLogPost={handleLogPost}
              onViewLog={() => switchView('postlog')}
              loggedCount={loggedPosts.length}
            />
          </div>
        )}
        {view === 'scheduler' && (
          <div className="fade-in">
            <Scheduler
              onBack={() => switchView('home')}
              loggedPosts={loggedPosts}
              scheduledPosts={scheduledPosts}
              onOpenDay={openDay}
            />
          </div>
        )}
        {view === 'day-detail' && (
          <div className="fade-in">
            <DayDetail
              date={parseSelectedDate()}
              onBack={() => switchView('scheduler')}
              loggedPosts={loggedPosts}
              scheduledPosts={scheduledPosts}
              onSchedule={handleSchedulePost}
              onUpdateSchedule={handleUpdateSchedule}
              onUnschedule={handleUnschedulePost}
              onOpenPrintLab={() => switchView('print-lab')}
            />
          </div>
        )}
        {view === 'strategy' && (
          <div className="fade-in">
            <StrategyDashboard onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'postlog' && (
          <div className="fade-in">
            <PostLog
              posts={loggedPosts}
              onBack={() => switchView('home')}
            />
          </div>
        )}
        {view === 'image-lab' && (
          <div className="fade-in">
            <ImageLab
              onBack={() => switchView('home')}
              scheduledPosts={scheduledPosts}
              onSchedulePost={handleSchedulePost}
            />
          </div>
        )}
        {view === 'reel-lab' && (
          <div className="fade-in">
            <ReelLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'text-post-lab' && (
          <div className="fade-in">
            <TextPostLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'carousel-lab' && (
          <div className="fade-in">
            <CarouselLab
              onBack={() => switchView('home')}
              scheduledPosts={scheduledPosts}
              onSchedulePost={handleSchedulePost}
            />
          </div>
        )}
        {view === 'email-lab' && (
          <div className="fade-in">
            <EmailLab
              onBack={() => switchView('home')}
              scheduledPosts={scheduledPosts}
              onSchedulePost={handleSchedulePost}
            />
          </div>
        )}
        {view === 'print-lab' && (
          <div className="fade-in">
            <PrintLab onBack={() => switchView('home')} />
          </div>
        )}
      </div>
    </div>
  )
}
