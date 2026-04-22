interface HomeScreenProps {
  onLaunch: () => void
  onStrategy: () => void
  onPostLog: () => void
  onSilLab: () => void
  onCarouselLounge: () => void
  loggedCount: number
}

export default function HomeScreen({ onLaunch, onStrategy, onPostLog, onSilLab, onCarouselLounge, loggedCount }: HomeScreenProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-md w-full mx-4">
        <div className="glass-panel p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🚀</div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SPACELAUNCHER
            </h1>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>
              Plan your weekly content across every platform
            </p>
          </div>

          {/* Launch Button */}
          <div className="space-y-4">
            <button
              onClick={onLaunch}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(59,130,246,.1)',
                border: '2px solid #3b82f6',
                boxShadow: 'var(--shadow-md)',
                color: '#3b82f6',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📅</span>
                <span>Launch Weekly Content</span>
              </div>
            </button>

            <button
              onClick={onStrategy}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(168,85,247,.1)',
                border: '2px solid #a855f7',
                boxShadow: 'var(--shadow-md)',
                color: '#a855f7',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📊</span>
                <span>Instagram Strategy</span>
              </div>
            </button>
            <button
              onClick={onSilLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(245,158,11,.1)',
                border: '2px solid #f59e0b',
                boxShadow: 'var(--shadow-md)',
                color: '#f59e0b',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🧪</span>
                <span>Single Image Lab</span>
              </div>
            </button>
            <button
              onClick={onCarouselLounge}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(6,182,212,.1)',
                border: '2px solid #06b6d4',
                boxShadow: 'var(--shadow-md)',
                color: '#06b6d4',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎠</span>
                <span>Carousel Lounge</span>
              </div>
            </button>
            {loggedCount > 0 && (
              <button
                onClick={onPostLog}
                className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(16,185,129,.1)',
                  border: '2px solid #10b981',
                  boxShadow: 'var(--shadow-md)',
                  color: '#10b981',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">📋</span>
                  <span>Post Log ({loggedCount})</span>
                </div>
              </button>
            )}
          </div>

          {/* Subtle footer hint */}
          <p
            className="text-center text-xs mt-6"
            style={{ color: 'var(--muted)' }}
          >
            Generate a full week of content suggestions across 6 platforms
          </p>
        </div>
      </div>
    </div>
  )
}
