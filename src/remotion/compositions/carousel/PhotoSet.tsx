import { AbsoluteFill, interpolate } from 'remotion'
import {
  ProductImg,
  GrainOverlay, VignetteOverlay,
  seedFromText, seededInt,
  bodyFont, headingFont, accentFont,
  themeShadow, clampText,
} from '../../components/shared'
import { SlideDots } from './SlideDots'
import type { TemplateProps } from './types'

export function PhotoSet({ theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides, frame, subcategory, slideContent }: TemplateProps) {
  const seed = seedFromText(hook)
  const mainImg = images[seededInt(seed, slideIndex + 10, 0, images.length - 1)]

  const content = slideContent
  const isOdd = slideIndex % 2 === 1

  // Fade-in entrance (photo album feel — no bounce)
  const fadeIn = interpolate(slideProgress, [0, 0.12, 1], [0, 1, 1])

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont, opacity: fadeIn }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />

      {content.role === 'hook' && (
        <>
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
            {content.text}
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

      {content.role === 'content' && (
        <>
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
              {content.text}
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

      {content.role === 'flavor' && (
        <>
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
          <div style={{
            position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center',
            fontFamily: headingFont, fontSize: 48, fontWeight: 700,
            color: '#fff', textTransform: 'uppercase',
          }}>
            {content.text}
          </div>
        </>
      )}

      {content.role === 'cta' && (
        <>
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
            position: 'absolute', bottom: 140, left: 60, right: 60, textAlign: 'center',
            fontFamily: bodyFont, fontSize: 22, fontWeight: 600,
            color: '#ffffffCC',
          }}>
            {content.text}
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
