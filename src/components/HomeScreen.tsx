interface HomeScreenProps {
  onPostLog: () => void
  onScheduler: () => void
  onImageLab: () => void
  onTextPostLab: () => void
  onCarouselLab: () => void
  onEmailLab: () => void
  onPrintLab: () => void
  onReelLab: () => void
  onReelStitchLab: () => void
  loggedCount: number
}

export default function HomeScreen({
  onPostLog,
  onScheduler,
  onImageLab,
  onTextPostLab,
  onCarouselLab,
  onEmailLab,
  onPrintLab,
  onReelLab,
  onReelStitchLab,
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
            <div className="text-5xl mb-4">
              <span className="float">🚀</span>
            </div>
            <h1
              className="font-display text-4xl mb-2"
              style={{
                background: 'linear-gradient(135deg, #ff5fa2 0%, #b8a4ff 50%, #7cd2ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SPACELAUNCHER
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              content lab for Space Ape.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={onScheduler}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(184,164,255,.20), rgba(124,210,255,.14))',
                border: '2px solid #b8a4ff',
                boxShadow: 'var(--shadow-md)',
                color: '#b8a4ff',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📅</span>
                <span>Scheduler</span>
              </div>
            </button>
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
              </div>
            </button>
            <button
              onClick={onCarouselLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,.18), rgba(8,145,178,.12))',
                border: '2px solid #06b6d4',
                boxShadow: 'var(--shadow-md)',
                color: '#06b6d4',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎠</span>
                <span>Carousel Lab</span>
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
              </div>
            </button>
            <button
              onClick={onEmailLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,.18), rgba(217,119,6,.12))',
                border: '2px solid #f59e0b',
                boxShadow: 'var(--shadow-md)',
                color: '#f59e0b',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">📧</span>
                <span>Email Lab</span>
              </div>
            </button>
            <button
              onClick={onReelLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,.18), rgba(139,92,246,.14))',
                border: '2px solid #ec4899',
                boxShadow: 'var(--shadow-md)',
                color: '#ec4899',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎬</span>
                <span>Reel Lab</span>
              </div>
            </button>
            <button
              onClick={onReelStitchLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,.18), rgba(99,102,241,.14))',
                border: '2px solid #a855f7',
                boxShadow: 'var(--shadow-md)',
                color: '#a855f7',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🧵</span>
                <span>Reel Stitch Lab</span>
              </div>
            </button>
            <button
              onClick={onPrintLab}
              className="w-full p-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(14,165,233,.18), rgba(99,102,241,.12))',
                border: '2px solid #0ea5e9',
                boxShadow: 'var(--shadow-md)',
                color: '#0ea5e9',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🖨️</span>
                <span>Print Lab</span>
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
