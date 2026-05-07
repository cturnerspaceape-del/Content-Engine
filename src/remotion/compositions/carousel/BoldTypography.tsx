import { AbsoluteFill } from 'remotion'
import {
  Sparkle, StickerFrame, ProductImg,
  stripesBg, diagonalHatchBg, seededStripesBg,
  bouncySpring,
  seedFromText, seededRange,
  bodyFont, handFont,
  getVisualMode, getBadgeLabel, BadgeOverlay,
  themeShadow,
} from '../../components/shared'
import { SlideDots } from './SlideDots'
import { FRAMES_PER_SLIDE, type TemplateProps } from './types'

export function BoldTypography({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[0]
  const enterScale = bouncySpring(Math.round(slideProgress * FRAMES_PER_SLIDE), 30)
  const isEven = slideIndex % 2 === 0

  const content = slideContent
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

        {content.role === 'hook' && (
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

        {content.role === 'content' && (
          <div style={{ position: 'absolute', inset: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: handFont, fontSize: 58, fontWeight: 400, lineHeight: 1.1, color: isEven ? theme.primaryColor : '#fff', transform: `rotate(${seededRange(seed, slideIndex, -1.5, 1.5)}deg)` }}>
              "{content.text}"
            </div>
          </div>
        )}

        {content.role === 'flavor' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              fontFamily: handFont, fontSize: 100, fontWeight: 400, textTransform: 'uppercase',
              lineHeight: 0.95, textAlign: 'center', padding: '0 40px',
              color: isEven ? theme.primaryColor : '#fff',
              transform: `rotate(${seededRange(seed, 30, -2, 2)}deg)`,
            }}>
              {content.text}
            </div>
            <Sparkle x={850} y={120} size={35} color={theme.accentColor} rotation={-15} />
          </div>
        )}

        {content.role === 'cta' && (
          <div style={{
            position: 'absolute', inset: 0,
            ...seededStripesBg(seed, theme.primaryColor, theme.accentColor),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
          }}>
            <div style={{ fontFamily: handFont, fontSize: 60, fontWeight: 400, color: '#fff', textAlign: 'center', lineHeight: 1.0, padding: '0 50px', transform: 'rotate(-2deg)' }}>
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
