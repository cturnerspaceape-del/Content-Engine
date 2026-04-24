import ContentCard from './ContentCard'
import type { ContentItem, PostDestination } from '../types'
import { generateContentForPost } from '../data/instagramContentTemplates'
import { getShotTemplate } from '../data/shotTemplates'
import { usePersistedState } from '../utils/persistedState'
import { postItemToSocials } from '../lib/postToInstagram'

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

function findSeedIdx(title: string): number {
  const idx = SEED_TITLES.findIndex((t) => title.startsWith(t))
  return idx >= 0 ? idx : 0
}

function pickDifferentSeedIdx(current: number): number {
  if (SEED_TITLES.length <= 1) return 0
  let next = Math.floor(Math.random() * SEED_TITLES.length)
  while (next === current) next = Math.floor(Math.random() * SEED_TITLES.length)
  return next
}

export default function SingleImageLab({ onBack }: SingleImageLabProps) {
  // Persisted shape migrated from ContentItem[] (legacy 6-card grid) to a
  // single ContentItem. If localStorage still holds the array form, take
  // the first element — no data loss for the currently-focused card.
  const [raw, setRaw] = usePersistedState<ContentItem | ContentItem[]>(
    'sl:silLab:items',
    () => makeSeed(SEED_TITLES[0]),
  )
  const item: ContentItem = Array.isArray(raw)
    ? raw[0] ?? makeSeed(SEED_TITLES[0])
    : raw

  const setItem = (updater: (prev: ContentItem) => ContentItem) => {
    setRaw((prev) => {
      const current: ContentItem = Array.isArray(prev)
        ? prev[0] ?? makeSeed(SEED_TITLES[0])
        : prev
      return updater(current)
    })
  }

  const handleGenerate = () => {
    setItem((cur) => {
      const seedIdx = findSeedIdx(cur.title)
      const generated = generateContentForPost(cur)
      return decorateTitle(generated, SEED_TITLES[seedIdx])
    })
  }

  const handleShuffle = () => {
    // Cycle to a different pillar — discards any generated state on the card,
    // which is the user's intent when shuffling (pick a new brief).
    setItem((cur) => {
      const nextIdx = pickDifferentSeedIdx(findSeedIdx(cur.title))
      return makeSeed(SEED_TITLES[nextIdx])
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
