import ContentCard from './ContentCard'
import type { ContentItem, PostDestination } from '../types'
import { generateCarouselLoungePost } from '../data/instagramContentTemplates'
import { getCarouselArc } from '../data/carouselArcs'
import { usePersistedState } from '../utils/persistedState'
import { postItemToSocials } from '../lib/postToInstagram'

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
  { arcId: 'campaign-teaser', title: 'Carousel Lounge — Product Centric: Campaign Teaser' },
  { arcId: 'day-to-night', title: 'Carousel Lounge — Lifestyle: Day to Night' },
  { arcId: 'full-story-arc', title: 'Carousel Lounge — Brand Building: Full Story' },
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

export default function CarouselLounge({ onBack }: CarouselLoungeProps) {
  // Persisted shape migrated from ContentItem[] (legacy 6-card grid) to a
  // single ContentItem. Array form gets coerced to its first element.
  const [raw, setRaw] = usePersistedState<ContentItem | ContentItem[]>(
    'sl:carouselLounge:items',
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
      return decorateTitle(generateCarouselLoungePost(cur, seed.arcId), seed.title)
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
    edits?: { caption?: string; hashtags?: string[] },
  ) => {
    const hasEdit =
      (edits?.caption != null || edits?.hashtags != null) && Boolean(item.generatedVisual)
    const itemToPost = hasEdit
      ? {
          ...item,
          generatedVisual: {
            ...item.generatedVisual!,
            ...(edits?.caption != null ? { caption: edits.caption } : {}),
            ...(edits?.hashtags != null ? { hashtags: edits.hashtags } : {}),
          },
        }
      : item
    const result = await postItemToSocials(itemToPost, destination, opts)
    setItem((cur) => ({
      ...cur,
      postedToInstagram: result.instagram,
      postedToFacebook: result.facebook,
      facebookError: result.facebookError,
      postError: undefined,
      ...(hasEdit && cur.generatedVisual
        ? {
            generatedVisual: {
              ...cur.generatedVisual,
              ...(edits?.caption != null ? { caption: edits.caption } : {}),
              ...(edits?.hashtags != null ? { hashtags: edits.hashtags } : {}),
            },
          }
        : {}),
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

        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: 480 }}>
            <ContentCard
              item={item}
              index={0}
              onShuffle={handleShuffle}
              onGenerate={handleGenerate}
              onLogPost={() => {}}
              onPost={handlePost}
              allowedDestinations={['feed']}
              onVisualResult={handleVisualResult}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
