import type { ContentItem } from '../types'

const platformColors: Record<string, string> = {
  'TikTok': '#ef4444',
  'Blog Post': '#10b981',
  'Facebook': '#3b82f6',
  'Instagram': '#a855f7',
  'X': '#1a1a1a',
  'YouTube Shorts': '#ef4444',
}

const formatColors: Record<string, string> = {
  'Carousel': '#a855f7',
  'Reel': '#ec4899',
  'Single Image': '#3b82f6',
}

interface PlatformContentItemProps {
  item: ContentItem
  onShuffle?: () => void
  onGenerate?: () => void
}

export default function PlatformContentItem({ item, onShuffle, onGenerate }: PlatformContentItemProps) {
  const borderColor = formatColors[item.contentType] || platformColors[item.platform] || 'var(--accent)'

  return (
    <div
      className="p-3 rounded-[10px] transition-all duration-200 cursor-default"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--panel-2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{item.emoji}</span>
        <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
          {item.platform}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{
            background: `${borderColor}15`,
            color: borderColor,
          }}
        >
          {item.contentType}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
        {item.title}
      </p>

      {/* Checklist-style description */}
      <div className="text-xs leading-relaxed mb-2" style={{ color: 'var(--muted)', whiteSpace: 'pre-line' }}>
        {item.description}
      </div>

      {/* Action buttons */}
      {(onShuffle || onGenerate) && (
        <div className="flex gap-2">
          {onShuffle && (
            <button
              onClick={(e) => { e.stopPropagation(); onShuffle() }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105"
              style={{
                background: 'rgba(59,130,246,.08)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
              }}
            >
              <span>↻</span>
              <span>Shuffle</span>
            </button>
          )}
          {onGenerate && (
            <button
              onClick={(e) => { e.stopPropagation(); onGenerate() }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105"
              style={{
                background: `${borderColor}10`,
                border: `1px solid ${borderColor}40`,
                color: borderColor,
              }}
            >
              <span>✦</span>
              <span>Generate</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
