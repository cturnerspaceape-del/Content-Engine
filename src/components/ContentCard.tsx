import { useState, useEffect } from 'react'
import type { ContentItem, PostDestination } from '../types'
import { buildSlideArc } from '../remotion/compositions/Carousel'
import { getCarouselArc } from '../data/carouselArcs'
import { getFlavorTheme } from '../remotion/flavorThemes'
import PostConfirmModal, { type PostConfirmOptions } from './PostConfirmModal'
import { platformColors } from './PlatformContentItem'
import { formatColors } from './ContentCard/constants'
import { VisualPreview } from './ContentCard/VisualPreview'
import { ContentArea } from './ContentCard/ContentArea'
import { ActionButtons } from './ContentCard/ActionButtons'

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
  // policy (Carousel Lounge: feed-only; Single Image: feed+story).
  // Defaults to ['feed'] so components that don't opt in never surprise the user.
  allowedDestinations?: PostDestination[]
  // Called by the visual wrapper with fields to merge into the item's
  // generatedVisual. Lab pages wire this to their setItems so results persist
  // to localStorage — which is what makes refresh/remount free (no auto-refetch).
  onVisualResult?: (patch: VisualPatch) => void
  // Image Lab opt-ins for a less redundant UI: lab page owns generate/post via
  // its own bottom-of-page buttons, so the in-card duplicates are hidden.
  hideHeaderBadges?: boolean
  hideShuffleGenerate?: boolean
  hidePostButton?: boolean
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
  hideHeaderBadges = false,
  hideShuffleGenerate = false,
  hidePostButton = false,
}: ContentCardProps) {
  const formatColor = formatColors[item.contentType] || '#a855f7'
  const platformColor = platformColors[item.platform] || formatColor
  const accentColor = formatColor // used by MockVisual + hashtag color
  const isGenerated = item.generated ?? false
  const isLogged = item.logged ?? false

  const [currentSlide, setCurrentSlide] = useState(0)
  const [postState, setPostState] = useState<'idle' | 'confirming' | 'posting' | 'error'>('idle')
  const [postErrorMessage, setPostErrorMessage] = useState<string | null>(item.postError ?? null)
  const [facebookWarning, setFacebookWarning] = useState<string | null>(item.facebookError ?? null)
  const isPosted = Boolean(item.postedToInstagram)
  const isCrossPostedFacebook = Boolean(item.postedToFacebook)

  const canPost = Boolean(onPost) && isGenerated && !isPosted
  // A post is only runnable if the needed asset URL(s) exist.
  const hasPostableAsset = (() => {
    const gv = item.generatedVisual
    if (!gv) return false
    if (gv.format === 'Single Image') return Boolean(gv.imageUrl)
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

  // Resolve slide count. Priority order:
  //   1. Research-driven slides (slideCount == researchSlides.length) — wins
  //      when the selected research result defined the arc itself.
  //   2. Static Lounge arc lookup via carouselArcs.ts.
  //   3. Legacy non-Lounge buildSlideArc fallback.
  // Server validates slideIndex against the array length, so client must match.
  const gv = item.generatedVisual
  const loungeArc = gv?.arcId ? getCarouselArc(gv.arcId) : undefined
  const arcLength =
    gv?.researchSlides && gv.researchSlides.length >= 2
      ? gv.researchSlides.length
      : loungeArc
        ? loungeArc.slides.length
        : gv?.slideCount && gv.slideCount >= 2
          ? gv.slideCount
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
        {!hideHeaderBadges && (
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
        )}

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
        <VisualPreview
          item={item}
          format={format}
          pillar={pillar}
          accentColor={accentColor}
          slideCount={slideCount}
          currentSlide={currentSlide}
          onSlideChange={setCurrentSlide}
          applyPatch={applyPatch}
        />

        {/* Content area — checklist or generated copy */}
        <ContentArea
          item={item}
          format={format}
          isGenerated={isGenerated}
          isPosted={isPosted}
          isLogged={isLogged}
          descLines={descLines}
          applyPatch={applyPatch}
        />

        {/* Action buttons */}
        {isLogged || isPosted ? (
          <div
            className="text-center py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(16,185,129,.08)', color: '#10b981' }}
          >
            {isPosted ? 'Posted ✓' : 'Logged ✓'}
          </div>
        ) : (
          <ActionButtons
            format={format}
            isGenerated={isGenerated}
            hideShuffleGenerate={hideShuffleGenerate}
            hidePostButton={hidePostButton}
            onShuffle={onShuffle}
            onGenerate={onGenerate}
            applyPatch={applyPatch}
            canPost={canPost}
            hasPostableAsset={hasPostableAsset}
            postState={postState}
            setPostState={setPostState}
            postErrorMessage={postErrorMessage}
            facebookWarning={facebookWarning}
            hasOnPost={Boolean(onPost)}
          />
        )}
      </div>

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
    </div>
  )
}
