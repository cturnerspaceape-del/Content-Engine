import { EMAIL_TYPES } from '../../lib/email/emailTypes'
import type { EmailType } from '../../lib/email/types'

interface EmailTypePickerProps {
  value: EmailType
  onChange: (next: EmailType) => void
}

export default function EmailTypePicker({ value, onChange }: EmailTypePickerProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-3">
      {EMAIL_TYPES.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
            title={t.shortDesc}
            style={{
              background: active ? 'rgba(245,158,11,.15)' : 'var(--panel-2)',
              color: active ? '#f59e0b' : 'var(--muted)',
              border: `1px solid ${active ? '#f59e0b' : 'var(--border)'}`,
            }}
          >
            <span style={{ marginRight: 6 }}>{t.emoji}</span>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
