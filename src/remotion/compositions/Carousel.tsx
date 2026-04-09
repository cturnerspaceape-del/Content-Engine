import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { getFlavorTheme } from '../flavorThemes'
import type { CarouselProps, FlavorTheme } from '../types'
import {
  StickerStar, Daisy, Heart, Sparkle, Blob, StickerFrame, SpeechBubble, WavyDivider, Ring, ProductImg,
  polkaDotBg, stripesBg, checkerboardBg, diagonalHatchBg, concentricCirclesBg,
  seededStripesBg, seededPolkaDotBg,
  outlinedTextStyle, boldShadowStyle, bouncySpring, brightBg,
  seedFromText, seededInt, seededRange, seededPick,
  headingFont, bodyFont, accentFont, handFont,
  getVisualMode, getBadgeLabel, BadgeOverlay, StepIndicator, ComparisonDivider, QuoteFrame, ShelfLines,
  type VisualMode,
  GrainOverlay, VignetteOverlay, GlossHighlight,
  saturateColor, lightenColor, darkenColor,
  themeShadow, clampText,
} from '../components/shared'

const FRAMES_PER_SLIDE = 45

// ─── Slide dots — 4 variants ───

function SlideDots({ current, total, variant, color }: { current: number; total: number; variant: 'circle' | 'dash' | 'pill' | 'glow'; color: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: variant === 'dash' ? 6 : 10,
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === current
        if (variant === 'dash') {
          return <div key={i} style={{
            width: active ? 32 : 16, height: 6, borderRadius: 3,
            background: active ? '#fff' : '#ffffff40',
          }} />
        }
        if (variant === 'pill') {
          return <div key={i} style={{
            width: 10, height: active ? 28 : 14, borderRadius: 5,
            background: active ? color : '#ffffff30',
            border: active ? '2px solid #fff' : 'none',
          }} />
        }
        if (variant === 'glow') {
          return <div key={i} style={{
            width: active ? 16 : 10, height: active ? 16 : 10, borderRadius: '50%',
            background: active ? color : '#ffffff30',
            boxShadow: active ? `0 0 12px ${color}, 0 0 4px #fff` : 'none',
          }} />
        }
        // circle (default)
        return <div key={i} style={{
          width: active ? 28 : 14, height: 14, borderRadius: 7,
          background: active ? '#fff' : '#ffffff40',
          border: active ? `2px solid ${color}` : '2px solid #ffffff30',
        }} />
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 1 — SlideStack: "Sticker Collage"
// Oswald + Inter, heavy decorations, seeded stripes, SpeechBubble CTA
// ═══════════════════════════════════════════════════════════

function SlideStack({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const enterScale = bouncySpring(Math.round(slideProgress * FRAMES_PER_SLIDE), 30)

  // Seeded content order for middle slides
  const middleTypes = ['benefit', 'flavor', 'detail'] as const
  const shuffledTypes = [
    middleTypes[seed % 3],
    middleTypes[(seed + 1) % 3],
    middleTypes[(seed + 2) % 3],
  ]

  function getContent(index: number) {
    if (index === 0) return { type: 'hook' as const, text: hook }
    if (index === totalSlides - 1) return { type: 'cta' as const, text: 'Follow @SpaceApe for more' }
    const mid = index - 1
    const t = shuffledTypes[mid % 3]
    if (t === 'benefit') {
      const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 10)
      return { type: 'benefit' as const, text: sentences[mid % Math.max(sentences.length, 1)]?.trim() || caption.slice(0, 80) }
    }
    if (t === 'flavor') return { type: 'flavor' as const, text: flavor }
    return { type: 'detail' as const, text: theme.strainType || 'Ultra Premium • Live Resin' }
  }

  const content = getContent(slideIndex)

  // Seeded decoration positions
  const deco = {
    s1x: seededRange(seed, slideIndex * 10, 40, 950), s1y: seededRange(seed, slideIndex * 10 + 1, 40, 200),
    s1rot: seededRange(seed, slideIndex * 10 + 2, -30, 30), s1size: seededRange(seed, slideIndex * 10 + 3, 36, 56),
    d1x: seededRange(seed, slideIndex * 10 + 4, 30, 900), d1y: seededRange(seed, slideIndex * 10 + 5, 800, 960),
    h1x: seededRange(seed, slideIndex * 10 + 6, 850, 1000), h1y: seededRange(seed, slideIndex * 10 + 7, 400, 700),
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${0.85 + enterScale * 0.15})`,
        opacity: interpolate(slideProgress, [0, 0.1, 1], [0, 1, 1], { extrapolateRight: 'clamp' }),
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          ...(content.type === 'cta'
            ? seededPolkaDotBg(seed, `${theme.primaryColor}20`, brightBg(theme.primaryColor))
            : seededStripesBg(seed + slideIndex, theme.primaryColor, theme.accentColor)),
        }} />

        {content.type === 'hook' && (
          <>
            <Blob x={150} y={80} size={550} color={`${theme.backgroundColor}20`} variant={seed % 3} />
            <div style={{ position: 'absolute', top: 55, left: 60, fontFamily: headingFont, fontSize: 28, fontWeight: 700, letterSpacing: '0.06em', ...outlinedTextStyle('#fff', 'rgba(0,0,0,0.3)', 2) }}>
              SPACE APE
            </div>
            <div style={{ position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', height: 480, alignItems: 'center' }}>
              <StickerFrame borderWidth={6} borderRadius={26} rotation={seededRange(seed, 0, -5, 5)}>
                <ProductImg src={mainImg} style={{ maxWidth: 380, maxHeight: 380, filter: themeShadow(theme.primaryColor, 'medium') }} />
              </StickerFrame>
            </div>
            <div style={{ position: 'absolute', bottom: 75, left: 60, right: 60, fontFamily: headingFont, fontSize: 50, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.05, ...outlinedTextStyle('#fff', theme.backgroundColor, 3) }}>
              {content.text}
            </div>
          </>
        )}

        {content.type === 'benefit' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 70 }}>
            <div style={{ fontFamily: headingFont, fontSize: 46, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.15, textAlign: 'center', ...boldShadowStyle('#fff', 'rgba(0,0,0,0.2)', 4) }}>
              {content.text}
            </div>
          </div>
        )}

        {content.type === 'flavor' && (
          <>
            <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', height: 500, alignItems: 'center' }}>
              <StickerFrame borderWidth={6} borderRadius={26} rotation={seededRange(seed, 5, -4, 4)}>
                <ProductImg src={mainImg} style={{ maxWidth: 400, maxHeight: 400, filter: themeShadow(theme.primaryColor, 'medium') }} />
              </StickerFrame>
            </div>
            <div style={{ position: 'absolute', bottom: 110, left: 60, right: 60, fontFamily: headingFont, fontSize: 64, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.0, textAlign: 'center', ...outlinedTextStyle('#fff', theme.backgroundColor, 3) }}>
              {content.text}
            </div>
          </>
        )}

        {content.type === 'detail' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
            <StickerFrame borderWidth={5} borderRadius={24} rotation={seededRange(seed, 8, -3, 3)}>
              <ProductImg src={images[seededInt(seed, 20, 0, images.length - 1)]} style={{ maxWidth: 420, maxHeight: 420, filter: themeShadow(theme.primaryColor, 'medium') }} />
            </StickerFrame>
            <div style={{ fontFamily: headingFont, fontSize: 36, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', ...boldShadowStyle('#fff', 'rgba(0,0,0,0.2)', 3) }}>
              {content.text}
            </div>
          </div>
        )}

        {content.type === 'cta' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ fontFamily: headingFont, fontSize: 44, fontWeight: 700, letterSpacing: '0.06em', ...outlinedTextStyle(theme.primaryColor, '#fff', 3) }}>
              SPACE APE
            </div>
            <SpeechBubble x={280} y={480} width={520} height={100} color={theme.primaryColor} borderColor="#fff" borderWidth={4} />
            <div style={{ position: 'relative', zIndex: 1, fontFamily: headingFont, fontSize: 30, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', ...boldShadowStyle('#fff', 'rgba(0,0,0,0.15)', 3), marginTop: -70 }}>
              {content.text}
            </div>
            <div style={{ background: theme.primaryColor, color: '#fff', fontFamily: headingFont, fontSize: 22, fontWeight: 700, padding: '16px 48px', borderRadius: 40, textTransform: 'uppercase', border: '3px solid #fff', boxShadow: '4px 5px 0px rgba(0,0,0,0.12)', marginTop: 20 }}>
              Follow Us
            </div>
          </div>
        )}

        {/* Seeded decorations */}
        <StickerStar x={deco.s1x} y={deco.s1y} size={deco.s1size} color="#fff" strokeWidth={2.5} fill={`${theme.accentColor}35`} rotation={deco.s1rot} />
        <Daisy x={deco.d1x} y={deco.d1y} size={40} petalColor={`${theme.accentColor}40`} centerColor="#fff" rotation={deco.s1rot * -1} />
        <Heart x={deco.h1x} y={deco.h1y} size={30} color="#fff" fill={`${theme.primaryColor}30`} strokeWidth={2} rotation={deco.s1rot + 10} />

        {/* Visual mode overlays */}
        {badgeLabel && slideIndex === 0 && <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} />}
        {mode === 'process' && <StepIndicator step={slideIndex + 1} total={totalSlides} color={theme.primaryColor} />}
        {mode === 'spotlight' && slideIndex === 0 && <ShelfLines y={600} width={1080} color="#fff" count={3} />}
        {mode === 'comparison' && slideIndex > 0 && slideIndex < totalSlides - 1 && <ComparisonDivider width={1080} height={1080} color={theme.primaryColor} />}
      </div>
      <SlideDots current={slideIndex} total={totalSlides} variant="circle" color={theme.primaryColor} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 2 — MagazineSpread: "Editorial Clean"
// Space Grotesk + Inter, minimal decorations, polka/checker, editorial flow
// ═══════════════════════════════════════════════════════════

function MagazineSpread({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const imgIdx = slideIndex % images.length
  const mainImg = images[imgIdx]
  const enterOpacity = interpolate(slideProgress, [0, 0.15, 1], [0, 1, 1], { extrapolateRight: 'clamp' })
  const isEven = slideIndex % 2 === 0

  // Fixed editorial arc: hook → product-hero → editorial-text → flavor-feature → CTA
  function getContent(index: number) {
    if (index === 0) return { type: 'hook' as const, text: hook }
    if (index === totalSlides - 1) return { type: 'cta' as const, text: 'Follow @SpaceApe for more' }
    const phase = ((index - 1) % 3)
    if (phase === 0) return { type: 'hero' as const, text: '' }
    if (phase === 1) {
      const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 10)
      return { type: 'editorial' as const, text: sentences[index % Math.max(sentences.length, 1)]?.trim() || caption.slice(0, 80) }
    }
    return { type: 'flavor' as const, text: flavor }
  }

  const content = getContent(slideIndex)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, opacity: enterOpacity }}>
        {/* Background — 4-variant pattern rotation */}
        <div style={{
          position: 'absolute', inset: 0,
          ...([
            seededPolkaDotBg(seed + slideIndex, `${theme.primaryColor}15`, '#FAF7F2'),
            checkerboardBg(`${theme.primaryColor}12`, '#FAF7F2', 36 + (seed % 20)),
            concentricCirclesBg(`${theme.primaryColor}12`, '#FAF7F2', 60 + (seed % 30)),
            stripesBg(`${theme.primaryColor}10`, '#FAF7F2', 135, 32 + (seed % 16)),
          ][slideIndex % 4]),
        }} />

        {/* Minimal blob decorations */}
        <Blob x={isEven ? 820 : -60} y={isEven ? -40 : 780} size={280} color={`${theme.primaryColor}10`} variant={(seed + slideIndex) % 3} />

        {content.type === 'hook' && (
          <>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 680,
              ...seededStripesBg(seed, theme.primaryColor, theme.accentColor),
              display: 'flex', justifyContent: 'center', alignItems: 'center',
            }}>
              <StickerFrame borderWidth={6} borderRadius={28} rotation={seededRange(seed, 0, -3, 3)}>
                <ProductImg src={mainImg} style={{ maxWidth: 440, maxHeight: 440, filter: themeShadow(theme.primaryColor, 'medium') }} />
              </StickerFrame>
            </div>
            <div style={{ position: 'absolute', top: 40, left: 50, fontFamily: accentFont, fontSize: 28, fontWeight: 700, letterSpacing: '0.04em', ...outlinedTextStyle('#fff', 'rgba(0,0,0,0.3)', 2) }}>
              SPACE APE
            </div>
            <div style={{ position: 'absolute', bottom: 50, left: 60, right: 60, fontFamily: accentFont, fontSize: 46, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.05, ...outlinedTextStyle(theme.primaryColor, '#fff', 3) }}>
              {content.text}
            </div>
          </>
        )}

        {content.type === 'hero' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StickerFrame borderWidth={7} borderRadius={30} rotation={seededRange(seed, slideIndex, -4, 4)}>
              <ProductImg src={mainImg} style={{ maxWidth: 520, maxHeight: 520, filter: themeShadow(theme.primaryColor, 'medium') }} />
            </StickerFrame>
          </div>
        )}

        {content.type === 'editorial' && (
          <>
            <div style={{
              position: 'absolute', top: 0, [isEven ? 'left' : 'right']: 0,
              width: '50%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isEven ? theme.primaryColor : 'transparent',
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 380, maxHeight: 380, filter: themeShadow(theme.primaryColor, 'medium') }} />
            </div>
            <div style={{
              position: 'absolute', top: 0, [isEven ? 'right' : 'left']: 0,
              width: '50%', height: '100%',
              display: 'flex', alignItems: 'center', padding: 50,
            }}>
              <div style={{ fontFamily: accentFont, fontSize: 38, fontWeight: 600, lineHeight: 1.2, color: isEven ? theme.primaryColor : theme.backgroundColor, ...clampText(3) }}>
                {content.text}
              </div>
            </div>
            <WavyDivider y={520} width={1080} color={`${theme.primaryColor}30`} amplitude={15} strokeWidth={2} />
          </>
        )}

        {content.type === 'flavor' && (
          <div style={{
            position: 'absolute', inset: 0,
            ...seededStripesBg(seed + 99, theme.primaryColor, theme.accentColor),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
          }}>
            <StickerFrame borderWidth={7} borderRadius={28} rotation={-3}>
              <ProductImg src={mainImg} style={{ maxWidth: 360, maxHeight: 360, filter: themeShadow(theme.primaryColor, 'medium') }} />
            </StickerFrame>
            <div style={{ fontFamily: accentFont, fontSize: 56, fontWeight: 700, textTransform: 'uppercase', ...outlinedTextStyle('#fff', theme.backgroundColor, 3) }}>
              {flavor}
            </div>
          </div>
        )}

        {content.type === 'cta' && (
          <div style={{
            position: 'absolute', inset: 0,
            ...seededPolkaDotBg(seed, `${theme.primaryColor}12`, '#FAF7F2'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
          }}>
            <div style={{ fontFamily: accentFont, fontSize: 46, fontWeight: 700, letterSpacing: '0.04em', color: theme.primaryColor }}>
              SPACE APE
            </div>
            <div style={{ fontFamily: accentFont, fontSize: 20, fontWeight: 500, color: theme.backgroundColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Ultra Premium • Live Resin
            </div>
            <div style={{ background: theme.primaryColor, color: '#fff', fontFamily: accentFont, fontSize: 20, fontWeight: 600, padding: '14px 48px', borderRadius: 12 }}>
              Follow Us
            </div>
          </div>
        )}

        {/* Visual mode overlays */}
        {badgeLabel && slideIndex === 0 && <BadgeOverlay label={badgeLabel} color={theme.primaryColor} bgColor="#fff" />}
        {mode === 'process' && <StepIndicator step={slideIndex + 1} total={totalSlides} color={theme.primaryColor} />}
        {mode === 'spotlight' && slideIndex === 0 && <ShelfLines y={620} width={1080} color={theme.primaryColor} count={3} />}
      </div>
      <SlideDots current={slideIndex} total={totalSlides} variant="dash" color={theme.primaryColor} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 3 — BoldTypography: "Marker/Street"
// Permanent Marker + Inter, hatch pattern, text-dominant, minimal product
// ═══════════════════════════════════════════════════════════

function BoldTypography({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[0]
  const enterScale = bouncySpring(Math.round(slideProgress * FRAMES_PER_SLIDE), 30)
  const isEven = slideIndex % 2 === 0

  // Text-dominant: every middle slide is bold text, no product
  function getContent(index: number) {
    if (index === 0) return { type: 'hook' as const, text: hook }
    if (index === totalSlides - 1) return { type: 'cta' as const, text: 'Follow @SpaceApe' }
    const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 10)
    if ((index - 1) % 3 === 1) return { type: 'flavor' as const, text: flavor }
    const si = (index - 1) % Math.max(sentences.length, 1)
    return { type: 'quote' as const, text: sentences[si]?.trim() || caption.slice(0, 80) }
  }

  const content = getContent(slideIndex)
  const sparkleX = seededRange(seed, slideIndex * 5, 60, 950)
  const sparkleY = seededRange(seed, slideIndex * 5 + 1, 60, 950)
  const sparkleSize = seededRange(seed, slideIndex * 5 + 2, 30, 60)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${0.8 + enterScale * 0.2})`,
      }}>
        {/* Rotating solid / hatch / stripe backgrounds */}
        <div style={{
          position: 'absolute', inset: 0,
          ...([
            { background: theme.backgroundColor },
            diagonalHatchBg(`${theme.accentColor}30`, theme.primaryColor, 6, 20),
            stripesBg(`${theme.accentColor}20`, theme.primaryColor, 135, 28),
          ][slideIndex % 3]),
        }} />

        {/* Few bold sparkles */}
        <Sparkle x={sparkleX} y={sparkleY} size={sparkleSize} color={isEven ? theme.primaryColor : '#fff'} rotation={seed % 45} />

        {content.type === 'hook' && (
          <>
            <div style={{ position: 'absolute', inset: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: handFont, fontSize: 78, fontWeight: 400, textTransform: 'uppercase', lineHeight: 1.0, color: isEven ? theme.primaryColor : '#fff', transform: `rotate(${seededRange(seed, 0, -1.5, 1.5)}deg)` }}>
                {content.text}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 50, right: 50 }}>
              <StickerFrame borderWidth={4} borderRadius={16} rotation={seededRange(seed, 1, 3, 8)}>
                <ProductImg src={mainImg} style={{ maxWidth: 380, maxHeight: 380, filter: themeShadow(theme.primaryColor, 'medium') }} />
              </StickerFrame>
            </div>
            <div style={{ position: 'absolute', top: 50, left: 60, fontFamily: handFont, fontSize: 26, fontWeight: 400, color: `${isEven ? theme.primaryColor : '#fff'}AA`, letterSpacing: '0.06em' }}>
              SPACE APE
            </div>
          </>
        )}

        {content.type === 'quote' && (
          <div style={{ position: 'absolute', inset: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: handFont, fontSize: 58, fontWeight: 400, lineHeight: 1.1, color: isEven ? theme.primaryColor : '#fff', transform: `rotate(${seededRange(seed, slideIndex, -1.5, 1.5)}deg)` }}>
              "{content.text}"
            </div>
          </div>
        )}

        {content.type === 'flavor' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              fontFamily: handFont, fontSize: 100, fontWeight: 400, textTransform: 'uppercase',
              lineHeight: 0.95, textAlign: 'center', padding: '0 40px',
              color: isEven ? theme.primaryColor : '#fff',
              transform: `rotate(${seededRange(seed, 30, -2, 2)}deg)`,
            }}>
              {flavor}
            </div>
            <Sparkle x={850} y={120} size={35} color={theme.accentColor} rotation={-15} />
          </div>
        )}

        {content.type === 'cta' && (
          <div style={{
            position: 'absolute', inset: 0,
            ...seededStripesBg(seed, theme.primaryColor, theme.accentColor),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
          }}>
            <div style={{ fontFamily: handFont, fontSize: 80, fontWeight: 400, color: '#fff', textAlign: 'center', lineHeight: 1.0, padding: '0 50px', transform: 'rotate(-2deg)' }}>
              {content.text}
            </div>
            <div style={{ fontFamily: handFont, fontSize: 32, fontWeight: 400, color: '#ffffffBB', letterSpacing: '0.08em' }}>
              SPACE APE
            </div>
          </div>
        )}

        {badgeLabel && slideIndex === 0 && <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} rotation={-8} />}
        {mode === 'hottake' && slideIndex === 0 && (
          <div style={{ position: 'absolute', bottom: 60, right: 60, fontFamily: handFont, fontSize: 80, fontWeight: 400, color: `${theme.accentColor}25`, transform: 'rotate(10deg)' }}>?!</div>
        )}
      </div>
      <SlideDots current={slideIndex} total={totalSlides} variant="pill" color={theme.primaryColor} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 4 — NeonGlow: "Dark Atmospheric"
// Oswald + Space Grotesk, gradient mesh, Sparkle + Ring only, glow effects
// ═══════════════════════════════════════════════════════════

function NeonGlow({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const enterOpacity = interpolate(slideProgress, [0, 0.2, 1], [0, 1, 1], { extrapolateRight: 'clamp' })
  const enterY = interpolate(slideProgress, [0, 0.2, 1], [20, 0, 0], { extrapolateRight: 'clamp' })

  // Atmospheric content: hook → product glow → flavor neon → detail → CTA
  function getContent(index: number) {
    if (index === 0) return { type: 'hook' as const, text: hook }
    if (index === totalSlides - 1) return { type: 'cta' as const, text: 'Follow @SpaceApe' }
    const phase = (index - 1) % 3
    if (phase === 0) return { type: 'glow-product' as const, text: '' }
    if (phase === 1) return { type: 'neon-flavor' as const, text: flavor }
    const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 10)
    return { type: 'detail' as const, text: sentences[index % Math.max(sentences.length, 1)]?.trim() || caption.slice(0, 80) }
  }

  const content = getContent(slideIndex)
  const glowRadius = seededRange(seed, slideIndex, 40, 80)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: enterOpacity,
        transform: `translateY(${enterY}px)`,
      }}>
        {/* Dark base with gradient mesh */}
        <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 30% 40%, ${theme.primaryColor}70 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, ${theme.accentColor}60 0%, transparent 45%)
          `,
        }} />
        {/* Concentric circles overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, ...concentricCirclesBg(theme.accentColor, 'transparent', 60 + (seed % 40)) }} />

        {/* Ring + Sparkle decorations only */}
        <Ring x={seededRange(seed, slideIndex * 3, -40, 100)} y={seededRange(seed, slideIndex * 3 + 1, -40, 100)} size={seededRange(seed, slideIndex * 3 + 2, 150, 250)} color={`${theme.accentColor}20`} thickness={2} />
        <Sparkle x={seededRange(seed, slideIndex * 7, 800, 1000)} y={seededRange(seed, slideIndex * 7 + 1, 100, 300)} size={seededRange(seed, slideIndex * 7 + 2, 20, 36)} color={theme.accentColor} rotation={seed % 45} />
        <Sparkle x={seededRange(seed, slideIndex * 7 + 3, 40, 200)} y={seededRange(seed, slideIndex * 7 + 4, 750, 950)} size={seededRange(seed, slideIndex * 7 + 5, 18, 28)} color="#fff" rotation={(seed + 20) % 45} />

        {content.type === 'hook' && (
          <>
            <div style={{ position: 'absolute', top: 50, left: 50, fontFamily: headingFont, fontSize: 26, fontWeight: 700, letterSpacing: '0.06em', ...outlinedTextStyle(theme.accentColor, 'rgba(0,0,0,0.4)', 2) }}>
              SPACE APE
            </div>
            <div style={{ position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', height: 480, alignItems: 'center' }}>
              <ProductImg src={mainImg} style={{ maxWidth: 400, maxHeight: 400, filter: themeShadow(theme.primaryColor, 'medium') }} />
            </div>
            <div style={{ position: 'absolute', bottom: 75, left: 60, right: 60, fontFamily: headingFont, fontSize: 50, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.05, ...outlinedTextStyle('#fff', theme.backgroundColor, 3), textShadow: `0 0 30px ${theme.primaryColor}60` }}>
              {content.text}
            </div>
          </>
        )}

        {content.type === 'glow-product' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProductImg src={mainImg} style={{ maxWidth: 520, maxHeight: 520, filter: themeShadow(theme.primaryColor, 'dramatic') }} />
          </div>
        )}

        {content.type === 'neon-flavor' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <div style={{ fontFamily: headingFont, fontSize: 70, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.0, ...outlinedTextStyle(theme.accentColor, theme.backgroundColor, 3), textShadow: `0 0 40px ${theme.accentColor}50` }}>
              {content.text}
            </div>
          </div>
        )}

        {content.type === 'detail' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 70 }}>
            <div style={{ fontFamily: accentFont, fontSize: 38, fontWeight: 500, lineHeight: 1.3, textAlign: 'center', color: '#ffffffCC', textShadow: `0 0 20px ${theme.primaryColor}40` }}>
              {content.text}
            </div>
          </div>
        )}

        {content.type === 'cta' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
            <div style={{ fontFamily: headingFont, fontSize: 46, fontWeight: 700, letterSpacing: '0.06em', ...outlinedTextStyle(theme.accentColor, theme.backgroundColor, 3), textShadow: `0 0 25px ${theme.accentColor}40` }}>
              SPACE APE
            </div>
            <div style={{ fontFamily: accentFont, fontSize: 16, fontWeight: 500, color: '#ffffff50', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Ultra Premium • Live Resin
            </div>
            <div style={{ border: `3px solid ${theme.accentColor}`, color: theme.accentColor, fontFamily: headingFont, fontSize: 20, fontWeight: 700, padding: '14px 44px', borderRadius: 40, textTransform: 'uppercase', boxShadow: `0 0 20px ${theme.accentColor}40, 4px 5px 0px ${theme.backgroundColor}` }}>
              {content.text}
            </div>
          </div>
        )}

        {badgeLabel && slideIndex === 0 && <BadgeOverlay label={badgeLabel} color={theme.accentColor} bgColor={theme.backgroundColor} rotation={-10} />}
        {mode === 'education' && <StepIndicator step={slideIndex + 1} total={totalSlides} color={theme.accentColor} />}
        {mode === 'reveal' && slideIndex === 0 && (
          <div style={{ position: 'absolute', top: 45, left: 50, fontFamily: headingFont, fontSize: 18, fontWeight: 700, color: theme.accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: `0 0 15px ${theme.accentColor}50` }}>
            NOW AVAILABLE
          </div>
        )}
      </div>
      <SlideDots current={slideIndex} total={totalSlides} variant="glow" color={theme.accentColor} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 5 — PhotoSet: "Lookbook / Photo Album"
// Full-bleed product photos with grain + vignette. Minimal text.
// ═══════════════════════════════════════════════════════════

function PhotoSet({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const isHook = slideIndex === 0
  const isCta = slideIndex === totalSlides - 1
  const isOdd = slideIndex % 2 === 1

  // Extract caption sentences for middle slides
  const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const slideSentence = sentences.length > 0 ? sentences[(slideIndex - 1) % sentences.length].trim() : caption.slice(0, 80)

  // Fade-in entrance (photo album feel — no bounce)
  const fadeIn = interpolate(slideProgress, [0, 0.12, 1], [0, 1, 1])

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont, opacity: fadeIn }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />

      {isHook && (
        <>
          {/* Hook slide: full-bleed product + dark gradient + hook text */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center', height: 1080,
          }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 800, maxHeight: 800,
              filter: themeShadow(theme.primaryColor, 'dramatic'),
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 450,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          }} />
          <div style={{
            position: 'absolute', bottom: 80, left: 60, right: 60,
            fontFamily: headingFont, fontSize: 56, fontWeight: 700,
            color: '#fff', textTransform: 'uppercase', lineHeight: 1.05,
          }}>
            {hook}
          </div>
          <div style={{
            position: 'absolute', top: 40, left: 50,
            fontFamily: headingFont, fontSize: 16, fontWeight: 700,
            color: '#ffffff40', letterSpacing: '0.12em',
          }}>
            SPACE APE
          </div>
        </>
      )}

      {!isHook && !isCta && isOdd && (
        <>
          {/* Odd middle: product fills frame, no text — just the photo */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 700, height: 700, borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.primaryColor}20 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center', height: 1080,
          }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 850, maxHeight: 850,
              filter: themeShadow(theme.primaryColor, 'medium'),
            }} />
          </div>
        </>
      )}

      {!isHook && !isCta && !isOdd && (
        <>
          {/* Even middle: product + caption bar at bottom */}
          <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 250,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 650, maxHeight: 650,
              filter: themeShadow(theme.primaryColor, 'medium'),
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 250,
            background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(6px)',
            padding: '30px 50px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: bodyFont, fontSize: 22, fontWeight: 500,
              color: '#ffffffCC', lineHeight: 1.4,
              ...clampText(3),
            }}>
              {slideSentence}
            </div>
            <div style={{
              fontFamily: accentFont, fontSize: 14, fontWeight: 600,
              color: '#ffffff60', textTransform: 'uppercase', marginTop: 12, letterSpacing: '0.08em',
            }}>
              {flavor} • {theme.strainType || 'Live Resin'}
            </div>
          </div>
        </>
      )}

      {isCta && (
        <>
          {/* CTA slide: product + SPACE APE + follow CTA */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center', height: 700,
          }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 500, maxHeight: 500,
              filter: themeShadow(theme.primaryColor, 'medium'),
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 400,
            background: `linear-gradient(to top, ${theme.backgroundColor} 0%, transparent 100%)`,
          }} />
          <div style={{
            position: 'absolute', bottom: 180, left: 0, right: 0, textAlign: 'center',
            fontFamily: headingFont, fontSize: 40, fontWeight: 700,
            color: theme.accentColor, letterSpacing: '0.08em',
          }}>
            SPACE APE
          </div>
          <div style={{
            position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center',
            fontFamily: bodyFont, fontSize: 20, fontWeight: 600,
            color: '#ffffffAA',
          }}>
            Follow @SpaceApe
          </div>
        </>
      )}

      {/* Photo treatment on every slide */}
      <GrainOverlay opacity={0.04} />
      <VignetteOverlay intensity={0.25} />

      <SlideDots current={slideIndex} total={totalSlides} variant="dash" color="#ffffff" />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 6 — StudioSlides: "Clean Studio Product Showcase"
// Product on rotating solid colors with studio lighting.
// ═══════════════════════════════════════════════════════════

function StudioSlides({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]

  const colorShades = [
    theme.primaryColor,
    saturateColor(theme.primaryColor, 1.3),
    theme.accentColor,
    lightenColor(theme.primaryColor, 15),
    darkenColor(theme.primaryColor, 10),
  ]
  const slideBg = colorShades[slideIndex % colorShades.length]

  const isHook = slideIndex === 0
  const isCta = slideIndex === totalSlides - 1
  const midType = (slideIndex - 1) % 3 // 0=hero, 1=flavor, 2=detail

  // Extract caption sentences
  const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const slideSentence = sentences.length > 0 ? sentences[(slideIndex - 1) % sentences.length].trim() : caption.slice(0, 80)

  // Subtle spring entrance
  const enterScale = bouncySpring(Math.round(slideProgress * FRAMES_PER_SLIDE), 30)
  const scale = interpolate(enterScale, [0, 1], [0.92, 1])

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Solid color background — rotates per slide */}
      <div style={{ position: 'absolute', inset: 0, background: slideBg }} />

      {/* Studio light on all slides */}
      <GlossHighlight angle={135} opacity={0.10} coverage={45} />

      {isHook && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})` }}>
          {/* Hook slide: product + hook text */}
          <div style={{
            flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
            paddingBottom: 200,
          }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 500, maxHeight: 500,
              filter: themeShadow(theme.primaryColor, 'medium'),
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 100, left: 60, right: 60, textAlign: 'center',
            fontFamily: headingFont, fontSize: 48, fontWeight: 700,
            color: '#fff', textTransform: 'uppercase', lineHeight: 1.05,
          }}>
            {hook}
          </div>
          <div style={{
            position: 'absolute', top: 40, left: 50,
            fontFamily: headingFont, fontSize: 16, fontWeight: 700,
            color: '#ffffff40', letterSpacing: '0.12em',
          }}>
            SPACE APE
          </div>
        </div>
      )}

      {!isHook && !isCta && midType === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `scale(${scale})` }}>
          {/* Product-hero: product LARGE, tiny flavor text */}
          <ProductImg src={mainImg} style={{
            maxWidth: 700, maxHeight: 700,
            filter: themeShadow(theme.primaryColor, 'medium'),
          }} />
          <div style={{
            position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center',
            fontFamily: accentFont, fontSize: 16, fontWeight: 600,
            color: '#ffffffAA', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {flavor}
          </div>
        </div>
      )}

      {!isHook && !isCta && midType === 1 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})` }}>
          {/* Flavor slide: product + big flavor name */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: 180 }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 450, maxHeight: 450,
              filter: themeShadow(theme.primaryColor, 'medium'),
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 100, left: 50, right: 50, textAlign: 'center',
            fontFamily: headingFont, fontSize: 60, fontWeight: 700,
            color: '#fff', textTransform: 'uppercase', lineHeight: 1.0,
          }}>
            {flavor}
          </div>
          {theme.strainType && (
            <div style={{
              position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center',
              fontFamily: accentFont, fontSize: 14, fontWeight: 600,
              color: '#ffffffAA', textTransform: 'uppercase',
            }}>
              {theme.strainType}
            </div>
          )}
        </div>
      )}

      {!isHook && !isCta && midType === 2 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', transform: `scale(${scale})` }}>
          {/* Detail slide: product left, text right */}
          <div style={{
            width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <ProductImg src={mainImg} style={{
              maxWidth: 400, maxHeight: 400,
              filter: themeShadow(theme.primaryColor, 'medium'),
            }} />
          </div>
          <div style={{
            width: '50%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '0 50px 0 20px',
          }}>
            <div style={{
              fontFamily: accentFont, fontSize: 26, fontWeight: 600,
              color: '#fff', lineHeight: 1.3, marginBottom: 16,
              ...clampText(3),
            }}>
              {slideSentence}
            </div>
            <div style={{
              fontFamily: bodyFont, fontSize: 14, fontWeight: 600,
              color: '#ffffff60', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {flavor}
            </div>
          </div>
        </div>
      )}

      {isCta && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${scale})` }}>
          {/* CTA slide */}
          <div style={{
            fontFamily: headingFont, fontSize: 48, fontWeight: 700,
            color: '#fff', letterSpacing: '0.08em', marginBottom: 20,
          }}>
            SPACE APE
          </div>
          <div style={{
            border: '3px solid #ffffff60', borderRadius: 8, padding: '12px 40px',
          }}>
            <div style={{
              fontFamily: bodyFont, fontSize: 20, fontWeight: 600,
              color: '#ffffffCC', letterSpacing: '0.06em',
            }}>
              Follow Us
            </div>
          </div>
        </div>
      )}

      <SlideDots current={slideIndex} total={totalSlides} variant="circle" color={theme.accentColor} />
    </AbsoluteFill>
  )
}

// ─── Shared template props ───
interface TemplateProps {
  theme: FlavorTheme
  flavor: string
  hook: string
  caption: string
  images: string[]
  slideIndex: number
  slideProgress: number
  totalSlides: number
  frame: number
  subcategory: string
}

// ─── Main component ───
export default function Carousel({ flavor, hook, caption, hashtags, pillar, subcategory, layoutTemplate, slideCount }: CarouselProps) {
  const frame = useCurrentFrame()
  const theme = getFlavorTheme(flavor)
  const images = theme.productImages

  const slideIndex = Math.min(Math.floor(frame / FRAMES_PER_SLIDE), slideCount - 1)
  const slideProgress = (frame - slideIndex * FRAMES_PER_SLIDE) / FRAMES_PER_SLIDE

  const props: TemplateProps = { theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides: slideCount, frame, subcategory }

  switch (layoutTemplate) {
    case 1: return <SlideStack {...props} />
    case 2: return <MagazineSpread {...props} />
    case 3: return <BoldTypography {...props} />
    case 4: return <NeonGlow {...props} />
    case 5: return <PhotoSet {...props} />
    case 6: return <StudioSlides {...props} />
    default: return <SlideStack {...props} />
  }
}
