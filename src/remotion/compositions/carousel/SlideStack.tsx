import { AbsoluteFill, interpolate } from 'remotion'
import {
  StickerStar, Daisy, Heart, Blob, StickerFrame, SpeechBubble, ProductImg,
  seededStripesBg, seededPolkaDotBg,
  outlinedTextStyle, boldShadowStyle, bouncySpring, brightBg,
  seedFromText, seededInt, seededRange,
  headingFont, bodyFont,
  getVisualMode, getBadgeLabel, BadgeOverlay, StepIndicator, ComparisonDivider, ShelfLines,
  themeShadow,
} from '../../components/shared'
import { SlideDots } from './SlideDots'
import { FRAMES_PER_SLIDE, type TemplateProps } from './types'

export function SlideStack({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const enterScale = bouncySpring(Math.round(slideProgress * FRAMES_PER_SLIDE), 30)

  const content = slideContent

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
          ...(content.role === 'cta'
            ? seededPolkaDotBg(seed, `${theme.primaryColor}20`, brightBg(theme.primaryColor))
            : seededStripesBg(seed + slideIndex, theme.primaryColor, theme.accentColor)),
        }} />

        {content.role === 'hook' && (
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

        {content.role === 'content' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 70 }}>
            <div style={{ fontFamily: headingFont, fontSize: 46, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.15, textAlign: 'center', ...boldShadowStyle('#fff', 'rgba(0,0,0,0.2)', 4) }}>
              {content.text}
            </div>
          </div>
        )}

        {content.role === 'flavor' && (
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

        {content.role === 'cta' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ fontFamily: headingFont, fontSize: 44, fontWeight: 700, letterSpacing: '0.06em', ...outlinedTextStyle(theme.primaryColor, '#fff', 3) }}>
              SPACE APE
            </div>
            <SpeechBubble x={280} y={480} width={520} height={100} color={theme.primaryColor} borderColor="#fff" borderWidth={4} />
            <div style={{ position: 'relative', zIndex: 1, fontFamily: headingFont, fontSize: 30, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', ...boldShadowStyle('#fff', 'rgba(0,0,0,0.15)', 3), marginTop: -70 }}>
              {content.text}
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
