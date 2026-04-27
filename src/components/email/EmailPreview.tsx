import { useMemo } from 'react'

interface EmailPreviewProps {
  html: string
  subject: string
  preheader: string
  viewport: 'desktop' | 'mobile'
  onViewportChange: (next: 'desktop' | 'mobile') => void
}

export default function EmailPreview({
  html,
  subject,
  preheader,
  viewport,
  onViewportChange,
}: EmailPreviewProps) {
  const frameWidth = viewport === 'desktop' ? 700 : 390

  // Memoize so we only blow away the iframe on actual content change.
  const srcDoc = useMemo(() => html, [html])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-end w-full max-w-[700px] mb-3">
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: 4,
          }}
        >
          {(['desktop', 'mobile'] as const).map((v) => {
            const active = v === viewport
            return (
              <button
                key={v}
                onClick={() => onViewportChange(v)}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(245,158,11,.15)' : 'transparent',
                  color: active ? '#f59e0b' : 'var(--muted)',
                  border: active ? '1px solid #f59e0b' : '1px solid transparent',
                }}
              >
                {v === 'desktop' ? '💻 Desktop' : '📱 Mobile'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Faux inbox row above the iframe — Gmail/Apple-Mail style preview. */}
      <div
        className="w-full"
        style={{
          maxWidth: frameWidth,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 4 }}>
          Inbox preview
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
          {subject || <span style={{ color: 'var(--muted)' }}>No subject</span>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          {preheader || <span style={{ opacity: 0.5 }}>No preheader</span>}
        </div>
      </div>

      <div
        style={{
          width: frameWidth,
          maxWidth: '100%',
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: '#0b0b0c',
          boxShadow: 'var(--shadow-md)',
          transition: 'width .25s ease',
        }}
      >
        <iframe
          title="Email preview"
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          style={{
            width: '100%',
            height: 900,
            border: 0,
            display: 'block',
            background: '#0b0b0c',
          }}
        />
      </div>
    </div>
  )
}
