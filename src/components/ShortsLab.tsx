import type { ContentItem, Platform } from '../types'
import XPostCard from './XPostCard'
import { generateReelLoungePost } from '../data/instagramContentTemplates'
import { getReelArc } from '../data/reelArcs'
import { usePersistedState } from '../utils/persistedState'
import { REEL_ARC_SEEDS, formatReelSeedTitle } from '../lib/seeds/reelArc'

interface ShortsLabProps {
  onBack: () => void
}

type ShortsPlatform = 'TikTok' | 'YouTube Shorts'

const SEED_PREFIX = 'Shorts'
const REEL_SEEDS: Array<{ arcId: string; title: string }> = REEL_ARC_SEEDS.map((s) => ({
  arcId: s.arcId,
  title: formatReelSeedTitle(SEED_PREFIX, s),
}))

// Platform-appropriate caption caps. TikTok allows 2200 chars like IG; Shorts
// title maxes at 100 though the description is larger. We cap at the title
// length for Shorts since that's the visible text on the video card.
const CAPTION_LIMITS: Record<ShortsPlatform, number> = {
  TikTok: 2200,
  'YouTube Shorts': 100,
}

function makeSeed(title: string, platform: Platform): ContentItem {
  return {
    platform,
    emoji: '🎬',
    title,
    description: 'Click Generate to build this short-form video.',
    contentType: 'Post',
    generated: false,
  }
}

function truncateTo(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

function findSeedIdx(title: string): number {
  const idx = REEL_SEEDS.findIndex((s) => title.startsWith(s.title))
  return idx >= 0 ? idx : 0
}

function pickDifferentIdx(current: number): number {
  if (REEL_SEEDS.length <= 1) return 0
  let next = Math.floor(Math.random() * REEL_SEEDS.length)
  while (next === current) next = Math.floor(Math.random() * REEL_SEEDS.length)
  return next
}

function decorateTitle(item: ContentItem, seedTitle: string): ContentItem {
  const arcId = item.generatedVisual?.reelArcId
  const name = arcId ? getReelArc(arcId)?.name : undefined
  if (!name) return item
  return { ...item, title: `${seedTitle}  ·  🎞️ ${name}` }
}

export default function ShortsLab({ onBack }: ShortsLabProps) {
  const [activePlatform, setActivePlatform] = usePersistedState<ShortsPlatform>(
    'sl:shortsLab:platform',
    'TikTok',
  )

  const [tiktokItem, setTiktokItem] = usePersistedState<ContentItem>(
    'sl:shortsLab:tiktok',
    () => makeSeed(REEL_SEEDS[0].title, 'TikTok'),
  )
  const [shortsItem, setShortsItem] = usePersistedState<ContentItem>(
    'sl:shortsLab:shorts',
    () => makeSeed(REEL_SEEDS[0].title, 'YouTube Shorts'),
  )

  const isTiktok = activePlatform === 'TikTok'
  const item = isTiktok ? tiktokItem : shortsItem
  const setItem = isTiktok ? setTiktokItem : setShortsItem
  const captionLimit = CAPTION_LIMITS[activePlatform]
  const platformForItem: Platform = isTiktok ? 'TikTok' : 'YouTube Shorts'

  const handleGenerate = () => {
    setItem((cur) => {
      const seedIdx = findSeedIdx(cur.title)
      const seed = REEL_SEEDS[seedIdx]
      const generated = generateReelLoungePost(cur, seed.arcId)
      const gv = generated.generatedVisual
      const trimmed: ContentItem = {
        ...generated,
        platform: platformForItem,
        ...(gv ? { generatedVisual: { ...gv, caption: truncateTo(gv.caption, captionLimit) } } : {}),
      }
      return decorateTitle(trimmed, seed.title)
    })
  }

  const handleShuffle = () => {
    setItem((cur) => {
      const nextIdx = pickDifferentIdx(findSeedIdx(cur.title))
      return makeSeed(REEL_SEEDS[nextIdx].title, platformForItem)
    })
  }

  const handleVisualResult = (patch: Partial<NonNullable<ContentItem['generatedVisual']>>) => {
    setItem((cur) => {
      if (!cur.generatedVisual) return cur
      return { ...cur, generatedVisual: { ...cur.generatedVisual, ...patch } }
    })
  }

  const platforms: Array<{ id: ShortsPlatform; label: string; accent: string }> = [
    { id: 'TikTok', label: 'TikTok', accent: '#ff004f' },
    { id: 'YouTube Shorts', label: 'YouTube Shorts', accent: '#ff0000' },
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
              background: 'linear-gradient(135deg, #ff004f, #ff0000)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎵 Shorts Lab
          </h1>
        </div>

        <p className="text-center text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Short-form vertical video for TikTok & YouTube Shorts — same Veo clip, platform-tuned caption
        </p>

        <div className="flex justify-center mb-6 gap-2">
          {platforms.map((p) => {
            const active = activePlatform === p.id
            return (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className="text-xs font-bold px-4 py-2 rounded-full transition-all"
                style={{
                  background: active ? `${p.accent}22` : 'var(--panel-2)',
                  color: active ? p.accent : 'var(--muted)',
                  border: `1px solid ${active ? p.accent : 'var(--border)'}`,
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: 480 }}>
            <XPostCard
              key={activePlatform}
              item={item}
              format="reel"
              onShuffle={handleShuffle}
              onGenerate={handleGenerate}
              onVisualResult={handleVisualResult}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
