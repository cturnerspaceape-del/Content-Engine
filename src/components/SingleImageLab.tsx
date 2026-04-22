import ContentCard from './ContentCard'
import type { ContentItem } from '../types'
import { generateContentForPost } from '../data/instagramContentTemplates'
import { getShotTemplate } from '../data/shotTemplates'
import { usePersistedState } from '../utils/persistedState'

interface SingleImageLabProps {
  onBack: () => void
}

const SEED_TITLES = [
  'Single Image — Lifestyle: Cultural Moment',
  'Single Image — Product Centric: New Drop Reveal',
  'Single Image — Education: Flavor Breakdown',
  'Single Image — Entertainment: Hot Take',
  'Single Image — Brand Building: Founder Story',
  'Single Image — Social Proof: First Timer Reaction',
]

function makeSeed(title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: '📷',
    title,
    description: 'Click Generate to build this Single Image post.',
    contentType: 'Post',
    generated: false,
  }
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const id = item.generatedVisual?.shotTemplateId
  const name = id ? getShotTemplate(id)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎬 ${name}` }
}

export default function SingleImageLab({ onBack }: SingleImageLabProps) {
  const [items, setItems] = usePersistedState<ContentItem[]>('sl:silLab:items', () =>
    SEED_TITLES.map(makeSeed),
  )

  const handleGenerate = (idx: number) => {
    setItems((prev) => {
      const next = [...prev]
      const generated = generateContentForPost(next[idx])
      next[idx] = decorateTitle(generated, SEED_TITLES[idx])
      return next
    })
  }

  const handleShuffle = (idx: number) => {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = makeSeed(SEED_TITLES[idx])
      return next
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(148,163,184,.1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            ← Back
          </button>
          <div className="text-right">
            <h1
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              🧪 Single Image Lab
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Nano Banana Pro + shot templates + tagged reference library. Click Generate.
            </p>
          </div>
        </div>

        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {items.map((item, idx) => (
            <ContentCard
              key={idx}
              item={item}
              index={idx}
              onShuffle={() => handleShuffle(idx)}
              onGenerate={() => handleGenerate(idx)}
              onLogPost={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
