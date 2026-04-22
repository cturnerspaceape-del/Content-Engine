import ContentCard from './ContentCard'
import type { ContentItem } from '../types'
import { generateCarouselLoungePost } from '../data/instagramContentTemplates'
import { getCarouselArc } from '../data/carouselArcs'
import { usePersistedState } from '../utils/persistedState'

interface CarouselLoungeProps {
  onBack: () => void
}

// Each seed title maps to a specific arc + pillar. Pillar in the title feeds
// into the hook/caption pools (see generateCarouselLoungePost title parsing).
const SEEDS: Array<{ arcId: string; title: string }> = [
  { arcId: 'drop-story', title: 'Carousel Lounge — Product Centric: New Drop Reveal' },
  { arcId: 'flavor-breakdown', title: 'Carousel Lounge — Education: Flavor Breakdown' },
  { arcId: 'day-in-the-life', title: 'Carousel Lounge — Lifestyle: Cultural Moment' },
  { arcId: 'before-after', title: 'Carousel Lounge — Entertainment: Hot Take' },
  { arcId: 'product-features', title: 'Carousel Lounge — Product Centric: Feature Tour' },
  { arcId: 'strain-mood-board', title: 'Carousel Lounge — Brand Building: Founder Story' },
]

function makeSeed(title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: '🎠',
    title,
    description: 'Click Generate to build this Carousel Lounge post.',
    contentType: 'Post',
    generated: false,
  }
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const arcId = item.generatedVisual?.arcId
  const name = arcId ? getCarouselArc(arcId)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎞️ ${name}` }
}

export default function CarouselLounge({ onBack }: CarouselLoungeProps) {
  const [items, setItems] = usePersistedState<ContentItem[]>('sl:carouselLounge:items', () =>
    SEEDS.map((s) => makeSeed(s.title)),
  )

  const handleGenerate = (idx: number) => {
    setItems((prev) => {
      const next = [...prev]
      const generated = generateCarouselLoungePost(next[idx], SEEDS[idx].arcId)
      next[idx] = decorateTitle(generated, SEEDS[idx].title)
      return next
    })
  }

  const handleShuffle = (idx: number) => {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = makeSeed(SEEDS[idx].title)
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
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              🎠 Carousel Lounge
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Narrative 3–5 slide AI carousels. One Gemini call per slide; shared seed + refs keep the set cohesive.
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
