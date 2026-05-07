import { AbsoluteFill, interpolate } from 'remotion'
import {
  Ring, Sparkle, ProductImg,
  concentricCirclesBg,
  outlinedTextStyle,
  seedFromText, seededInt, seededRange,
  bodyFont, headingFont, accentFont,
  getVisualMode, getBadgeLabel, BadgeOverlay, StepIndicator,
  themeShadow,
} from '../../components/shared'
import { SlideDots } from './SlideDots'
import type { TemplateProps } from './types'

export function NeonGlow({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const enterOpacity = interpolate(slideProgress, [0, 0.2, 1], [0, 1, 1], { extrapolateRight: 'clamp' })
  const enterY = interpolate(slideProgress, [0, 0.2, 1], [20, 0, 0], { extrapolateRight: 'clamp' })

  const content = slideContent
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

        {content.role === 'hook' && (
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

        {content.role === 'content' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 70 }}>
            <div style={{ fontFamily: accentFont, fontSize: 38, fontWeight: 500, lineHeight: 1.3, textAlign: 'center', color: '#ffffffCC', textShadow: `0 0 20px ${theme.primaryColor}40` }}>
              {content.text}
            </div>
          </div>
        )}

        {content.role === 'flavor' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <div style={{ fontFamily: headingFont, fontSize: 70, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.0, ...outlinedTextStyle(theme.accentColor, theme.backgroundColor, 3), textShadow: `0 0 40px ${theme.accentColor}50` }}>
              {content.text}
            </div>
          </div>
        )}

        {content.role === 'cta' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
            <div style={{ fontFamily: headingFont, fontSize: 46, fontWeight: 700, letterSpacing: '0.06em', ...outlinedTextStyle(theme.accentColor, theme.backgroundColor, 3), textShadow: `0 0 25px ${theme.accentColor}40` }}>
              SPACE APE
            </div>
            <div style={{ fontFamily: accentFont, fontSize: 22, fontWeight: 500, color: '#ffffffCC', textAlign: 'center', padding: '0 60px', textShadow: `0 0 15px ${theme.primaryColor}30` }}>
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
