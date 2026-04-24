import type { ContentItem } from '../types'
import XPostCard, { type XFormat } from './XPostCard'
import { X_TEXT_SEEDS, generateXTextPost } from '../data/xPostTemplates'
import { generateContentForPost, generateReelLoungePost } from '../data/instagramContentTemplates'
import { getReelArc } from '../data/reelArcs'
import { getShotTemplate } from '../data/shotTemplates'
import { usePersistedState } from '../utils/persistedState'

interface XPostLabProps {
  onBack: () => void
}

// Seeds reused from Single Image Lab for the Image tab, and from Reel Lounge for the Reel tab.
const IMAGE_SEEDS = [
  'Single Image — Lifestyle: Cultural Moment',
  'Single Image — Product Centric: New Drop Reveal',
  'Single Image — Education: Flavor Breakdown',
  'Single Image — Entertainment: Hot Take',
  'Single Image — Brand Building: Founder Story',
  'Single Image — Social Proof: First Timer Reaction',
]

const REEL_SEEDS: Array<{ arcId: string; title: string }> = [
  { arcId: 'drop-teaser', title: 'Reel Lounge — Product Centric: New Drop Reveal' },
  { arcId: 'flavor-cinemagraph', title: 'Reel Lounge — Product Centric: Flavor Moment' },
  { arcId: 'day-in-the-life', title: 'Reel Lounge — Lifestyle: Cultural Moment' },
  { arcId: 'cultural-cutaway', title: 'Reel Lounge — Entertainment: Hot Take' },
  { arcId: 'unbox-reveal', title: 'Reel Lounge — Product Centric: Unbox Reveal' },
  { arcId: 'strain-mood', title: 'Reel Lounge — Brand Building: Founder Story' },
]

const TWEET_CHAR_LIMIT = 280

function makeTextSeed(title: string): ContentItem {
  return {
    platform: 'X',
    emoji: '𝕏',
    title,
    description: 'Click Generate to build this X post.',
    contentType: 'Post',
    generated: false,
  }
}

function makeImageSeed(title: string): ContentItem {
  return {
    platform: 'X',
    emoji: '📷',
    title,
    description: 'Click Generate to build this X image post.',
    contentType: 'Post',
    generated: false,
  }
}

function makeReelSeed(title: string): ContentItem {
  return {
    platform: 'X',
    emoji: '🎬',
    title,
    description: 'Click Generate to build this X reel post.',
    contentType: 'Post',
    generated: false,
  }
}

function pickDifferentIdx<T>(arr: readonly T[], current: number): number {
  if (arr.length <= 1) return 0
  let next = Math.floor(Math.random() * arr.length)
  while (next === current) next = Math.floor(Math.random() * arr.length)
  return next
}

function findIdxFromTitle<T extends { title?: string } | string>(
  seeds: readonly T[],
  title: string,
): number {
  const idx = seeds.findIndex((s) => {
    const t = typeof s === 'string' ? s : s.title ?? ''
    return title.startsWith(t)
  })
  return idx >= 0 ? idx : 0
}

function truncateTo(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

function decorateImageTitle(item: ContentItem, seedTitle: string): ContentItem {
  const id = item.generatedVisual?.shotTemplateId
  const name = id ? getShotTemplate(id)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎬 ${name}` }
}

function decorateReelTitle(item: ContentItem, seedTitle: string): ContentItem {
  const arcId = item.generatedVisual?.reelArcId
  const name = arcId ? getReelArc(arcId)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎞️ ${name}` }
}

export default function XPostLab({ onBack }: XPostLabProps) {
  const [activeType, setActiveType] = usePersistedState<XFormat>('sl:xPostLab:activeType', 'text')

  const [textItem, setTextItem] = usePersistedState<ContentItem>(
    'sl:xPostLab:text',
    () => makeTextSeed(X_TEXT_SEEDS[0]),
  )
  const [imageItem, setImageItem] = usePersistedState<ContentItem>(
    'sl:xPostLab:image',
    () => makeImageSeed(IMAGE_SEEDS[0]),
  )
  const [reelItem, setReelItem] = usePersistedState<ContentItem>(
    'sl:xPostLab:reel',
    () => makeReelSeed(REEL_SEEDS[0].title),
  )

  const handleGenerate = () => {
    if (activeType === 'text') {
      setTextItem((cur) => generateXTextPost(cur))
    } else if (activeType === 'image') {
      setImageItem((cur) => {
        const seedIdx = findIdxFromTitle(IMAGE_SEEDS, cur.title)
        const generated = generateContentForPost(cur)
        // Truncate caption so it fits a tweet. Don't mutate the original pool.
        const gv = generated.generatedVisual
        const trimmed: ContentItem = {
          ...generated,
          platform: 'X',
          ...(gv ? { generatedVisual: { ...gv, caption: truncateTo(gv.caption, TWEET_CHAR_LIMIT) } } : {}),
        }
        return decorateImageTitle(trimmed, IMAGE_SEEDS[seedIdx])
      })
    } else {
      setReelItem((cur) => {
        const seedIdx = findIdxFromTitle(REEL_SEEDS, cur.title)
        const seed = REEL_SEEDS[seedIdx]
        const generated = generateReelLoungePost(cur, seed.arcId)
        const gv = generated.generatedVisual
        const trimmed: ContentItem = {
          ...generated,
          platform: 'X',
          ...(gv ? { generatedVisual: { ...gv, caption: truncateTo(gv.caption, TWEET_CHAR_LIMIT) } } : {}),
        }
        return decorateReelTitle(trimmed, seed.title)
      })
    }
  }

  const handleShuffle = () => {
    if (activeType === 'text') {
      setTextItem((cur) => {
        const nextIdx = pickDifferentIdx(X_TEXT_SEEDS, findIdxFromTitle(X_TEXT_SEEDS, cur.title))
        return makeTextSeed(X_TEXT_SEEDS[nextIdx])
      })
    } else if (activeType === 'image') {
      setImageItem((cur) => {
        const nextIdx = pickDifferentIdx(IMAGE_SEEDS, findIdxFromTitle(IMAGE_SEEDS, cur.title))
        return makeImageSeed(IMAGE_SEEDS[nextIdx])
      })
    } else {
      setReelItem((cur) => {
        const nextIdx = pickDifferentIdx(REEL_SEEDS, findIdxFromTitle(REEL_SEEDS, cur.title))
        return makeReelSeed(REEL_SEEDS[nextIdx].title)
      })
    }
  }

  const applyTextPatch = (patch: Partial<NonNullable<ContentItem['generatedVisual']>>) => {
    setTextItem((cur) => {
      if (!cur.generatedVisual) return cur
      return { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
    })
  }
  const applyImagePatch = (patch: Partial<NonNullable<ContentItem['generatedVisual']>>) => {
    setImageItem((cur) => {
      if (!cur.generatedVisual) return cur
      return { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
    })
  }
  const applyReelPatch = (patch: Partial<NonNullable<ContentItem['generatedVisual']>>) => {
    setReelItem((cur) => {
      if (!cur.generatedVisual) return cur
      return { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
    })
  }

  const activeItem =
    activeType === 'text' ? textItem : activeType === 'image' ? imageItem : reelItem
  const activeOnResult =
    activeType === 'text' ? applyTextPatch : activeType === 'image' ? applyImagePatch : applyReelPatch

  const tabs: Array<{ id: XFormat; label: string }> = [
    { id: 'text', label: 'Text' },
    { id: 'image', label: 'Image' },
    { id: 'reel', label: 'Reel' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-4" style={{ position: 'relative', textAlign: 'center' }}>
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
              background: 'linear-gradient(135deg, #1d9bf0, #1a8cd8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            𝕏 X Post Lab
          </h1>
        </div>

        <p className="text-center text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Brands post ~60% text · 30% image · 10% reel — pick your format
        </p>

        <div className="flex justify-center mb-6 gap-2">
          {tabs.map((tab) => {
            const active = activeType === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className="text-xs font-bold px-4 py-2 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(29,155,240,.15)' : 'var(--panel-2)',
                  color: active ? '#1d9bf0' : 'var(--muted)',
                  border: `1px solid ${active ? '#1d9bf0' : 'var(--border)'}`,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: 480 }}>
            <XPostCard
              key={activeType}
              item={activeItem}
              format={activeType}
              onShuffle={handleShuffle}
              onGenerate={handleGenerate}
              onVisualResult={activeOnResult}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
