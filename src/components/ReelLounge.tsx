import ContentCard from './ContentCard'
import type { ContentItem, PostDestination } from '../types'
import { generateReelLoungePost } from '../data/instagramContentTemplates'
import { getReelArc } from '../data/reelArcs'
import { usePersistedState } from '../utils/persistedState'
import { postItemToSocials } from '../lib/postToInstagram'
import { REEL_ARC_SEEDS, formatReelSeedTitle, findReelSeedIdxFromTitle, pickDifferentReelSeedIdx } from '../lib/seeds/reelArc'

interface ReelLoungeProps {
  onBack: () => void
}

const SEED_PREFIX = 'Reel Lounge'
const SEEDS: Array<{ arcId: string; title: string }> = REEL_ARC_SEEDS.map((s) => ({
  arcId: s.arcId,
  title: formatReelSeedTitle(SEED_PREFIX, s),
}))

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

const findSeedIdx = (title: string) => findReelSeedIdxFromTitle(SEED_PREFIX, title)
const pickDifferentSeedIdx = pickDifferentReelSeedIdx

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
    _edits?: { caption?: string; hashtags?: string[] },
  ) => {
    // Reel flow doesn't surface the edit affordance today, so the overrides
    // are never sent — parameter exists only to satisfy the shared
    // ContentCard onPost signature.
    void _edits
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
              background: 'linear-gradient(135deg, #ec4899, #be185d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎬 Reel Lounge
          </h1>
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
