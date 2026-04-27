import { AUDIENCE_PROFILES } from '../../lib/email/audienceProfiles'
import type { AudienceType } from '../../lib/email/types'

interface AudienceToggleProps {
  value: AudienceType
  onChange: (next: AudienceType) => void
  cachedAudiences?: AudienceType[]
}

export default function AudienceToggle({ value, onChange, cachedAudiences = [] }: AudienceToggleProps) {
  return (
    <div className="flex justify-center mb-3">
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: 4,
        }}
      >
        {(['existing', 'inactive'] as const).map((id) => {
          const profile = AUDIENCE_PROFILES[id]
          const active = id === value
          const cached = cachedAudiences.includes(id) && id !== value
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="text-xs font-bold px-4 py-2 rounded-full transition-all"
              style={{
                background: active ? 'rgba(245,158,11,.18)' : 'transparent',
                color: active ? '#f59e0b' : 'var(--muted)',
                border: active ? '1px solid #f59e0b' : '1px solid transparent',
                position: 'relative',
              }}
            >
              {profile.label}
              {cached && (
                <span
                  title="Cached version available"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                    marginLeft: 6,
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
