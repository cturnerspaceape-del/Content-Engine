import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Player, Thumbnail } from '@remotion/player'
import type { ContentItem, PostDestination } from '../types'
import { Carousel, Reel } from '../remotion/compositions'
import { buildSlideArc } from '../remotion/compositions/Carousel'
import { getCarouselArc } from '../data/carouselArcs'
import { getFlavorTheme } from '../remotion/flavorThemes'
import type { CarouselProps, ReelProps } from '../remotion/types'
import PostConfirmModal, {
  formatHashtagsForInput,
  parseHashtagInput,
  type PostConfirmOptions,
} from './PostConfirmModal'
import { MAX_CAPTION_LENGTH } from '../lib/instagramCaption'

// Cast components to satisfy Thumbnail/Player LooseComponentType constraint
const ReelComponent = Reel as unknown as React.FC<Record<string, unknown>>
const CarouselComponent = Carousel as unknown as React.FC<Record<string, unknown>>
import { platformColors } from './PlatformContentItem'
import SingleImageVisual from './SingleImageVisual'
import CarouselLoungeVisual from './CarouselLoungeVisual'
import ReelLoungeVisual from './ReelLoungeVisual'

const formatColors: Record<string, string> = {
  'Carousel': '#a855f7',
  'Reel': '#ec4899',
  'Single Image': '#3b82f6',
}

// Gradient pairs for mock visuals
const gradientSets = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
]

function pickGradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return gradientSets[Math.abs(h) % gradientSets.length]
}

function MockVisual({ format, pillar, accentColor }: { format: string; pillar: string; accentColor: string }) {
  const [g1, g2] = pickGradient(pillar + format)
  const bg = `linear-gradient(135deg, ${g1}, ${g2})`

  if (format === 'Reel') {
    return (
      <div className="rounded-lg overflow-hidden mb-3" style={{ background: bg, height: 140, position: 'relative' }}>
        {/* Phone-style vertical video */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.3)', backdropFilter: 'blur(4px)' }}
          >
            <span style={{ color: '#fff', fontSize: 16, marginLeft: 2 }}>▶</span>
          </div>
          <span className="text-[9px] font-bold mt-2" style={{ color: 'rgba(255,255,255,.8)' }}>REEL • 0:15</span>
        </div>
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center gap-1.5" style={{ background: 'rgba(0,0,0,.3)' }}>
          <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,.4)' }} />
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }}>
            <div className="h-1 rounded-full w-1/3" style={{ background: '#fff' }} />
          </div>
        </div>
      </div>
    )
  }

  if (format === 'Carousel') {
    return (
      <div className="flex gap-1.5 mb-3 overflow-hidden rounded-lg" style={{ height: 90 }}>
        {[0, 1, 2, 3].map((i) => {
          const [cg1, cg2] = pickGradient(pillar + format + i)
          return (
            <div
              key={i}
              className="flex-1 rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${cg1}, ${cg2})`,
                minWidth: 50,
                opacity: i === 0 ? 1 : 0.7 - i * 0.15,
              }}
            >
              <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,.7)' }}>
                {i + 1}
              </span>
            </div>
          )
        })}
        <div
          className="flex items-center justify-center rounded-md px-1"
          style={{ background: 'var(--panel-2)', minWidth: 30 }}
        >
          <span className="text-[9px]" style={{ color: 'var(--muted)' }}>+6</span>
        </div>
      </div>
    )
  }

  // Single Image
  return (
    <div className="rounded-lg overflow-hidden mb-3" style={{ background: bg, height: 120, position: 'relative' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,.25)', backdropFilter: 'blur(4px)' }}
        >
          <span className="text-[10px] font-bold" style={{ color: '#fff' }}>📸 1:1</span>
        </div>
      </div>
    </div>
  )
}

function CarouselNav({ current, total, onPrev, onNext }: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <>
      <div style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(0,0,0,0.5)', color: '#fff',
        fontSize: 9, fontWeight: 700, padding: '2px 6px',
        borderRadius: 4, letterSpacing: '0.05em',
      }}>
        {current + 1} / {total}
      </div>
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          style={{
            position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', border: 'none',
            color: '#fff', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ‹
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          style={{
            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', border: 'none',
            color: '#fff', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ›
        </button>
      )}
    </>
  )
}

function ReelModal({ onClose, inputProps }: { onClose: () => void; inputProps: ReelProps }) {
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return createPortal(
    <div
      className="fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close reel preview"
        style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 'max(16px, env(safe-area-inset-right))',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: 'none',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >
        ✕
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter"
        style={{
          width: '100%', maxWidth: 440,
          aspectRatio: '9/16',
          maxHeight: 'calc(100vh - 80px)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        <Player
          component={ReelComponent}
          compositionWidth={1080}
          compositionHeight={1920}
          durationInFrames={450}
          fps={30}
          style={{ width: '100%', height: '100%' }}
          controls
          autoPlay
          inputProps={inputProps}
        />
      </div>
    </div>,
    document.body
  )
}

type VisualPatch = Partial<NonNullable<ContentItem['generatedVisual']>>

interface ContentCardProps {
  item: ContentItem
  index: number
  onShuffle: () => void
  onGenerate: () => void
  onLogPost: () => void
  // Fires the real Instagram publish flow (and optional FB cross-post). If
  // omitted, the "Post to Instagram" button falls back to onLogPost
  // (local-only log). Resolves to undefined when IG succeeds; resolves to a
  // string when the IG post succeeded but the optional FB cross-post failed,
  // so the card can show a non-blocking warning.
  onPost?: (
    destination: PostDestination,
    opts: { alsoFacebook: boolean },
    edits?: { caption?: string; hashtags?: string[] },
  ) => Promise<{ facebookError?: string }>
  // Controls which destinations the confirm modal exposes. Each lab owns the
  // policy (Carousel Lounge: feed-only; Single Image / Reel: feed+story).
  // Defaults to ['feed'] so components that don't opt in never surprise the user.
  allowedDestinations?: PostDestination[]
  // Called by the visual wrapper with fields to merge into the item's
  // generatedVisual. Lab pages wire this to their setItems so results persist
  // to localStorage — which is what makes refresh/remount free (no auto-refetch).
  onVisualResult?: (patch: VisualPatch) => void
}

export default function ContentCard({
  item,
  index,
  onShuffle,
  onGenerate,
  onLogPost,
  onPost,
  allowedDestinations = ['feed'],
  onVisualResult,
}: ContentCardProps) {
  const formatColor = formatColors[item.contentType] || '#a855f7'
  const platformColor = platformColors[item.platform] || formatColor
  const accentColor = formatColor // used by MockVisual + hashtag color
  const isGenerated = item.generated
  const isLogged = item.logged

  const [currentSlide, setCurrentSlide] = useState(0)
  const [reelModalOpen, setReelModalOpen] = useState(false)
  const [postState, setPostState] = useState<'idle' | 'confirming' | 'posting' | 'error'>('idle')
  const [postErrorMessage, setPostErrorMessage] = useState<string | null>(item.postError ?? null)
  const [facebookWarning, setFacebookWarning] = useState<string | null>(item.facebookError ?? null)
  const [cardEditState, setCardEditState] = useState<{
    open: boolean
    captionDraft: string
    hashtagInputDraft: string
  }>({
    open: false,
    captionDraft: '',
    hashtagInputDraft: '',
  })
  const isPosted = Boolean(item.postedToInstagram)
  const isCrossPostedFacebook = Boolean(item.postedToFacebook)

  const canPost = Boolean(onPost) && isGenerated && !isPosted
  // A post is only runnable if the needed asset URL(s) exist — we can't ship
  // a reel whose Veo job hasn't finished yet, etc.
  const hasPostableAsset = (() => {
    const gv = item.generatedVisual
    if (!gv) return false
    if (gv.format === 'Single Image') return Boolean(gv.imageUrl)
    if (gv.format === 'Reel') return Boolean(gv.reelUrl)
    if (gv.format === 'Carousel') {
      const good = (gv.slideUrls ?? []).filter((u): u is string => typeof u === 'string' && u.length > 0)
      return good.length >= 2
    }
    return false
  })()

  const handleConfirmPost = async (
    destination: PostDestination,
    opts: PostConfirmOptions,
    edits?: { caption?: string; hashtags?: string[] },
  ) => {
    if (!onPost) return
    setPostState('posting')
    setPostErrorMessage(null)
    setFacebookWarning(null)
    try {
      const result = await onPost(destination, { alsoFacebook: opts.alsoFacebook }, edits)
      if (result?.facebookError) setFacebookWarning(result.facebookError)
      setPostState('idle')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setPostErrorMessage(msg)
      setPostState('error')
    }
  }

  const applyPatch = (patch: VisualPatch) => {
    if (onVisualResult) onVisualResult(patch)
  }

  // Resolve slide count. When the item was made by Carousel Lounge it carries
  // arcId — the authoritative slide count lives in carouselArcs.ts (the server
  // rejects slideIndex >= arc.slides.length with a 400, so the client MUST
  // match). For the legacy non-Lounge path, fall back to the content-driven
  // buildSlideArc helper.
  const gv = item.generatedVisual
  const loungeArc = gv?.arcId ? getCarouselArc(gv.arcId) : undefined
  const arcLength = loungeArc
    ? loungeArc.slides.length
    : gv
      ? buildSlideArc(
          gv.hook,
          gv.caption,
          gv.flavor || 'Amped Apple',
          getFlavorTheme(gv.flavor || 'Amped Apple').strainType || '',
        ).length
      : 7
  const slideCount = arcLength

  useEffect(() => {
    setCurrentSlide(0)
  }, [arcLength, gv?.hook])

  const titleParts = item.title.split(' — ')
  // Trust the generated format first (typed InstagramFormat) so lab-page title
  // prefixes like "Carousel Lounge —" still land on the Carousel branch below.
  const format = item.generatedVisual?.format ?? titleParts[0] ?? item.contentType
  const pillarSubcat = titleParts[1] || ''
  const pillar = pillarSubcat.split(':')[0]?.trim() || 'General'
  const subcat = pillarSubcat.split(':')[1]?.trim() || ''
  // Avoid "BRAND BUILDING: BRAND BUILDING" duplication
  const titleText = subcat && subcat.toLowerCase() !== pillar.toLowerCase()
    ? `${pillar}: ${subcat}`
    : pillar

  // Split description into lines for display
  const descLines = item.description
    .split('\n')
    .map((l) => l.replace(/^• /, '').trim())
    .filter(Boolean)

  return (
    <div
      className="glass-panel flex flex-col card-enter"
      style={{
        width: '100%',
        animationDelay: `${index * 0.04}s`,
        opacity: isLogged || isPosted ? 0.5 : 1,
      }}
    >
      {/* Top color bar — now reflects the platform */}
      <div
        style={{
          height: 4,
          background: isLogged || isPosted ? '#10b981' : platformColor,
          borderRadius: '16px 16px 0 0',
        }}
      />

      <div className="p-4 flex flex-col flex-1">
        {/* Posted overlay badge */}
        {(isLogged || isPosted) && (
          <div
            className="text-center text-xs font-bold py-1.5 -mx-4 -mt-4 mb-3"
            style={{ background: 'rgba(16,185,129,.1)', color: '#10b981' }}
          >
            {isPosted
              ? item.postedToInstagram?.destination === 'story'
                ? 'Posted to Story ✓'
                : isCrossPostedFacebook
                  ? 'Posted to Instagram + Facebook ✓'
                  : 'Posted to Instagram ✓'
              : 'Posted ✓'}
          </div>
        )}

        {/* Platform + format row */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{ background: `${platformColor}15`, color: platformColor }}
          >
            <span>{item.emoji}</span>
            <span>{item.platform}</span>
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${formatColor}15`, color: formatColor }}
          >
            {format}
          </span>
        </div>

        {/* Title row */}
        <h3
          className="text-xs font-bold uppercase leading-tight mb-3"
          style={{ color: 'var(--text)', letterSpacing: '0.02em' }}
        >
          {titleText}
        </h3>

        {/* Divider */}
        <div className="mb-3" style={{ borderBottom: '1px solid var(--border)' }} />

        {/* Visual preview — Remotion compositions or mock fallback */}
        {isGenerated && item.generatedVisual ? (
          format === 'Single Image' ? (
            <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1' }}>
              <SingleImageVisual
                flavor={(item.generatedVisual.flavor || 'Amped Apple') as React.ComponentProps<typeof SingleImageVisual>['flavor']}
                hook={item.generatedVisual.hook}
                caption={item.generatedVisual.caption}
                hashtags={item.generatedVisual.hashtags}
                pillar={item.generatedVisual.pillar}
                subcategory={item.generatedVisual.subcategory}
                {...(item.generatedVisual.shotTemplateId ? { shotTemplateId: item.generatedVisual.shotTemplateId } : {})}
                {...(typeof item.generatedVisual.imageVariationSeed === 'number'
                  ? { variationSeed: item.generatedVisual.imageVariationSeed }
                  : {})}
                {...(item.generatedVisual.imageUrl ? { imageUrl: item.generatedVisual.imageUrl } : {})}
                {...(item.generatedVisual.imageError ? { imageError: item.generatedVisual.imageError } : {})}
                onResult={(url, error) => {
                  applyPatch({
                    imageUrl: url ?? undefined,
                    imageError: error ?? undefined,
                  })
                }}
              />
            </div>
          ) : format === 'Carousel' ? (
            item.generatedVisual.arcId ? (
              <div className="mb-3">
                <CarouselLoungeVisual
                  flavor={(item.generatedVisual.flavor || 'Amped Apple') as CarouselProps['flavor']}
                  hook={item.generatedVisual.hook}
                  caption={item.generatedVisual.caption}
                  pillar={item.generatedVisual.pillar}
                  subcategory={item.generatedVisual.subcategory}
                  arcId={item.generatedVisual.arcId}
                  slideCount={slideCount}
                  carouselSeed={item.generatedVisual.carouselSeed ?? 0}
                  {...(item.generatedVisual.slideUrls ? { slideUrls: item.generatedVisual.slideUrls } : {})}
                  {...(item.generatedVisual.slideErrors ? { slideErrors: item.generatedVisual.slideErrors } : {})}
                  {...(item.generatedVisual.slideVariationSeeds
                    ? { slideVariationSeeds: item.generatedVisual.slideVariationSeeds }
                    : {})}
                  onSlideResult={(i, url, error, vseed) => {
                    const prevUrls = item.generatedVisual?.slideUrls ?? Array(slideCount).fill(null)
                    const prevErrors = item.generatedVisual?.slideErrors ?? Array(slideCount).fill(null)
                    const prevSeeds = item.generatedVisual?.slideVariationSeeds ?? Array(slideCount).fill(undefined)
                    const nextUrls = prevUrls.slice()
                    const nextErrors = prevErrors.slice()
                    const nextSeeds = prevSeeds.slice()
                    nextUrls[i] = url
                    nextErrors[i] = error
                    nextSeeds[i] = vseed
                    applyPatch({
                      slideUrls: nextUrls,
                      slideErrors: nextErrors,
                      slideVariationSeeds: nextSeeds,
                    })
                  }}
                />
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1', position: 'relative' }}>
                <Thumbnail
                  component={CarouselComponent}
                  compositionWidth={1080}
                  compositionHeight={1080}
                  durationInFrames={slideCount * 45}
                  fps={30}
                  frameToDisplay={Math.min(currentSlide * 45 + 30, slideCount * 45 - 1)}
                  style={{ width: '100%', height: '100%' }}
                  inputProps={{
                    flavor: (item.generatedVisual.flavor || 'Amped Apple') as CarouselProps['flavor'],
                    hook: item.generatedVisual.hook,
                    caption: item.generatedVisual.caption,
                    hashtags: item.generatedVisual.hashtags,
                    pillar: item.generatedVisual.pillar,
                    subcategory: item.generatedVisual.subcategory,
                    layoutTemplate: item.generatedVisual.layoutTemplate || 1,
                    slideCount: slideCount,
                  }}
                />
                <CarouselNav
                  current={currentSlide}
                  total={slideCount}
                  onPrev={() => setCurrentSlide(s => Math.max(0, s - 1))}
                  onNext={() => setCurrentSlide(s => Math.min(slideCount - 1, s + 1))}
                />
              </div>
            )
          ) : format === 'Reel' ? (
            item.generatedVisual.reelArcId ? (
              <ReelLoungeVisual
                flavor={(item.generatedVisual.flavor || 'Amped Apple') as ReelProps['flavor']}
                hook={item.generatedVisual.hook}
                caption={item.generatedVisual.caption}
                pillar={item.generatedVisual.pillar}
                subcategory={item.generatedVisual.subcategory}
                reelArcId={item.generatedVisual.reelArcId}
                reelSeed={item.generatedVisual.reelSeed ?? 0}
                durationSeconds={item.generatedVisual.durationSeconds ?? 8}
                {...(typeof item.generatedVisual.reelVariationSeed === 'number'
                  ? { variationSeed: item.generatedVisual.reelVariationSeed }
                  : {})}
                {...(item.generatedVisual.reelUrl ? { url: item.generatedVisual.reelUrl } : {})}
                {...(item.generatedVisual.reelError ? { error: item.generatedVisual.reelError } : {})}
                onResult={(url, error, vseed) => {
                  applyPatch({
                    reelUrl: url ?? undefined,
                    reelError: error ?? undefined,
                    reelVariationSeed: typeof vseed === 'number' ? vseed : undefined,
                  })
                }}
              />
            ) : (
            <div
              className="rounded-lg overflow-hidden mb-3"
              style={{ maxHeight: 200, position: 'relative', cursor: 'pointer' }}
              onClick={() => setReelModalOpen(true)}
            >
              <Thumbnail
                component={ReelComponent}
                compositionWidth={1080}
                compositionHeight={1920}
                durationInFrames={450}
                fps={30}
                frameToDisplay={90}
                style={{ width: '100%' }}
                inputProps={{
                  flavor: (item.generatedVisual.flavor || 'Amped Apple') as ReelProps['flavor'],
                  hook: item.generatedVisual.hook,
                  caption: item.generatedVisual.caption,
                  hashtags: item.generatedVisual.hashtags,
                  pillar: item.generatedVisual.pillar,
                  subcategory: item.generatedVisual.subcategory,
                  layoutTemplate: item.generatedVisual.layoutTemplate || 1,
                }}
              />
              <div style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.5)', color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '2px 6px',
                borderRadius: 4, letterSpacing: '0.05em',
              }}>
                9:16
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.15)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: 16, marginLeft: 2, color: '#1a1a1a' }}>▶</span>
                </div>
              </div>
            </div>
            )
          ) : (
            <MockVisual format={format} pillar={pillar} accentColor={accentColor} />
          )
        ) : isGenerated ? (
          <MockVisual format={format} pillar={pillar} accentColor={accentColor} />
        ) : null}

        {/* Content area — checklist or generated copy */}
        <div className="flex-1 mb-3 relative">
          {isGenerated
            && !isPosted
            && !isLogged
            && item.generatedVisual?.caption != null
            && (format === 'Single Image' || format === 'Carousel') && (
              <button
                onClick={() =>
                  setCardEditState({
                    open: true,
                    captionDraft: item.generatedVisual?.caption ?? '',
                    hashtagInputDraft: formatHashtagsForInput(item.generatedVisual?.hashtags),
                  })
                }
                title="Edit caption & hashtags"
                aria-label="Edit caption and hashtags"
                className="absolute -top-1 right-0 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all hover:scale-105"
                style={{
                  background: 'var(--panel-2)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                  lineHeight: 1.2,
                  zIndex: 1,
                }}
              >
                ✎ Edit
              </button>
            )}
          {isGenerated ? (
            // Generated content sourced from generatedVisual so caption edits
            // reflect immediately. Ungenerated / legacy items fall back to the
            // static description split.
            (() => {
              const gv = item.generatedVisual
              const generatedLines: Array<{ text: string; kind: 'hook' | 'body' | 'hashtags' }> = []
              if (gv) {
                if (gv.hook) generatedLines.push({ text: gv.hook, kind: 'hook' })
                if (gv.caption) generatedLines.push({ text: gv.caption, kind: 'body' })
                const tags = (gv.hashtags ?? []).filter((t) => typeof t === 'string' && t.length > 0)
                if (tags.length > 0) {
                  const tagLine = tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')
                  generatedLines.push({ text: tagLine, kind: 'hashtags' })
                }
              }
              const lines = generatedLines.length > 0
                ? generatedLines
                : descLines.map((text, i) => ({
                    text,
                    kind:
                      i === 0 ? ('hook' as const) : text.startsWith('#') ? ('hashtags' as const) : ('body' as const),
                  }))
              return lines.map((row, i) => (
                <p
                  key={i}
                  className={`${row.kind === 'hashtags' ? 'text-[10px]' : 'text-[11px]'} leading-snug ${i < lines.length - 1 ? 'mb-1.5' : ''}`}
                  style={{
                    color: row.kind === 'hashtags' ? 'var(--muted)' : 'var(--text)',
                    fontWeight: row.kind === 'hook' ? 700 : 400,
                    fontStyle: row.kind === 'hook' ? 'italic' : 'normal',
                  }}
                >
                  {row.kind === 'hook' ? `"${row.text}"` : row.text}
                </p>
              ))
            })()
          ) : (
            // Checklist instructions
            descLines.map((line, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <span
                  className="mt-px flex-shrink-0 text-[9px] leading-none"
                  style={{ color: '#10b981' }}
                >
                  ✓
                </span>
                <span className="text-[11px] leading-snug" style={{ color: 'var(--text)' }}>
                  {line}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Action buttons */}
        {isLogged || isPosted ? (
          <div
            className="text-center py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(16,185,129,.08)', color: '#10b981' }}
          >
            {isPosted ? 'Posted ✓' : 'Logged ✓'}
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex gap-2">
              <button
                onClick={onShuffle}
                className="flex-1 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                Shuffle
              </button>
              <button
                onClick={onGenerate}
                className="flex-1 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
                style={
                  isGenerated
                    ? {
                        background: 'rgba(16,185,129,.1)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--muted)',
                      }
                }
              >
                {isGenerated ? 'Regenerate' : 'Generate'}
              </button>
              {isGenerated && format === 'Single Image' && (
                <button
                  onClick={() =>
                    applyPatch({
                      imageUrl: undefined,
                      imageError: undefined,
                      imageVariationSeed: Math.floor(Math.random() * 100_000),
                    })
                  }
                  title="Same brief, new output (bypasses cache, costs ~$0.15)"
                  className="py-2 px-3 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(251,146,60,.12)',
                    border: '1px solid #fb923c',
                    color: '#fb923c',
                  }}
                >
                  🎲 Reroll
                </button>
              )}
            </div>
            {/* Primary action: Post to Instagram (falls back to Log Post if no onPost wired). */}
            <button
              onClick={() => {
                if (!canPost || !hasPostableAsset) return
                setPostState('confirming')
              }}
              disabled={!canPost || !hasPostableAsset || postState === 'posting'}
              title={
                !isGenerated
                  ? 'Generate the content first'
                  : !hasPostableAsset
                  ? 'Waiting for the visual to finish generating'
                  : postState === 'error'
                  ? postErrorMessage ?? 'Post failed — click to retry'
                  : undefined
              }
              className="w-full py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={
                postState === 'error'
                  ? {
                      background: 'rgba(239,68,68,.1)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                    }
                  : {
                      background: 'rgba(59,130,246,.1)',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                    }
              }
            >
              {postState === 'posting'
                ? 'Posting…'
                : postState === 'error'
                ? 'Retry Post'
                : onPost
                ? 'Post to Instagram'
                : 'Log Post'}
            </button>
            {postState === 'error' && postErrorMessage && (
              <p className="text-[10px] px-1" style={{ color: '#ef4444' }}>
                {postErrorMessage}
              </p>
            )}
            {postState !== 'error' && facebookWarning && (
              <p className="text-[10px] px-1" style={{ color: '#fb923c' }}>
                IG posted ✓ · Facebook cross-post failed: {facebookWarning}
              </p>
            )}
          </div>
        )}
      </div>

      {reelModalOpen && isGenerated && item.generatedVisual && format === 'Reel' && (
        <ReelModal
          onClose={() => setReelModalOpen(false)}
          inputProps={{
            flavor: (item.generatedVisual.flavor || 'Amped Apple') as ReelProps['flavor'],
            hook: item.generatedVisual.hook,
            caption: item.generatedVisual.caption,
            hashtags: item.generatedVisual.hashtags,
            pillar: item.generatedVisual.pillar,
            subcategory: item.generatedVisual.subcategory,
            layoutTemplate: item.generatedVisual.layoutTemplate || 1,
          }}
        />
      )}

      {postState === 'confirming' && item.generatedVisual && (
        <PostConfirmModal
          item={item}
          allowedDestinations={allowedDestinations}
          onCancel={() => setPostState('idle')}
          onConfirm={(destination, opts, edits) => {
            setPostState('idle')
            void handleConfirmPost(destination, opts, edits)
          }}
        />
      )}

      {cardEditState.open && item.generatedVisual && (
        <CaptionEditDialog
          captionDraft={cardEditState.captionDraft}
          hashtagInputDraft={cardEditState.hashtagInputDraft}
          onCaptionChange={(captionDraft) =>
            setCardEditState((prev) => ({ ...prev, captionDraft }))
          }
          onHashtagsChange={(hashtagInputDraft) =>
            setCardEditState((prev) => ({ ...prev, hashtagInputDraft }))
          }
          onCancel={() =>
            setCardEditState({ open: false, captionDraft: '', hashtagInputDraft: '' })
          }
          onSave={() => {
            applyPatch({
              caption: cardEditState.captionDraft,
              hashtags: parseHashtagInput(cardEditState.hashtagInputDraft),
            })
            setCardEditState({ open: false, captionDraft: '', hashtagInputDraft: '' })
          }}
        />
      )}
    </div>
  )
}

function CaptionEditDialog({
  captionDraft,
  hashtagInputDraft,
  onCaptionChange,
  onHashtagsChange,
  onCancel,
  onSave,
}: {
  captionDraft: string
  hashtagInputDraft: string
  onCaptionChange: (v: string) => void
  onHashtagsChange: (v: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const overLimit = captionDraft.length > MAX_CAPTION_LENGTH
  const parsedTags = parseHashtagInput(hashtagInputDraft)
  const overTagLimit = parsedTags.length > 30

  return createPortal(
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10_000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        padding: 16,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="caption-edit-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: 16,
          padding: 20,
          background: 'var(--panel)',
        }}
      >
        <h2
          id="caption-edit-title"
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--text)' }}
        >
          Edit caption & hashtags
        </h2>

        <textarea
          value={captionDraft}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={6}
          autoFocus
          className="w-full rounded-lg p-3 text-[12px] leading-snug mb-1"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div
          className="text-[10px] mb-4"
          style={{ color: overLimit ? '#ef4444' : 'var(--muted)' }}
        >
          {captionDraft.length} / {MAX_CAPTION_LENGTH}
          {overLimit && ' — will be truncated when posted'}
        </div>

        <input
          type="text"
          value={hashtagInputDraft}
          onChange={(e) => onHashtagsChange(e.target.value)}
          placeholder="#spaceape #liveresin #premium"
          className="w-full rounded-lg p-2.5 text-[12px] mb-1"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'inherit',
          }}
        />
        <div
          className="text-[10px] mb-4"
          style={{ color: overTagLimit ? '#ef4444' : 'var(--muted)' }}
        >
          Separated by spaces. {parsedTags.length} tag{parsedTags.length === 1 ? '' : 's'}
          {overTagLimit && ' — IG caps at 30; extras will be dropped'}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: '1px solid var(--accent)',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
