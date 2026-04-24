import { useEffect, useMemo } from 'react'
import type { ContentItem } from '../types'
import XPostCard, { type XFormat } from './XPostCard'
import { X_TEXT_SEEDS, generateXTextPost } from '../data/xPostTemplates'
import { generateContentForPost } from '../data/instagramContentTemplates'
import { getShotTemplate } from '../data/shotTemplates'
import { usePersistedState } from '../utils/persistedState'

interface XPostLabProps {
  onBack: () => void
}

type XLabFormat = 'text' | 'image'

// Seeds reused from Single Image Lab for the Image tab.
const IMAGE_SEEDS = [
  'Single Image — Lifestyle: Cultural Moment',
  'Single Image — Product Centric: New Drop Reveal',
  'Single Image — Education: Flavor Breakdown',
  'Single Image — Entertainment: Hot Take',
  'Single Image — Brand Building: Founder Story',
  'Single Image — Social Proof: First Timer Reaction',
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

// Weighted recommendation: 70% Text, 30% Image. Re-rolled on every mount/reload.
function pickRecommendation(): XLabFormat {
  return Math.random() < 0.7 ? 'text' : 'image'
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

  const recommendation = useMemo(() => pickRecommendation(), [])

  // Auto-select the recommendation on every mount/reload.
  useEffect(() => {
    setActiveType(recommendation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = () => {
    if (activeType === 'text') {
      setTextItem((cur) => generateXTextPost(cur))
    } else if (activeType === 'image') {
      setImageItem((cur) => {
        const seedIdx = findIdxFromTitle(IMAGE_SEEDS, cur.title)
        const generated = generateContentForPost(cur)
        const gv = generated.generatedVisual
        const trimmed: ContentItem = {
          ...generated,
          platform: 'X',
          ...(gv ? { generatedVisual: { ...gv, caption: truncateTo(gv.caption, TWEET_CHAR_LIMIT) } } : {}),
        }
        return decorateImageTitle(trimmed, IMAGE_SEEDS[seedIdx])
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

  const effectiveType: XLabFormat = activeType === 'image' ? 'image' : 'text'
  const activeItem = effectiveType === 'text' ? textItem : imageItem
  const activeOnResult = effectiveType === 'text' ? applyTextPatch : applyImagePatch

  const tabs: Array<{ id: XLabFormat; label: string }> = [
    { id: 'text', label: 'Text' },
    { id: 'image', label: 'Image and Text' },
  ]

  const recLabel = recommendation === 'text' ? 'Text' : 'Image and Text'

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
            𝕏 X Post / Threads Post
          </h1>
        </div>

        <p className="text-center text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Text-first on X &amp; Threads · today's recommendation:{' '}
          <span style={{ color: '#1d9bf0', fontWeight: 700 }}>{recLabel}</span>
        </p>

        <div className="flex justify-center mb-6 gap-2">
          {tabs.map((tab) => {
            const active = activeType === tab.id
            const recommended = recommendation === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className="text-xs font-bold px-4 py-2 rounded-full transition-all"
                style={{
                  background: active ? 'rgba(29,155,240,.15)' : 'var(--panel-2)',
                  color: active ? '#1d9bf0' : 'var(--muted)',
                  border: `1px solid ${active ? '#1d9bf0' : 'var(--border)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{tab.label}</span>
                {recommended && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: 'rgba(29,155,240,.18)',
                      color: '#1d9bf0',
                      border: '1px solid rgba(29,155,240,.4)',
                    }}
                  >
                    ✨ Recommended
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: 480 }}>
            <XPostCard
              key={effectiveType}
              item={activeItem}
              format={effectiveType}
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
