import EmailCard from './EmailCard'
import type { EmailItem } from '../types'
import { EMAIL_TYPES, generateEmailContent, makeEmailSeed } from '../data/emailContentTemplates'
import { usePersistedState } from '../utils/persistedState'

interface EmailLabProps {
  onBack: () => void
}

function findTypeIdx(typeId: string): number {
  const idx = EMAIL_TYPES.findIndex((t) => t.id === typeId)
  return idx >= 0 ? idx : 0
}

function pickDifferentTypeIdx(current: number): number {
  if (EMAIL_TYPES.length <= 1) return 0
  let next = Math.floor(Math.random() * EMAIL_TYPES.length)
  while (next === current) next = Math.floor(Math.random() * EMAIL_TYPES.length)
  return next
}

export default function EmailLab({ onBack }: EmailLabProps) {
  const [item, setItem] = usePersistedState<EmailItem>(
    'sl:emailLab:item',
    () => makeEmailSeed(EMAIL_TYPES[0]),
  )

  const handleGenerate = () => {
    setItem((cur) => generateEmailContent(cur))
  }

  const handleShuffle = () => {
    setItem((cur) => {
      const nextIdx = pickDifferentTypeIdx(findTypeIdx(cur.typeId))
      return makeEmailSeed(EMAIL_TYPES[nextIdx])
    })
  }

  const handleEdit = (patch: Partial<NonNullable<EmailItem['content']>>) => {
    setItem((cur) => {
      if (!cur.content) return cur
      return { ...cur, content: { ...cur.content, ...patch } }
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6" style={{ position: 'relative', textAlign: 'center' }}>
          <button
            onClick={onBack}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              background: 'rgba(148,163,184,.1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            ← Back
          </button>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            📧 Email Lab
          </h1>
        </div>

        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: 520 }}>
            <EmailCard
              item={item}
              onShuffle={handleShuffle}
              onGenerate={handleGenerate}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
