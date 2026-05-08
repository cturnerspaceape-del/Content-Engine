import type { getFlavorTheme } from '../../remotion/flavorThemes'
import IconActionButton from '../ui/IconActionButton'

export function ThumbnailStrip({
  urls,
  errors,
  current,
  onSelect,
  onReroll,
  rerollingIndices,
  theme,
  arcRoles,
}: {
  urls: (string | null)[]
  errors: (string | null)[]
  current: number
  onSelect: (idx: number) => void
  onReroll: (idx: number) => void
  rerollingIndices: Set<number>
  theme: ReturnType<typeof getFlavorTheme>
  arcRoles: string[]
}) {
  return (
    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
      {urls.map((url, idx) => {
        const isCurrent = idx === current
        const isLoaded = url !== null
        const err = errors[idx]
        const role = arcRoles[idx]
        const isRerolling = rerollingIndices.has(idx)
        // Reroll icon only makes sense once the slot is settled (has a url or
        // a persisted error) and isn't mid-reroll already.
        const showRerollIcon = (isLoaded || err !== null) && !isRerolling
        return (
          <div
            key={idx}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(idx)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(idx)
              }
            }}
            title={role ? `${idx + 1}. ${role.replace(/-/g, ' ')}` : `Slide ${idx + 1}`}
            style={{
              flex: 1,
              aspectRatio: '1/1',
              border: isCurrent ? `2px solid ${theme.primaryColor}` : '1px solid rgba(148,163,184,0.25)',
              borderRadius: 6,
              padding: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              background: isLoaded ? 'transparent' : theme.backgroundColor,
              minWidth: 0,
            }}
          >
            {isLoaded ? (
              <img
                src={url!}
                alt={`Slide ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: err ? 'rgba(239,68,68,0.9)' : theme.textColor,
                  fontSize: 14,
                  fontWeight: 800,
                  opacity: err ? 0.8 : 0.9,
                }}
              >
                {isRerolling ? '…' : err ? '!' : idx + 1}
              </div>
            )}
            {showRerollIcon && (
              <div style={{ position: 'absolute', top: 2, right: 2 }}>
                <IconActionButton
                  icon="🎲"
                  label=""
                  tone="reroll"
                  size="sm"
                  title={`Reroll slide ${idx + 1} (~$0.05)`}
                  stopPropagation
                  onClick={() => onReroll(idx)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
