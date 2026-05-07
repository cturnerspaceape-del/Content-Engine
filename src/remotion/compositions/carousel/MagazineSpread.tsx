import { AbsoluteFill, interpolate } from 'remotion'
import {
  Blob, StickerFrame, WavyDivider, ProductImg,
  stripesBg, checkerboardBg, concentricCirclesBg,
  seededStripesBg, seededPolkaDotBg,
  outlinedTextStyle,
  seedFromText, seededRange,
  bodyFont, accentFont,
  getVisualMode, getBadgeLabel, BadgeOverlay, StepIndicator, ShelfLines,
  themeShadow, clampText,
} from '../../components/shared'
import { SlideDots } from './SlideDots'
import type { TemplateProps } from './types'

export function MagazineSpread({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const imgIdx = slideIndex % images.length
  const mainImg = images[imgIdx]
  const enterOpacity = interpolate(slideProgress, [0, 0.15, 1], [0, 1, 1], { extrapolateRight: 'clamp' })
  const isEven = slideIndex % 2 === 0

  const content = slideContent

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

        {content.role === 'hook' && (
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

        {content.role === 'content' && (
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

        {content.role === 'flavor' && (
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

        {content.role === 'cta' && (
          <div style={{
            position: 'absolute', inset: 0,
            ...seededPolkaDotBg(seed, `${theme.primaryColor}12`, '#FAF7F2'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
          }}>
            <div style={{ fontFamily: accentFont, fontSize: 46, fontWeight: 700, letterSpacing: '0.04em', color: theme.primaryColor }}>
              SPACE APE
            </div>
            <div style={{ fontFamily: accentFont, fontSize: 26, fontWeight: 600, color: theme.backgroundColor, textTransform: 'uppercase', textAlign: 'center', padding: '0 60px' }}>
              {content.text}
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
