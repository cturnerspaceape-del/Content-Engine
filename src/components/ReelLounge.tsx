import ContentCard from './ContentCard'
import type { ContentItem, PostDestination } from '../types'
import { generateReelLoungePost } from '../data/instagramContentTemplates'
import { estimateReelCost, getReelArc } from '../data/reelArcs'
import { usePersistedState } from '../utils/persistedState'
import { postItemToSocials } from '../lib/postToInstagram'

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

function findSeedIdx(title: string): number {
  const idx = SEEDS.findIndex((s) => title.startsWith(s.title))
  return idx >= 0 ? idx : 0
}

function pickDifferentSeedIdx(current: number): number {
  if (SEEDS.length <= 1) return 0
  let next = Math.floor(Math.random() * SEEDS.length)
  while (next === current) next = Math.floor(Math.random() * SEEDS.length)
  return next
}

export default function ReelLounge({ onBack }: ReelLoungeProps) {
  // Persisted shape migrated from ContentItem[] (legacy 6-card grid) to a
  // single ContentItem — avoids losing any already-generated reel (array
  // form coerces to its first element).
  const [raw, setRaw] = usePersistedState<ContentItem | ContentItem[]>(
    'sl:reelLounge:items',
    () => makeSeed(SEEDS[0].title),
  )
  const item: ContentItem = Array.isArray(raw)
    ? raw[0] ?? makeSeed(SEEDS[0].title)
    : raw

  const setItem = (updater: (prev: ContentItem) => ContentItem) => {
    setRaw((prev) => {
      const current: ContentItem = Array.isArray(prev)
        ? prev[0] ?? makeSeed(SEEDS[0].title)
        : prev
      return updater(current)
    })
  }

  const handleGenerate = () => {
    setItem((cur) => {
      const seedIdx = findSeedIdx(cur.title)
      const seed = SEEDS[seedIdx]
      return decorateTitle(generateReelLoungePost(cur, seed.arcId), seed.title)
    })
  }

  const handleShuffle = () => {
    setItem((cur) => {
      const nextIdx = pickDifferentSeedIdx(findSeedIdx(cur.title))
      return makeSeed(SEEDS[nextIdx].title)
    })
  }

  const handleVisualResult = (
    patch: Partial<NonNullable<ContentItem['generatedVisual']>>,
  ) => {
    setItem((cur) => {
      if (!cur.generatedVisual) return cur
      return { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
    })
  }

  const handlePost = async (
    destination: PostDestination,
    opts: { alsoFacebook: boolean },
  ) => {
    const result = await postItemToSocials(item, destination, opts)
    setItem((cur) => ({
      ...cur,
      postedToInstagram: result.instagram,
      postedToFacebook: result.facebook,
      facebookError: result.facebookError,
      postError: undefined,
    }))
    return { facebookError: result.facebookError }
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

        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: 480 }}>
            <ContentCard
              item={item}
              index={0}
              onShuffle={handleShuffle}
              onGenerate={handleGenerate}
              onLogPost={() => {}}
              onPost={handlePost}
              allowedDestinations={['feed', 'story']}
              onVisualResult={handleVisualResult}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
