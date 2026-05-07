import { AbsoluteFill, interpolate } from 'remotion'
import {
  ProductImg,
  bouncySpring,
  seedFromText, seededInt,
  bodyFont, headingFont, accentFont,
  getVisualMode, getBadgeLabel, BadgeOverlay,
  themeShadow,
} from '../../components/shared'
import {
  gradientTextStyle, clipCircleReveal,
  GlassPanel, AnimatedGradient, CharacterReveal,
  ShimmerSweep, DuotoneFilter, duotoneStyle,
} from '../../components/effects'
import { SlideDots } from './SlideDots'
import { FRAMES_PER_SLIDE, type TemplateProps } from './types'

export function GlassJournal({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const slideFrame = Math.round(slideProgress * FRAMES_PER_SLIDE)
  const enterScale = bouncySpring(slideFrame, 30)
  const content = slideContent

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Animated mesh gradient background */}
      <AnimatedGradient
        frame={frame}
        colors={[theme.primaryColor, theme.accentColor, theme.backgroundColor]}
        speed={0.3}
        type="mesh"
      />

      {/* Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />

      {/* Slide content with circle reveal transition */}
      <div style={{
        position: 'absolute', inset: 0,
        ...clipCircleReveal(interpolate(slideProgress, [0, 0.15], [0.3, 1], { extrapolateRight: 'clamp' })),
      }}>
        {content.role === 'hook' && (
          <>
            <div style={{ position: 'absolute', top: 55, left: 55, fontFamily: headingFont, fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', ...gradientTextStyle(['#fff', theme.accentColor]) }}>
              SPACE APE
            </div>
            {/* Product silhouette behind text */}
            <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.15 }}>
              <ProductImg src={mainImg} style={{ maxWidth: 600, maxHeight: 600 }} />
            </div>
            {/* Character-revealed hook text */}
            <div style={{ position: 'absolute', top: 280, left: 55, right: 55 }}>
              <CharacterReveal
                text={content.text.toUpperCase()}
                frame={slideFrame}
                fps={30}
                stagger={1}
                style={{
                  fontFamily: headingFont, fontSize: 58, fontWeight: 700,
                  lineHeight: '1.05', letterSpacing: '-0.01em',
                  ...gradientTextStyle([theme.accentColor, '#ffffff']),
                }}
              />
            </div>
          </>
        )}

        {content.role === 'content' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 50 }}>
            <GlassPanel blur={28} opacity={0.1} borderColor={`${theme.accentColor}30`} borderRadius={28} style={{
              padding: '50px 45px',
              transform: `scale(${enterScale}) translateY(${(1 - enterScale) * 20}px)`,
              maxWidth: 900,
            }}>
              <div style={{
                fontFamily: headingFont, fontSize: 44, fontWeight: 700,
                color: '#fff', textTransform: 'uppercase', lineHeight: 1.15,
                textAlign: 'center',
              }}>
                {content.text}
              </div>
            </GlassPanel>
          </div>
        )}

        {content.role === 'flavor' && (
          <>
            <DuotoneFilter id={`duo-gj-${slideIndex}`} darkColor={theme.backgroundColor} lightColor={theme.accentColor} />
            <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center', height: 500, alignItems: 'center' }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 420, maxHeight: 420,
                ...duotoneStyle(`duo-gj-${slideIndex}`),
                filter: `${duotoneStyle(`duo-gj-${slideIndex}`).filter} ${themeShadow(theme.primaryColor, 'dramatic')}`,
                transform: `scale(${enterScale})`,
              }} />
            </div>
            <div style={{ position: 'absolute', bottom: 140, left: 50, right: 50, textAlign: 'center' }}>
              <div style={{
                fontFamily: headingFont, fontSize: 60, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                ...gradientTextStyle([theme.accentColor, '#fff']),
              }}>
                {content.text}
              </div>
              {content.secondary && (
                <div style={{ fontFamily: accentFont, fontSize: 16, fontWeight: 600, color: '#ffffffAA', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 12 }}>
                  {content.secondary}
                </div>
              )}
            </div>
          </>
        )}

        {content.role === 'cta' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <ShimmerSweep frame={slideFrame} color="rgba(255,255,255,0.12)" width={250} speed={3} />
            <div style={{ fontFamily: headingFont, fontSize: 52, fontWeight: 700, letterSpacing: '0.06em', ...gradientTextStyle([theme.accentColor, '#fff', theme.primaryColor]) }}>
              SPACE APE
            </div>
            <GlassPanel blur={20} opacity={0.12} borderColor={`${theme.accentColor}40`} borderRadius={40} style={{ padding: '16px 44px' }}>
              <div style={{ fontFamily: bodyFont, fontSize: 22, fontWeight: 600, color: '#fff', textAlign: 'center' }}>
                {content.text}
              </div>
            </GlassPanel>
          </div>
        )}

        {badgeLabel && slideIndex === 0 && <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} />}
      </div>

      <SlideDots current={slideIndex} total={totalSlides} variant="glow" color={theme.accentColor} />
    </AbsoluteFill>
  )
}
