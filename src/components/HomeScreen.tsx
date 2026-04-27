interface HomeScreenProps {
  onPostLog: () => void
  onSilLab: () => void
  onCarouselLounge: () => void
  onReelLounge: () => void
  onXPostLab: () => void
  onShortsLab: () => void
  onEmailLab: () => void
  onImageLab: () => void
  onReelLab: () => void
  onTextPostLab: () => void
  loggedCount: number
}

export default function HomeScreen({
  onPostLog,
  onSilLab,
  onCarouselLounge,
  onReelLounge,
  onXPostLab,
  onShortsLab,
  onEmailLab,
  onImageLab,
  onReelLab,
  onTextPostLab,
  loggedCount,
}: HomeScreenProps) {
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
          </div>

          {/* Launch Button */}
          <div className="space-y-4">
            <button
              onClick={onImageLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,.18), rgba(29,155,240,.12))',
                border: '2px solid #f59e0b',
                boxShadow: 'var(--shadow-md)',
                color: '#f59e0b',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🧪</span>
                <span>Image Lab</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: 'rgba(245,158,11,.2)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,.4)',
                  }}
                >
                  ✨ NEW
                </span>
              </div>
            </button>
            <button
              onClick={onReelLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,.18), rgba(255,0,79,.12))',
                border: '2px solid #ec4899',
                boxShadow: 'var(--shadow-md)',
                color: '#ec4899',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎬</span>
                <span>Reel Lab</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: 'rgba(236,72,153,.2)',
                    color: '#ec4899',
                    border: '1px solid rgba(236,72,153,.4)',
                  }}
                >
                  ✨ NEW
                </span>
              </div>
            </button>
            <button
              onClick={onTextPostLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(29,155,240,.18), rgba(139,92,246,.18))',
                border: '2px solid #1d9bf0',
                boxShadow: 'var(--shadow-md)',
                color: '#1d9bf0',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">✍️</span>
                <span>Text Post Lab</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: 'rgba(29,155,240,.2)',
                    color: '#1d9bf0',
                    border: '1px solid rgba(29,155,240,.4)',
                  }}
                >
                  ✨ NEW
                </span>
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
            <button
              onClick={onReelLounge}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(236,72,153,.1)',
                border: '2px solid #ec4899',
                boxShadow: 'var(--shadow-md)',
                color: '#ec4899',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎬</span>
                <span>Reel Lounge</span>
              </div>
            </button>
            <button
              onClick={onXPostLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(29,155,240,.1)',
                border: '2px solid #1d9bf0',
                boxShadow: 'var(--shadow-md)',
                color: '#1d9bf0',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">𝕏</span>
                <span>X / Threads Post Lab</span>
              </div>
            </button>
            <button
              onClick={onShortsLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255,0,79,.1)',
                border: '2px solid #ff004f',
                boxShadow: 'var(--shadow-md)',
                color: '#ff004f',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎵</span>
                <span>Shorts Lab</span>
              </div>
            </button>
            <button
              onClick={onEmailLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(139,92,246,.1)',
                border: '2px solid #8b5cf6',
                boxShadow: 'var(--shadow-md)',
                color: '#8b5cf6',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📧</span>
                <span>Email Lab</span>
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

        </div>
      </div>
    </div>
  )
}
