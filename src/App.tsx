import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import WeeklyCalendar from './components/WeeklyCalendar'
import StrategyDashboard from './components/StrategyDashboard'
import PostLog from './components/PostLog'
import SingleImageLab from './components/SingleImageLab'
import CarouselLounge from './components/CarouselLounge'
import ReelLounge from './components/ReelLounge'
import XPostLab from './components/XPostLab'
import ShortsLab from './components/ShortsLab'
import EmailLab from './components/EmailLab'
import ImageLab from './components/labs/ImageLab'
import ReelLab from './components/labs/ReelLab'
import { usePersistedState } from './utils/persistedState'
import type { ViewState, LoggedPost } from './types'

export default function App() {
  const [view, setView] = usePersistedState<ViewState>('sl:view', 'home')
  const [animating, setAnimating] = useState(false)
  const [loggedPosts, setLoggedPosts] = usePersistedState<LoggedPost[]>('sl:loggedPosts', [])

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
              onSilLab={() => switchView('sil-lab')}
              onCarouselLounge={() => switchView('carousel-lounge')}
              onReelLounge={() => switchView('reel-lounge')}
              onXPostLab={() => switchView('x-post-lab')}
              onShortsLab={() => switchView('shorts-lab')}
              onEmailLab={() => switchView('email-lab')}
              onImageLab={() => switchView('image-lab')}
              onReelLab={() => switchView('reel-lab')}
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
        {view === 'sil-lab' && (
          <div className="fade-in">
            <SingleImageLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'carousel-lounge' && (
          <div className="fade-in">
            <CarouselLounge onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'reel-lounge' && (
          <div className="fade-in">
            <ReelLounge onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'x-post-lab' && (
          <div className="fade-in">
            <XPostLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'shorts-lab' && (
          <div className="fade-in">
            <ShortsLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'email-lab' && (
          <div className="fade-in">
            <EmailLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'image-lab' && (
          <div className="fade-in">
            <ImageLab onBack={() => switchView('home')} />
          </div>
        )}
        {view === 'reel-lab' && (
          <div className="fade-in">
            <ReelLab onBack={() => switchView('home')} />
          </div>
        )}
      </div>
    </div>
  )
}
