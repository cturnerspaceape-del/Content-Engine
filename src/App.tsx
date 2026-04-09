import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import WeeklyCalendar from './components/WeeklyCalendar'
import StrategyDashboard from './components/StrategyDashboard'
import PostLog from './components/PostLog'
import type { ViewState, LoggedPost } from './types'

export default function App() {
  const [view, setView] = useState<ViewState>('home')
  const [animating, setAnimating] = useState(false)
  const [loggedPosts, setLoggedPosts] = useState<LoggedPost[]>([])

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
              onLaunch={() => switchView('calendar')}
              onStrategy={() => switchView('strategy')}
              onPostLog={() => switchView('postlog')}
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
      </div>
    </div>
  )
}
