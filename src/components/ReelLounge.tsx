import ContentCard from './ContentCard'
import type { ContentItem } from '../types'
import { generateReelLoungePost } from '../data/instagramContentTemplates'
import { estimateReelCost, getReelArc } from '../data/reelArcs'
import { usePersistedState } from '../utils/persistedState'

interface ReelLoungeProps {
  onBack: () => void
}

// Seed titles mirror the six reel arcs in src/data/reelArcs.ts. Pillar in the
// title drives the hook/caption pools, same parsing pattern as SingleImageLab.
const SEEDS: Array<{ arcId: string; title: string }> = [
  { arcId: 'drop-teaser', title: 'Reel Lounge — Product Centric: New Drop Reveal' },
  { arcId: 'flavor-cinemagraph', title: 'Reel Lounge — Product Centric: Flavor Moment' },
  { arcId: 'day-in-the-life', title: 'Reel Lounge — Lifestyle: Cultural Moment' },
  { arcId: 'cultural-cutaway', title: 'Reel Lounge — Entertainment: Hot Take' },
  { arcId: 'unbox-reveal', title: 'Reel Lounge — Product Centric: Unbox Reveal' },
  { arcId: 'strain-mood', title: 'Reel Lounge — Brand Building: Founder Story' },
]

function makeSeed(title: string): ContentItem {
  return {
    platform: 'Instagram',
    emoji: '🎬',
    title,
    description: 'Click Generate to build this Reel Lounge post.',
    contentType: 'Post',
    generated: false,
  }
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const arcId = item.generatedVisual?.reelArcId
  const name = arcId ? getReelArc(arcId)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎞️ ${name}` }
}

export default function ReelLounge({ onBack }: ReelLoungeProps) {
  const [items, setItems] = usePersistedState<ContentItem[]>('sl:reelLounge:items', () =>
    SEEDS.map((s) => makeSeed(s.title)),
  )

  const handleGenerate = (idx: number) => {
    setItems((prev) => {
      const next = [...prev]
      const generated = generateReelLoungePost(next[idx], SEEDS[idx].arcId)
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

  const handleVisualResult = (
    idx: number,
    patch: Partial<NonNullable<ContentItem['generatedVisual']>>,
  ) => {
    setItems((prev) => {
      const next = [...prev]
      const cur = next[idx]
      if (!cur.generatedVisual) return prev
      next[idx] = { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
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
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              🎬 Reel Lounge
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              5–12s AI Reels via Veo 3 Fast. ~{estimateReelCost(8)} per 8-second clip. Each Generate fires one Veo job.
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
              onVisualResult={(patch) => handleVisualResult(idx, patch)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
