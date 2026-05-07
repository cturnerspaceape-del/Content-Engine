import { AbsoluteFill, interpolate } from 'remotion'
import {
  ProductImg,
  outlinedTextStyle,
  bouncySpring,
  seedFromText, seededInt,
  bodyFont, headingFont, accentFont,
  getVisualMode, getBadgeLabel, BadgeOverlay,
  themeShadow,
} from '../../components/shared'
import {
  clipDiagonalWipe,
  ChromaShift, ScanLines, LightLeak, HalftoneOverlay,
} from '../../components/effects'
import { SlideDots } from './SlideDots'
import { FRAMES_PER_SLIDE, type TemplateProps } from './types'

export function RetroVision({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]
  const slideFrame = Math.round(slideProgress * FRAMES_PER_SLIDE)
  const enterScale = bouncySpring(slideFrame, 30)
  const content = slideContent

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Dark base */}
      <div style={{ position: 'absolute', inset: 0, background: '#0c0c0c' }} />

      {/* Persistent scan lines */}
      <ScanLines spacing={3} opacity={0.06} />

      {/* Slide content with diagonal wipe */}
      <div style={{
        position: 'absolute', inset: 0,
        ...clipDiagonalWipe(interpolate(slideProgress, [0, 0.2], [0, 1], { extrapolateRight: 'clamp' })),
      }}>
        {content.role === 'hook' && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${theme.backgroundColor} 0%, #0c0c0c 100%)` }} />
            <HalftoneOverlay dotSize={2} spacing={7} color={theme.primaryColor} opacity={0.06} />
            <div style={{
              position: 'absolute', top: 200, left: 50, right: 50,
              transform: `translateX(${(1 - enterScale) * -100}px)`,
              opacity: enterScale,
            }}>
              <ChromaShift offset={3} frame={slideFrame} animated>
                <div style={{
                  fontFamily: headingFont, fontSize: 64, fontWeight: 700,
                  textTransform: 'uppercase', lineHeight: 1.0,
                  ...outlinedTextStyle('#fff', theme.primaryColor, 3),
                }}>
                  {content.text}
                </div>
              </ChromaShift>
            </div>
            <div style={{ position: 'absolute', top: 50, left: 55, fontFamily: accentFont, fontSize: 14, fontWeight: 600, color: theme.primaryColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              SPACE APE • ULTRA PREMIUM
            </div>
          </>
        )}

        {content.role === 'content' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: '#0c0c0c' }} />
            <HalftoneOverlay dotSize={1.5} spacing={5} color={theme.accentColor} opacity={0.05} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 65,
            }}>
              <div style={{
                fontFamily: headingFont, fontSize: 44, fontWeight: 700,
                color: '#fff', textTransform: 'uppercase', lineHeight: 1.15,
                textAlign: 'center',
                transform: `scale(${enterScale})`,
                textShadow: `3px 3px 0 ${theme.primaryColor}40`,
              }}>
                {content.text}
              </div>
            </div>
          </div>
        )}

        {content.role === 'flavor' && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: '#0c0c0c' }} />
            <LightLeak frame={slideFrame} color={theme.primaryColor} position="center" intensity={0.2} />
            <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center', height: 500, alignItems: 'center' }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 440, maxHeight: 440,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
                transform: `scale(${enterScale})`,
              }} />
            </div>
            <div style={{ position: 'absolute', bottom: 120, left: 50, right: 50, textAlign: 'center' }}>
              <div style={{
                fontFamily: headingFont, fontSize: 58, fontWeight: 700,
                textTransform: 'uppercase',
                ...outlinedTextStyle('#fff', theme.primaryColor, 3),
              }}>
                {content.text}
              </div>
              {content.secondary && (
                <div style={{ fontFamily: accentFont, fontSize: 15, fontWeight: 600, color: `${theme.primaryColor}CC`, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 10 }}>
                  {content.secondary}
                </div>
              )}
            </div>
          </>
        )}

        {content.role === 'cta' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: '#0c0c0c' }} />
            <ScanLines spacing={2} opacity={0.12} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <ChromaShift offset={2}>
                <div style={{ fontFamily: headingFont, fontSize: 52, fontWeight: 700, letterSpacing: '0.06em', color: '#fff' }}>
                  SPACE APE
                </div>
              </ChromaShift>
              <div style={{
                fontFamily: bodyFont, fontSize: 22, fontWeight: 600,
                color: theme.primaryColor, textAlign: 'center', padding: '0 60px',
              }}>
                {content.text}
              </div>
            </div>
          </div>
        )}

        {badgeLabel && slideIndex === 0 && <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} />}
      </div>

      <SlideDots current={slideIndex} total={totalSlides} variant="dash" color={theme.primaryColor} />
    </AbsoluteFill>
  )
}
