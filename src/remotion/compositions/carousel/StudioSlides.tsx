import { AbsoluteFill, interpolate } from 'remotion'
import {
  ProductImg,
  GlossHighlight,
  bouncySpring,
  seedFromText, seededInt,
  bodyFont, headingFont, accentFont,
  themeShadow, clampText,
  saturateColor, lightenColor, darkenColor,
} from '../../components/shared'
import { SlideDots } from './SlideDots'
import { FRAMES_PER_SLIDE, type TemplateProps } from './types'

export function StudioSlides({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory, slideContent }: TemplateProps) {
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

  const content = slideContent

  // Subtle spring entrance
  const enterScale = bouncySpring(Math.round(slideProgress * FRAMES_PER_SLIDE), 30)
  const scale = interpolate(enterScale, [0, 1], [0.92, 1])

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Solid color background — rotates per slide */}
      <div style={{ position: 'absolute', inset: 0, background: slideBg }} />

      {/* Studio light on all slides */}
      <GlossHighlight angle={135} opacity={0.10} coverage={45} />

      {content.role === 'hook' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})` }}>
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
            {content.text}
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

      {content.role === 'content' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', transform: `scale(${scale})` }}>
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
              {content.text}
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

      {content.role === 'flavor' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})` }}>
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
            {content.text}
          </div>
          {content.secondary && (
            <div style={{
              position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center',
              fontFamily: accentFont, fontSize: 14, fontWeight: 600,
              color: '#ffffffAA', textTransform: 'uppercase',
            }}>
              {content.secondary}
            </div>
          )}
        </div>
      )}

      {content.role === 'cta' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${scale})` }}>
          <div style={{
            fontFamily: headingFont, fontSize: 48, fontWeight: 700,
            color: '#fff', letterSpacing: '0.08em', marginBottom: 20,
          }}>
            SPACE APE
          </div>
          <div style={{
            fontFamily: bodyFont, fontSize: 22, fontWeight: 600,
            color: '#ffffffCC', textAlign: 'center', padding: '0 60px',
          }}>
            {content.text}
          </div>
        </div>
      )}

      <SlideDots current={slideIndex} total={totalSlides} variant="circle" color={theme.accentColor} />
    </AbsoluteFill>
  )
}
