import type { DayContent } from '../types'
import PlatformContentItem from './PlatformContentItem'

interface DayCardProps {
  dayContent: DayContent
  index: number
  onShuffle?: (itemIndex: number) => void
  onGenerate?: (itemIndex: number) => void
}

export default function DayCard({ dayContent, index, onShuffle, onGenerate }: DayCardProps) {
  return (
    <div
      className="glass-panel p-5 card-enter"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="mb-3">
        <h3
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: 'var(--accent)' }}
        >
          {dayContent.day}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          {dayContent.theme}
        </p>
      </div>

      <div
        className="mb-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      />

      <div className="space-y-2">
        {dayContent.items.map((item, itemIdx) => (
          <PlatformContentItem
            key={`${item.platform}-${itemIdx}`}
            item={item}
            onShuffle={onShuffle ? () => onShuffle(itemIdx) : undefined}
            onGenerate={onGenerate ? () => onGenerate(itemIdx) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
