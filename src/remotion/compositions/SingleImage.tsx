import { AbsoluteFill } from 'remotion'
import { getFlavorTheme } from '../flavorThemes'
import type { SingleImageProps, FlavorTheme } from '../types'
import {
  StickerStar, Blob, Daisy, Heart, Sparkle, StickerFrame, SpeechBubble, WavyDivider, ProductImg,
  polkaDotBg, stripesBg, diagonalHatchBg, checkerboardBg,
  outlinedTextStyle, boldShadowStyle, brightBg,
  seedFromText, seededRange, seededPick,
  headingFont, bodyFont, accentFont, handFont,
  getVisualMode, getBadgeLabel, BadgeOverlay,
  PhotoStack, GlossHighlight, VignetteOverlay, GrainOverlay, WarmTint,
  saturateColor, lightenColor, darkenColor,
  themeShadow, clampText,
} from '../components/shared'

// ═══════════════════════════════════════════════════════════
// Template 1: "Supreme Box" — Typography-dominant, box logo energy
// Giant text fills canvas. Product is a small accent. Minimal.
// ═══════════════════════════════════════════════════════════

function SupremeBox({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Solid color background */}
      <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />

      {/* Thin inset border — Supreme lookbook energy */}
      <div style={{
        position: 'absolute', inset: 30,
        border: '3px solid #ffffff40',
      }} />

      {/* Supreme-style box logo — top left */}
      <div style={{
        position: 'absolute', top: 55, left: 55,
        background: theme.accentColor, padding: '10px 24px',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 24, fontWeight: 700,
          color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          SPACE APE
        </div>
      </div>

      {/* HUGE hook text — fills center */}
      <div style={{
        position: 'absolute', top: 160, left: 60, right: 60, bottom: 280,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 120, fontWeight: 700,
          textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: '-0.03em',
          ...outlinedTextStyle('#fff', `${theme.backgroundColor}80`, 4),
          ...clampText(4),
        }}>
          {hook}
        </div>
      </div>

      {/* Product — small accent, bottom right, sticker-framed */}
      <div style={{
        position: 'absolute', bottom: 50, right: 55,
      }}>
        <StickerFrame borderWidth={5} borderRadius={18} rotation={8}>
          <ProductImg src={mainImg} style={{ maxWidth: 220, maxHeight: 220, filter: themeShadow(theme.primaryColor, 'soft') }} />
        </StickerFrame>
      </div>

      {/* Flavor box badge — bottom left */}
      <div style={{
        position: 'absolute', bottom: 60, left: 55,
        background: '#fff', padding: '10px 28px',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 22, fontWeight: 700,
          color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {flavor}
        </div>
      </div>

      {/* Strain — tiny, bottom center */}
      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 35, left: '50%', transform: 'translateX(-50%)',
          color: '#ffffff50', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 2: "Street Dark" — Bodega Boyz moody, product-forward
// Dark bg, massive product, minimal text overlay. Raw, premium.
// ═══════════════════════════════════════════════════════════

function StreetDark({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Near-black base with subtle noise */}
      <div style={{ position: 'absolute', inset: 0, background: '#0a0a0a' }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        ...polkaDotBg('#ffffff', 'transparent', 2, 8),
      }} />

      {/* Thin rule lines at top and bottom */}
      <div style={{ position: 'absolute', top: 30, left: 40, right: 40, height: 1, background: '#ffffff15' }} />
      <div style={{ position: 'absolute', bottom: 30, left: 40, right: 40, height: 1, background: '#ffffff15' }} />

      {/* Product MASSIVE — bleeding off top */}
      <div style={{
        position: 'absolute', top: -80, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 750, maxHeight: 750,
          filter: themeShadow(theme.primaryColor, 'dramatic'),
        }} />
      </div>

      {/* Subtle glow behind product */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primaryColor}25 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
      }} />

      {/* Hook text — horizontal strip overlay in the middle */}
      <div style={{
        position: 'absolute', top: 560, left: 0, right: 0,
        background: '#000000AA', backdropFilter: 'blur(8px)',
        padding: '18px 50px',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 28, fontWeight: 700,
          color: '#ffffffCC', textTransform: 'uppercase', letterSpacing: '0.04em',
          lineHeight: 1.2,
        }}>
          {hook}
        </div>
      </div>

      {/* Flavor — bottom, small caps, muted */}
      <div style={{
        position: 'absolute', bottom: 55, left: 50,
        fontFamily: accentFont, fontSize: 42, fontWeight: 700,
        color: theme.primaryColor, textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {flavor}
      </div>

      {/* Strain badge — top right, glowing */}
      {theme.strainType && (
        <div style={{
          position: 'absolute', top: 50, right: 50,
          color: theme.accentColor, fontSize: 13, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          textShadow: `0 0 15px ${theme.accentColor}50`,
        }}>
          {theme.strainType}
        </div>
      )}

      {/* SPACE APE — top left, subtle */}
      <div style={{
        position: 'absolute', top: 50, left: 50,
        fontFamily: headingFont, fontSize: 18, fontWeight: 700,
        color: '#ffffff25', letterSpacing: '0.12em',
      }}>
        SPACE APE
      </div>

      {/* Ultra Premium tag — bottom right */}
      <div style={{
        position: 'absolute', bottom: 55, right: 50,
        color: '#ffffff30', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        Ultra Premium • Live Resin
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 3: "Catalog Grid" — Supreme lookbook / product catalog
// Clean grid, multiple product views, editorial. No decorations.
// ═══════════════════════════════════════════════════════════

function CatalogGrid({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const [img1, img2, img3] = [images[0], images[1] || images[0], images[2] || images[0]]
  const borderColor = `${theme.primaryColor}40`
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Cream base */}
      <div style={{ position: 'absolute', inset: 0, background: '#FAF7F2' }} />

      {/* Grid: asymmetric panels */}
      {/* Top-left — main product (large panel) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 648, height: 648,
        borderRight: `2px solid ${borderColor}`,
        borderBottom: `2px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.primaryColor,
      }}>
        <ProductImg src={img1} style={{
          maxWidth: 480, maxHeight: 480,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>

      {/* Top-right — second angle (small panel) */}
      <div style={{
        position: 'absolute', top: 0, left: 650, width: 430, height: 430,
        borderBottom: `2px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${theme.accentColor}15`,
      }}>
        <ProductImg src={img2} style={{
          maxWidth: 300, maxHeight: 300,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>

      {/* Bottom-right — color swatch / third angle */}
      <div style={{
        position: 'absolute', top: 432, left: 650, width: 430, height: 216,
        borderBottom: `2px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.accentColor,
      }}>
        <ProductImg src={img3} style={{
          maxWidth: 160, maxHeight: 160, opacity: 0.8,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>

      {/* Bottom-left — text block */}
      <div style={{
        position: 'absolute', top: 650, left: 0, width: 648, height: 430,
        padding: '40px 50px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 16, fontWeight: 700,
          color: theme.primaryColor, letterSpacing: '0.12em', marginBottom: 16,
        }}>
          SPACE APE
        </div>
        <div style={{
          fontFamily: headingFont, fontSize: 44, fontWeight: 700,
          color: theme.primaryColor, textTransform: 'uppercase',
          lineHeight: 1.0, marginBottom: 16,
        }}>
          {flavor}
        </div>
        <div style={{
          fontFamily: accentFont, fontSize: 18, fontWeight: 500,
          color: '#333', lineHeight: 1.4,
        }}>
          {hook}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
          {theme.strainType && (
            <div style={{
              border: `2px solid ${theme.primaryColor}`, color: theme.primaryColor,
              fontSize: 12, fontWeight: 700, padding: '4px 14px',
              borderRadius: 4, textTransform: 'uppercase',
            }}>
              {theme.strainType}
            </div>
          )}
          <div style={{
            color: '#999', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Ultra Premium • Live Resin
          </div>
        </div>
      </div>

      {/* Bottom-right corner — product code feel */}
      <div style={{
        position: 'absolute', bottom: 20, right: 30,
        fontFamily: accentFont, fontSize: 11, fontWeight: 500,
        color: '#bbb', letterSpacing: '0.06em',
      }}>
        2G / 4G LIVE RESIN
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 4: "Sticker Bomb" — Maximalist collage chaos
// Multiple products, tons of decorations, everything rotated.
// ═══════════════════════════════════════════════════════════

function StickerBomb({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const [img1, img2, img3] = [images[0], images[1] || images[0], images[2] || images[0]]
  const seed = seedFromText(hook)
  const bg = brightBg(theme.primaryColor)
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Bright pastel background with checkerboard */}
      <div style={{
        position: 'absolute', inset: 0,
        ...checkerboardBg(`${theme.primaryColor}12`, bg, 40),
      }} />

      {/* Scattered decorations — LARGE and bold */}
      <StickerStar x={40} y={30} size={80} color={theme.primaryColor} strokeWidth={4} fill={`${theme.accentColor}40`} rotation={15} />
      <StickerStar x={880} y={60} size={70} color={theme.accentColor} strokeWidth={3.5} rotation={-25} />
      <Daisy x={820} y={800} size={90} petalColor={`${theme.primaryColor}50`} centerColor={theme.accentColor} rotation={20} />
      <Heart x={50} y={750} size={65} color={theme.primaryColor} fill={`${theme.primaryColor}30`} strokeWidth={4} rotation={-18} />
      <Sparkle x={950} y={450} size={55} color={theme.accentColor} rotation={30} />
      <StickerStar x={450} y={950} size={60} color={theme.primaryColor} strokeWidth={3} fill={`${theme.accentColor}30`} rotation={seededRange(seed, 0, -30, 30)} />
      <Heart x={700} y={40} size={50} color={theme.accentColor} fill={`${theme.accentColor}25`} strokeWidth={3} rotation={12} />
      <Daisy x={150} y={450} size={55} petalColor={`${theme.accentColor}40`} centerColor="#fff" rotation={-15} />
      <Sparkle x={300} y={80} size={40} color={theme.primaryColor} rotation={-20} />
      <StickerStar x={600} y={750} size={50} color="#fff" strokeWidth={3} fill={theme.primaryColor} rotation={seededRange(seed, 1, -20, 20)} />

      {/* Products scattered at different sizes and rotations */}
      <div style={{ position: 'absolute', top: 80, left: 50, transform: 'rotate(-8deg)' }}>
        <StickerFrame borderWidth={6} borderColor={theme.primaryColor} borderRadius={22} rotation={0}>
          <ProductImg src={img2} style={{ maxWidth: 300, maxHeight: 300, filter: themeShadow(theme.primaryColor, 'soft') }} />
        </StickerFrame>
      </div>
      <div style={{ position: 'absolute', top: 250, right: 30, transform: 'rotate(12deg)' }}>
        <StickerFrame borderWidth={7} borderColor={theme.accentColor} borderRadius={24} rotation={0}>
          <ProductImg src={img1} style={{ maxWidth: 420, maxHeight: 420, filter: themeShadow(theme.primaryColor, 'soft') }} />
        </StickerFrame>
      </div>
      <div style={{ position: 'absolute', bottom: 180, left: 300, transform: 'rotate(-5deg)' }}>
        <StickerFrame borderWidth={5} borderColor="#fff" borderRadius={20} rotation={0}>
          <ProductImg src={img3} style={{ maxWidth: 240, maxHeight: 240, filter: themeShadow(theme.primaryColor, 'soft') }} />
        </StickerFrame>
      </div>

      {/* Flavor name — huge, rotated, outlined */}
      <div style={{
        position: 'absolute', bottom: 130, left: 40, right: 40,
        fontFamily: headingFont, fontSize: 72, fontWeight: 700,
        textTransform: 'uppercase', lineHeight: 0.95,
        transform: 'rotate(-4deg)',
        ...outlinedTextStyle('#fff', theme.primaryColor, 4),
      }}>
        {flavor}
      </div>

      {/* Hook in a colored bar, slightly rotated */}
      <div style={{
        position: 'absolute', bottom: 40, left: 30, right: 80,
        background: theme.primaryColor, padding: '12px 24px',
        transform: 'rotate(2deg)', borderRadius: 8,
        boxShadow: '4px 5px 0px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          fontFamily: handFont, fontSize: 22, fontWeight: 400,
          color: '#fff', lineHeight: 1.2,
        }}>
          {hook}
        </div>
      </div>

      {/* SPACE APE stamp — rotated */}
      <div style={{
        position: 'absolute', top: 500, left: 40,
        fontFamily: headingFont, fontSize: 32, fontWeight: 700,
        color: `${theme.primaryColor}60`, letterSpacing: '0.1em',
        transform: 'rotate(-12deg)',
        border: `3px solid ${theme.primaryColor}60`, padding: '6px 18px',
      }}>
        SPACE APE
      </div>

      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 15, left: 40,
          color: `${theme.primaryColor}80`, fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 5: "Split Text" — Half text, half product, editorial
// Clean 50/50 divide. Left = pure text. Right = pure product.
// ═══════════════════════════════════════════════════════════

function SplitText({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Left half — text on color */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
        background: theme.primaryColor,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 50px',
      }}>
        {/* SPACE APE small at top */}
        <div style={{
          position: 'absolute', top: 45, left: 50,
          fontFamily: headingFont, fontSize: 16, fontWeight: 700,
          color: '#ffffff60', letterSpacing: '0.15em',
        }}>
          SPACE APE
        </div>

        {/* Hook text — large, left-aligned */}
        <div style={{
          fontFamily: headingFont, fontSize: 56, fontWeight: 700,
          color: '#fff', textTransform: 'uppercase',
          lineHeight: 1.0, letterSpacing: '-0.01em',
          marginBottom: 30,
          ...clampText(4),
        }}>
          {hook}
        </div>

        {/* Flavor name */}
        <div style={{
          fontFamily: accentFont, fontSize: 24, fontWeight: 600,
          color: theme.accentColor, textTransform: 'uppercase',
          letterSpacing: '0.06em', marginBottom: 12,
        }}>
          {flavor}
        </div>

        {/* Strain + tagline */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {theme.strainType && (
            <div style={{
              background: '#ffffff20', color: '#fff',
              fontSize: 12, fontWeight: 700, padding: '5px 14px',
              borderRadius: 4, textTransform: 'uppercase',
            }}>
              {theme.strainType}
            </div>
          )}
          <div style={{
            color: '#ffffff50', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Ultra Premium • Live Resin
          </div>
        </div>
      </div>

      {/* Right half — product on cream */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
        background: '#FAF7F2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 440, maxHeight: 440,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>

      {/* Subtle diagonal divide line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', width: 3,
        height: '100%', background: `${theme.accentColor}40`,
        transform: 'translateX(-50%)',
      }} />
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 6: "Polaroid" — Nostalgic photo frame
// ═══════════════════════════════════════════════════════════

function Polaroid({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />
      {/* Hook text above frame */}
      <div style={{
        position: 'absolute', top: 40, left: 80, right: 80,
        fontFamily: headingFont, fontSize: 36, fontWeight: 700,
        color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, textAlign: 'center',
        ...outlinedTextStyle('#fff', 'rgba(0,0,0,0.2)', 2),
      }}>
        {hook}
      </div>
      {/* Polaroid card */}
      <div style={{
        position: 'absolute', top: 170, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
        background: '#fff', padding: '30px 30px 100px 30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: 620,
      }}>
        <div style={{ width: 560, height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
          <ProductImg src={mainImg} style={{ maxWidth: 500, maxHeight: 500, filter: themeShadow(theme.primaryColor, 'medium') }} />
        </div>
        {/* Handwritten flavor name in bottom border */}
        <div style={{
          position: 'absolute', bottom: 20, left: 40, right: 40,
          fontFamily: handFont, fontSize: 36, fontWeight: 400,
          color: theme.primaryColor, textAlign: 'center',
        }}>
          {flavor}
        </div>
      </div>
      {/* SPACE APE stamp */}
      <div style={{
        position: 'absolute', bottom: 30, right: 50,
        fontFamily: headingFont, fontSize: 16, fontWeight: 700,
        color: '#ffffff50', letterSpacing: '0.12em',
      }}>
        SPACE APE
      </div>

      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 30, left: 50,
          color: '#ffffff50', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 7: "Poster" — Concert flyer / event poster
// ═══════════════════════════════════════════════════════════

function Poster({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, ...diagonalHatchBg(`${theme.accentColor}20`, theme.primaryColor, 5, 18) }} />
      {/* Top rule */}
      <div style={{ position: 'absolute', top: 50, left: 60, right: 60, height: 3, background: '#fff' }} />
      {/* SPACE APE PRESENTS */}
      <div style={{
        position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center',
        fontFamily: accentFont, fontSize: 18, fontWeight: 600,
        color: '#ffffffAA', letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        SPACE APE PRESENTS
      </div>
      {/* Flavor name HUGE */}
      <div style={{
        position: 'absolute', top: 180, left: 50, right: 50,
        fontFamily: headingFont, fontSize: 130, fontWeight: 700,
        color: '#fff', textTransform: 'uppercase', lineHeight: 0.88,
        textAlign: 'center', letterSpacing: '-0.03em',
      }}>
        {flavor}
      </div>
      {/* Mid rule */}
      <div style={{ position: 'absolute', top: 580, left: 60, right: 60, height: 2, background: '#ffffff40' }} />
      {/* Hook as tagline */}
      <div style={{
        position: 'absolute', top: 610, left: 80, right: 80,
        fontFamily: handFont, fontSize: 32, fontWeight: 400,
        color: '#ffffffCC', textAlign: 'center', lineHeight: 1.2,
      }}>
        "{hook}"
      </div>
      {/* Bottom details */}
      <div style={{
        position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center',
        fontFamily: accentFont, fontSize: 16, fontWeight: 600,
        color: '#ffffff70', letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {theme.strainType ? `${theme.strainType} • ` : ''}Ultra Premium • Live Resin
      </div>
      {/* Bottom rule */}
      <div style={{ position: 'absolute', bottom: 50, left: 60, right: 60, height: 3, background: '#fff' }} />
      <div style={{
        position: 'absolute', bottom: 25, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 14, fontWeight: 700,
        color: '#ffffff40', letterSpacing: '0.15em',
      }}>
        2G & 4G LIVE RESIN AVAILABLE NOW
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 8: "Floating" — Levitating product with dramatic shadow
// ═══════════════════════════════════════════════════════════

function Floating({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${theme.primaryColor} 0%, ${theme.backgroundColor} 100%)` }} />
      {/* Flavor at top */}
      <div style={{
        position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 48, fontWeight: 700,
        ...outlinedTextStyle('#fff', 'rgba(0,0,0,0.2)', 2),
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {flavor}
      </div>
      {/* Product floating */}
      <div style={{
        position: 'absolute', top: 160, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 520, maxHeight: 520,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>
      {/* Oval shadow on "ground" */}
      <div style={{
        position: 'absolute', top: 720, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 50, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)',
      }} />
      {/* Sparkles */}
      <Sparkle x={280} y={250} size={28} color="#fff" rotation={15} />
      <Sparkle x={750} y={350} size={24} color={theme.accentColor} rotation={-20} />
      <Sparkle x={200} y={550} size={20} color="#fff" rotation={30} />
      {/* Hook at bottom */}
      <div style={{
        position: 'absolute', bottom: 80, left: 60, right: 60,
        fontFamily: headingFont, fontSize: 34, fontWeight: 700,
        color: '#fff', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1,
        ...boldShadowStyle('#fff', 'rgba(0,0,0,0.2)', 3),
      }}>
        {hook}
      </div>
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
        color: '#ffffff40', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        SPACE APE • {theme.strainType || 'LIVE RESIN'}
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 9: "Versus" — Side-by-side comparison
// ═══════════════════════════════════════════════════════════

function Versus({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const [img1, img2] = [images[0], images[1] || images[0]]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Left half */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
        background: theme.primaryColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ProductImg src={img1} style={{ maxWidth: 380, maxHeight: 380, filter: themeShadow(theme.primaryColor, 'medium') }} />
        <div style={{
          position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
          fontFamily: headingFont, fontSize: 28, fontWeight: 700, color: '#fff', textTransform: 'uppercase',
        }}>
          2G
        </div>
      </div>
      {/* Right half */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
        background: theme.accentColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ProductImg src={img2} style={{ maxWidth: 380, maxHeight: 380, filter: themeShadow(theme.primaryColor, 'medium') }} />
        <div style={{
          position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
          fontFamily: headingFont, fontSize: 28, fontWeight: 700, color: '#fff', textTransform: 'uppercase',
        }}>
          4G
        </div>
      </div>
      {/* VS circle at divider */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 10,
        width: 80, height: 80, borderRadius: '50%',
        background: '#fff', border: `4px solid ${theme.primaryColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontFamily: headingFont, fontSize: 28, fontWeight: 700, color: theme.primaryColor }}>VS</div>
      </div>
      {/* Flavor + hook at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#000000CC', backdropFilter: 'blur(8px)',
        padding: '24px 50px',
      }}>
        <div style={{ fontFamily: headingFont, fontSize: 32, fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: 6 }}>
          {flavor}
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, color: '#ffffffAA', lineHeight: 1.3 }}>{hook}</div>
      </div>
      {/* SPACE APE top center */}
      <div style={{
        position: 'absolute', top: 15, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 16, fontWeight: 700, color: '#ffffff50', letterSpacing: '0.12em',
      }}>
        SPACE APE
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 10: "Closeup" — Extreme crop, magazine ad
// ═══════════════════════════════════════════════════════════

function Closeup({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />
      {/* Product HUGE, cropped tight */}
      <div style={{
        position: 'absolute', top: -100, left: -100, right: -100,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: 900,
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 1000, maxHeight: 1000,
          filter: themeShadow(theme.primaryColor, 'dramatic'),
        }} />
      </div>
      {/* SPACE APE centered at top */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 22, fontWeight: 700,
        color: '#ffffff60', letterSpacing: '0.12em',
      }}>
        SPACE APE
      </div>
      {/* Bottom overlay — flavor + hook */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, #000000CC 40%)',
        padding: '80px 50px 40px',
      }}>
        <div style={{ fontFamily: accentFont, fontSize: 40, fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
          {flavor}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#ffffffAA', lineHeight: 1.3 }}>{hook}</div>
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 11: "Quote Card" — Bold quote / hot take
// ═══════════════════════════════════════════════════════════

function QuoteCard({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />
      {/* Giant quotation mark */}
      <div style={{
        position: 'absolute', top: 60, left: 50,
        fontFamily: headingFont, fontSize: 300, fontWeight: 700,
        color: '#ffffff12', lineHeight: 0.6,
      }}>
        &ldquo;
      </div>
      {/* Hook text fills center */}
      <div style={{
        position: 'absolute', top: 200, left: 80, right: 80, bottom: 300,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 64, fontWeight: 700,
          color: '#fff', lineHeight: 1.05, textTransform: 'uppercase',
          ...clampText(3),
        }}>
          {hook}
        </div>
      </div>
      {/* Attribution */}
      <div style={{
        position: 'absolute', bottom: 160, left: 80,
        fontFamily: accentFont, fontSize: 20, fontWeight: 600,
        color: '#ffffffAA',
      }}>
        — SPACE APE • {flavor}
      </div>
      {/* Small product at bottom right */}
      <div style={{ position: 'absolute', bottom: 40, right: 50 }}>
        <StickerFrame borderWidth={4} borderRadius={14} rotation={5}>
          <ProductImg src={mainImg} style={{ maxWidth: 200, maxHeight: 200, filter: themeShadow(theme.primaryColor, 'soft') }} />
        </StickerFrame>
      </div>
      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 50, left: 80,
          color: '#ffffff50', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 12: "Diagonal Banner" — Angled banner across product
// ═══════════════════════════════════════════════════════════

function DiagonalBanner({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: '#FAF7F2' }} />
      {/* Product centered */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', height: 700, alignItems: 'center',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 550, maxHeight: 550,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>
      {/* Diagonal banner */}
      <div style={{
        position: 'absolute', top: 440, left: -200, right: -200,
        height: 100, background: theme.primaryColor,
        transform: 'rotate(-15deg)', transformOrigin: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 32, fontWeight: 700,
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
          {hook}
        </div>
      </div>
      {/* Flavor at top */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 44, fontWeight: 700,
        color: theme.primaryColor, textTransform: 'uppercase',
      }}>
        {flavor}
      </div>
      {/* SPACE APE bottom */}
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 16, fontWeight: 700,
        color: theme.primaryColor, letterSpacing: '0.12em', opacity: 0.6,
      }}>
        SPACE APE • {theme.strainType || 'LIVE RESIN'}
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 13: "Stamp Card" — Rubber stamp / passport aesthetic
// ═══════════════════════════════════════════════════════════

function StampCard({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, ...polkaDotBg(`${theme.primaryColor}08`, '#FAF7F2', 3, 12) }} />
      {/* Product centered */}
      <div style={{
        position: 'absolute', top: 150, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', height: 500, alignItems: 'center',
      }}>
        <ProductImg src={mainImg} style={{ maxWidth: 420, maxHeight: 420, filter: themeShadow(theme.primaryColor, 'medium') }} />
      </div>
      {/* Circular stamp — flavor name */}
      <div style={{
        position: 'absolute', top: 60, right: 60,
        width: 180, height: 180, borderRadius: '50%',
        border: `5px solid ${theme.primaryColor}`, transform: 'rotate(12deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 15,
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 22, fontWeight: 700,
          color: theme.primaryColor, textTransform: 'uppercase',
          textAlign: 'center', lineHeight: 1.0,
        }}>
          {flavor}
        </div>
      </div>
      {/* Rectangle stamp — ULTRA PREMIUM */}
      <div style={{
        position: 'absolute', top: 80, left: 50, transform: 'rotate(-8deg)',
        border: `4px solid ${theme.accentColor}`, padding: '8px 20px',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 16, fontWeight: 700,
          color: theme.accentColor, textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          ULTRA PREMIUM
        </div>
      </div>
      {/* APPROVED stamp */}
      <div style={{
        position: 'absolute', bottom: 200, left: 80, transform: 'rotate(-5deg)',
        border: `4px solid #10b981`, padding: '6px 24px', borderRadius: 4,
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 20, fontWeight: 700,
          color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          LAB TESTED
        </div>
      </div>
      {/* Strain stamp */}
      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 120, right: 80, transform: 'rotate(6deg)',
          border: `3px solid ${theme.primaryColor}`, borderRadius: 20, padding: '6px 18px',
        }}>
          <div style={{
            fontFamily: headingFont, fontSize: 14, fontWeight: 700,
            color: theme.primaryColor, textTransform: 'uppercase',
          }}>
            {theme.strainType}
          </div>
        </div>
      )}
      {/* Hook at bottom */}
      <div style={{
        position: 'absolute', bottom: 40, left: 60, right: 60,
        fontFamily: handFont, fontSize: 24, fontWeight: 400,
        color: theme.primaryColor, textAlign: 'center', lineHeight: 1.2,
      }}>
        {hook}
      </div>
      {/* SPACE APE small */}
      <div style={{
        position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 14, fontWeight: 700,
        color: `${theme.primaryColor}40`, letterSpacing: '0.15em',
      }}>
        SPACE APE
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 14: "Neon Sign" — Product with neon glow text
// ═══════════════════════════════════════════════════════════

function NeonSign({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const glow = theme.accentColor
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: '#0a0a0a' }} />
      {/* Subtle grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, ...checkerboardBg('#ffffff', 'transparent', 60) }} />
      {/* Product with glow */}
      <div style={{
        position: 'absolute', top: 120, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', height: 500, alignItems: 'center',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 460, maxHeight: 460,
          filter: `drop-shadow(0 0 60px ${glow}60) drop-shadow(0 20px 40px rgba(0,0,0,0.5))`,
        }} />
      </div>
      {/* Neon flavor text */}
      <div style={{
        position: 'absolute', bottom: 200, left: 50, right: 50,
        fontFamily: headingFont, fontSize: 72, fontWeight: 700,
        color: glow, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.0,
        textShadow: `0 0 10px ${glow}, 0 0 30px ${glow}80, 0 0 60px ${glow}40, 0 0 100px ${glow}20`,
      }}>
        {flavor}
      </div>
      {/* Hook in clean white */}
      <div style={{
        position: 'absolute', bottom: 100, left: 60, right: 60,
        fontFamily: accentFont, fontSize: 22, fontWeight: 500,
        color: '#ffffffAA', textAlign: 'center', lineHeight: 1.3,
      }}>
        {hook}
      </div>
      {/* SPACE APE neon style */}
      <div style={{
        position: 'absolute', top: 45, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 24, fontWeight: 700,
        color: glow, letterSpacing: '0.1em',
        textShadow: `0 0 8px ${glow}, 0 0 20px ${glow}60`,
      }}>
        SPACE APE
      </div>
      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center',
          color: `${glow}80`, fontSize: 13, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          textShadow: `0 0 8px ${glow}40`,
        }}>
          {theme.strainType}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
        color: '#ffffff25', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        Ultra Premium • Live Resin
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 15: "Stack" — Stacked horizontal color strips
// ═══════════════════════════════════════════════════════════

function Stack({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const strips = [
    { color: theme.primaryColor, height: 180 },
    { color: '#FAF7F2', height: 120 },
    { color: theme.accentColor, height: 260 },
    { color: theme.backgroundColor, height: 200 },
    { color: theme.primaryColor, height: 320 },
  ]
  let y = 0
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Color strips */}
      {strips.map((s, i) => {
        const top = y
        y += s.height
        return <div key={i} style={{ position: 'absolute', top, left: 0, right: 0, height: s.height, background: s.color }} />
      })}
      {/* Product spanning across strips */}
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', height: 600, alignItems: 'center',
        zIndex: 5,
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 500, maxHeight: 500,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>
      {/* Text in strips */}
      <div style={{
        position: 'absolute', top: 40, left: 50, zIndex: 10,
        fontFamily: headingFont, fontSize: 22, fontWeight: 700,
        color: '#fff', letterSpacing: '0.1em',
      }}>
        SPACE APE
      </div>
      <div style={{
        position: 'absolute', top: 200, left: 60, zIndex: 10,
        fontFamily: headingFont, fontSize: 20, fontWeight: 700,
        color: theme.primaryColor, textTransform: 'uppercase',
      }}>
        {theme.strainType || 'LIVE RESIN'}
      </div>
      <div style={{
        position: 'absolute', bottom: 120, left: 50, right: 50, zIndex: 10,
        fontFamily: headingFont, fontSize: 52, fontWeight: 700,
        color: '#fff', textTransform: 'uppercase', lineHeight: 1.0,
        ...outlinedTextStyle('#fff', 'rgba(0,0,0,0.3)', 2),
      }}>
        {flavor}
      </div>
      <div style={{
        position: 'absolute', bottom: 50, left: 50, right: 50, zIndex: 10,
        fontFamily: accentFont, fontSize: 18, fontWeight: 500,
        color: '#ffffffCC', lineHeight: 1.3,
      }}>
        {hook}
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 16: "Shout" — Giant playful statement text on white
// Chomps "TASTES LIKE..." energy. Hand-drawn feel, product tiny.
// ═══════════════════════════════════════════════════════════

function Shout({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const bg = brightBg(theme.primaryColor)
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: bg }} />

      {/* SPACE APE tiny at top center */}
      <div style={{
        position: 'absolute', top: 35, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 14, fontWeight: 700,
        color: `${theme.primaryColor}30`, letterSpacing: '0.15em',
      }}>
        SPACE APE
      </div>

      {/* MASSIVE hand-drawn hook text — fills center */}
      <div style={{
        position: 'absolute', top: 80, left: 70, right: 70, bottom: 250,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: handFont, fontSize: 110, fontWeight: 400,
          color: theme.primaryColor, lineHeight: 1.0,
        }}>
          {hook}
        </div>
      </div>

      {/* Sparkle decorations */}
      <Sparkle x={920} y={120} size={35} color={theme.accentColor} rotation={15} />
      <Sparkle x={80} y={800} size={28} color={theme.primaryColor} rotation={-20} />
      <Sparkle x={600} y={60} size={22} color={`${theme.primaryColor}60`} rotation={30} />
      <Heart x={50} y={130} size={40} color={theme.primaryColor} fill={`${theme.primaryColor}25`} strokeWidth={3} rotation={-12} />

      {/* Product — tiny, bottom right, sticker-framed */}
      <div style={{ position: 'absolute', bottom: 50, right: 55 }}>
        <StickerFrame borderWidth={5} borderColor={theme.primaryColor} borderRadius={18} rotation={6}>
          <ProductImg src={mainImg} style={{ maxWidth: 240, maxHeight: 240, filter: themeShadow(theme.primaryColor, 'soft') }} />
        </StickerFrame>
      </div>

      {/* Flavor name — handwritten, bottom left */}
      <div style={{
        position: 'absolute', bottom: 70, left: 60,
        fontFamily: handFont, fontSize: 28, fontWeight: 400,
        color: theme.primaryColor,
      }}>
        {flavor}
      </div>

      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 40, left: 60,
          color: `${theme.primaryColor}60`, fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 17: "Lineup" — Clean product row on bold color
// Products arranged neatly in a row. Shelf display energy.
// ═══════════════════════════════════════════════════════════

function Lineup({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Bold solid color background */}
      <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />

      {/* Flavor name — large, top center */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 72, fontWeight: 700,
        color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {flavor}
      </div>

      {/* Strain pill */}
      {theme.strainType && (
        <div style={{
          position: 'absolute', top: 155, left: '50%', transform: 'translateX(-50%)',
          background: theme.accentColor, padding: '6px 20px', borderRadius: 20,
        }}>
          <div style={{
            fontFamily: accentFont, fontSize: 14, fontWeight: 600,
            color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {theme.strainType}
          </div>
        </div>
      )}

      {/* Product row — centered */}
      <div style={{
        position: 'absolute', top: 220, left: 0, right: 0, bottom: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60,
      }}>
        {images.slice(0, 3).map((img, i) => (
          <ProductImg key={i} src={img} style={{
            maxWidth: images.length === 1 ? 360 : 260,
            maxHeight: images.length === 1 ? 360 : 340,
            filter: themeShadow(theme.primaryColor, 'medium'),
          }} />
        ))}
      </div>

      {/* Hook text — small, below products */}
      <div style={{
        position: 'absolute', bottom: 80, left: 80, right: 80, textAlign: 'center',
        fontFamily: bodyFont, fontSize: 24, fontWeight: 500,
        color: '#ffffffCC', lineHeight: 1.3,
      }}>
        {hook}
      </div>

      {/* SPACE APE — bottom center */}
      <div style={{
        position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 13, fontWeight: 700,
        color: '#ffffff30', letterSpacing: '0.15em',
      }}>
        SPACE APE
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 18: "PersonaPick" — Personality quiz / "Pick your vibe"
// 2-3 colored columns with personality labels and products.
// ═══════════════════════════════════════════════════════════

const PERSONA_LABELS = ['THE CHILL ONE', 'THE BOLD ONE', 'THE SMOOTH ONE', 'MAIN CHARACTER', 'THE WILD CARD', 'THE OG']

function PersonaPick({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const seed = seedFromText(hook)
  const colCount = Math.min(images.length, 3)
  const colColors = [theme.primaryColor, theme.accentColor, theme.backgroundColor]
  const colWidth = (1000 - (colCount - 1) * 20) / colCount

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* White canvas */}
      <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }} />

      {/* Title */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: handFont, fontSize: 48, fontWeight: 400,
        color: theme.primaryColor,
      }}>
        PICK YOUR VIBE
      </div>

      <StickerStar x={880} y={30} size={50} color={theme.primaryColor} strokeWidth={3} rotation={12} />

      {/* Columns */}
      <div style={{
        position: 'absolute', top: 130, left: 40, right: 40, bottom: 100,
        display: 'flex', gap: 20,
      }}>
        {images.slice(0, colCount).map((img, i) => (
          <div key={i} style={{
            width: colWidth, flex: 1, borderRadius: 24,
            background: colColors[i] || theme.primaryColor,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '30px 15px 20px',
          }}>
            {/* Personality label */}
            <div style={{
              fontFamily: handFont, fontSize: 20, fontWeight: 400,
              color: '#fff', textAlign: 'center', marginBottom: 20,
            }}>
              {seededPick(seed, i, PERSONA_LABELS)}
            </div>

            {/* Product */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <ProductImg src={img} style={{
                maxWidth: colWidth - 40, maxHeight: 420,
                filter: themeShadow(theme.primaryColor, 'medium'),
              }} />
            </div>

            {/* Flavor snippet at bottom */}
            <div style={{
              fontFamily: accentFont, fontSize: 13, fontWeight: 600,
              color: '#ffffffCC', textTransform: 'uppercase', marginTop: 12,
              letterSpacing: '0.06em', textAlign: 'center',
            }}>
              {flavor}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 12, fontWeight: 700,
        color: `${theme.primaryColor}30`, letterSpacing: '0.15em',
      }}>
        SPACE APE
      </div>

      {/* Hook at bottom */}
      <div style={{
        position: 'absolute', bottom: 30, left: 60, right: 60, textAlign: 'center',
        fontFamily: bodyFont, fontSize: 18, fontWeight: 500,
        color: `${theme.primaryColor}AA`, lineHeight: 1.3,
      }}>
        {hook}
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 19: "Teaser" — Coming soon / product peek reveal
// Product peeking from bottom edge. Anticipation energy.
// ═══════════════════════════════════════════════════════════

function Teaser({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Bold solid background */}
      <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        ...polkaDotBg('#ffffff', 'transparent', 3, 14),
      }} />

      {/* SPACE APE top left */}
      <div style={{
        position: 'absolute', top: 50, left: 55,
        fontFamily: headingFont, fontSize: 16, fontWeight: 700,
        color: '#ffffff50', letterSpacing: '0.12em',
      }}>
        SPACE APE
      </div>

      {/* Large hook text — upper 55% */}
      <div style={{
        position: 'absolute', top: 100, left: 80, right: 80, bottom: 500,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 80, fontWeight: 700,
          color: '#fff', textTransform: 'uppercase',
          lineHeight: 0.95, letterSpacing: '-0.02em',
        }}>
          {hook}
        </div>
      </div>

      {/* Flavor name above the wave */}
      <div style={{
        position: 'absolute', top: 530, left: 0, right: 0, textAlign: 'center',
        fontFamily: accentFont, fontSize: 20, fontWeight: 600,
        color: theme.accentColor, textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {flavor}
      </div>

      {/* Wavy divider */}
      <WavyDivider y={580} width={1080} color="#ffffff60" amplitude={18} strokeWidth={3} />

      {/* Sparkles near the peek */}
      <Sparkle x={180} y={650} size={24} color="#fff" rotation={15} />
      <Sparkle x={820} y={700} size={20} color={theme.accentColor} rotation={-25} />
      <Sparkle x={500} y={620} size={18} color="#fff" rotation={30} />

      {/* Product peeking from bottom — only top 35% visible */}
      <div style={{
        position: 'absolute', bottom: -350, left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 500, maxHeight: 500,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>

      {/* "COMING SOON" or strain at bottom center (visible above product) */}
      <div style={{
        position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
        color: '#ffffff30', fontSize: 12, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {theme.strainType ? `${theme.strainType} • ` : ''}Ultra Premium • Live Resin
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 20: "GiftTag" — Personal recommendation / "For You"
// Product in oversized sticker frame, gift-wrapping energy.
// ═══════════════════════════════════════════════════════════

function GiftTag({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const bg = brightBg(theme.primaryColor)
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Light pastel background */}
      <div style={{ position: 'absolute', inset: 0, background: bg }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        ...stripesBg(`${theme.primaryColor}15`, 'transparent', 45, 24),
      }} />

      {/* "THIS ONE'S FOR YOU" handwritten above frame */}
      <div style={{
        position: 'absolute', top: 55, left: 0, right: 0, textAlign: 'center',
        fontFamily: handFont, fontSize: 50, fontWeight: 400,
        color: theme.primaryColor,
      }}>
        THIS ONE'S FOR YOU
      </div>

      {/* Large centered sticker frame with product */}
      <div style={{
        position: 'absolute', top: 170, left: '50%', transform: 'translateX(-50%)',
      }}>
        <StickerFrame borderWidth={10} borderColor={theme.primaryColor} borderRadius={30} rotation={-2}>
          <ProductImg src={mainImg} style={{ maxWidth: 420, maxHeight: 420, filter: themeShadow(theme.primaryColor, 'medium') }} />
        </StickerFrame>
      </div>

      {/* Decorations around frame */}
      <Heart x={120} y={200} size={50} color={theme.primaryColor} fill={theme.primaryColor} strokeWidth={0} rotation={-15} />
      <Daisy x={880} y={650} size={70} petalColor={`${theme.accentColor}50`} centerColor={theme.primaryColor} rotation={20} />
      <Sparkle x={900} y={200} size={30} color={theme.accentColor} rotation={12} />
      <Sparkle x={140} y={680} size={24} color={theme.primaryColor} rotation={-18} />

      {/* Flavor name below frame */}
      <div style={{
        position: 'absolute', bottom: 130, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 36, fontWeight: 700,
        color: theme.primaryColor, textTransform: 'uppercase',
      }}>
        {flavor}
      </div>

      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 105, left: 0, right: 0, textAlign: 'center',
          color: `${theme.primaryColor}60`, fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}

      {/* Hook below flavor */}
      <div style={{
        position: 'absolute', bottom: 70, left: 80, right: 80, textAlign: 'center',
        fontFamily: bodyFont, fontSize: 18, fontWeight: 500,
        color: `${theme.primaryColor}AA`, lineHeight: 1.3,
      }}>
        {hook}
      </div>

      {/* SPACE APE bottom */}
      <div style={{
        position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
        fontFamily: headingFont, fontSize: 13, fontWeight: 700,
        color: `${theme.primaryColor}30`, letterSpacing: '0.15em',
      }}>
        SPACE APE
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 21: "BubblePop" — Speech bubble callout
// Product "speaks" the hook via a large speech bubble.
// ═══════════════════════════════════════════════════════════

function BubblePop({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* White background with subtle polka dots */}
      <div style={{
        position: 'absolute', inset: 0,
        ...polkaDotBg(`${theme.primaryColor}08`, '#FFFFFF', 3, 16),
      }} />

      {/* Speech bubble — upper-left area */}
      <SpeechBubble x={60} y={60} width={700} height={450} color={theme.primaryColor} borderColor={theme.accentColor} borderWidth={5} />

      {/* Hook text inside bubble */}
      <div style={{
        position: 'absolute', top: 100, left: 110, width: 580, height: 360,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: headingFont, fontSize: 52, fontWeight: 700,
          color: '#fff', textTransform: 'uppercase', lineHeight: 1.05,
          ...clampText(5),
        }}>
          {hook}
        </div>
      </div>

      {/* Product — bottom right, "speaking" the bubble */}
      <div style={{
        position: 'absolute', bottom: 60, right: 60,
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 380, maxHeight: 380,
          filter: themeShadow(theme.primaryColor, 'soft'),
        }} />
      </div>

      {/* Flavor name — below bubble, left side */}
      <div style={{
        position: 'absolute', bottom: 520, left: 80,
        fontFamily: handFont, fontSize: 32, fontWeight: 400,
        color: theme.primaryColor,
      }}>
        {flavor}
      </div>

      {/* Strain badge */}
      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 480, left: 80,
          fontFamily: accentFont, fontSize: 12, fontWeight: 600,
          color: `${theme.primaryColor}80`, textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {theme.strainType} • Live Resin
        </div>
      )}

      {/* Scattered decorations */}
      <StickerStar x={820} y={80} size={45} color={theme.primaryColor} strokeWidth={3} rotation={15} />
      <StickerStar x={950} y={550} size={35} color={theme.accentColor} strokeWidth={2.5} rotation={-20} />
      <Sparkle x={40} y={900} size={28} color={theme.primaryColor} rotation={25} />

      {/* SPACE APE — bottom left */}
      <div style={{
        position: 'absolute', bottom: 30, left: 60,
        fontFamily: headingFont, fontSize: 14, fontWeight: 700,
        color: `${theme.primaryColor}30`, letterSpacing: '0.15em',
      }}>
        SPACE APE
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 22: "CleanStudio" — Professional product photo on solid color
// Product huge, studio lighting, minimal text. Chomps clean energy.
// ═══════════════════════════════════════════════════════════

function CleanStudio({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const bg = saturateColor(theme.primaryColor, 1.2)
  return (
    <PhotoStack intensity="subtle">
      <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
        {/* Vivid solid color background — no patterns, no decorations */}
        <div style={{ position: 'absolute', inset: 0, background: bg }} />

        {/* Studio light simulation */}
        <GlossHighlight angle={135} opacity={0.12} coverage={50} />

        {/* Product HUGE — centered */}
        <div style={{
          position: 'absolute', top: 90, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', height: 820, alignItems: 'center',
        }}>
          <ProductImg src={mainImg} style={{
            maxWidth: 780, maxHeight: 780,
            filter: themeShadow(theme.primaryColor, 'dramatic'),
          }} />
        </div>

        {/* Flavor name — small, bottom center */}
        <div style={{
          position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center',
          fontFamily: accentFont, fontSize: 28, fontWeight: 600,
          color: '#ffffffCC', textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {flavor}
        </div>

        {/* SPACE APE — bottom left */}
        <div style={{
          position: 'absolute', bottom: 30, left: 50,
          fontFamily: headingFont, fontSize: 13, fontWeight: 700,
          color: '#ffffff25', letterSpacing: '0.15em',
        }}>
          SPACE APE
        </div>

        {/* Strain — bottom right */}
        {theme.strainType && (
          <div style={{
            position: 'absolute', bottom: 30, right: 50,
            color: '#ffffff25', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
            {theme.strainType} • Live Resin
          </div>
        )}
      </AbsoluteFill>
    </PhotoStack>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 23: "WarmShot" — Lifestyle photography feel
// Warm gradient, grain, film annotation strip, white caption bar.
// ═══════════════════════════════════════════════════════════

function WarmShot({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const gradEnd = lightenColor(theme.primaryColor, 20)
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Warm gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, ${theme.primaryColor} 0%, ${gradEnd} 100%)`,
      }} />

      {/* Hook text — film annotation strip at top */}
      <div style={{
        position: 'absolute', top: 50, left: 0, right: 0, zIndex: 5,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
        padding: '14px 50px',
      }}>
        <div style={{
          fontFamily: bodyFont, fontSize: 20, fontWeight: 600,
          color: '#ffffffCC', lineHeight: 1.3,
        }}>
          {hook}
        </div>
      </div>

      {/* Product — large, slightly left of center */}
      <div style={{
        position: 'absolute', top: 140, left: 0, right: 0, bottom: 100,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        paddingRight: 40,
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 620, maxHeight: 620,
          filter: themeShadow(theme.primaryColor, 'medium'),
        }} />
      </div>

      {/* Photo overlays — applied to photo area only (above caption bar) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100 }}>
        <GrainOverlay opacity={0.05} />
        <VignetteOverlay intensity={0.30} />
        <WarmTint opacity={0.07} />
      </div>

      {/* White caption bar at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: '#ffffff', padding: '20px 50px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: headingFont, fontSize: 24, fontWeight: 700,
            color: theme.primaryColor, textTransform: 'uppercase',
          }}>
            {flavor}
          </div>
          {theme.strainType && (
            <div style={{
              fontFamily: bodyFont, fontSize: 12, fontWeight: 600,
              color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
            }}>
              {theme.strainType} • Ultra Premium
            </div>
          )}
        </div>
        <div style={{
          fontFamily: headingFont, fontSize: 12, fontWeight: 700,
          color: '#ccc', letterSpacing: '0.12em',
        }}>
          SPACE APE
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 24: "HeroProduct" — Full bleed product, magazine cover
// Product fills 85%+ of canvas. Dark, cinematic, dramatic.
// ═══════════════════════════════════════════════════════════

function HeroProduct({ theme, flavor, hook, images }: { theme: FlavorTheme; flavor: string; hook: string; images: string[] }) {
  const mainImg = images[0]
  const darkBg = darkenColor(theme.backgroundColor, 10)
  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Dark background */}
      <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />

      {/* Atmospheric glow behind product */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primaryColor}30 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
      }} />

      {/* Product fills frame */}
      <div style={{
        position: 'absolute', top: -30, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', height: 950, alignItems: 'center',
      }}>
        <ProductImg src={mainImg} style={{
          maxWidth: 950, maxHeight: 950,
          filter: themeShadow(theme.primaryColor, 'dramatic'),
        }} />
      </div>

      {/* Studio light */}
      <GlossHighlight angle={120} opacity={0.06} coverage={35} />

      {/* Vignette for drama */}
      <VignetteOverlay intensity={0.35} />

      {/* Dark gradient at bottom for text */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 400,
        background: `linear-gradient(to top, ${darkBg} 0%, ${theme.backgroundColor}CC 40%, transparent 100%)`,
      }} />

      {/* SPACE APE — top left, ghost */}
      <div style={{
        position: 'absolute', top: 40, left: 50, zIndex: 5,
        fontFamily: headingFont, fontSize: 16, fontWeight: 700,
        color: '#ffffff15', letterSpacing: '0.12em',
      }}>
        SPACE APE
      </div>

      {/* Flavor name in gradient area */}
      <div style={{
        position: 'absolute', bottom: 120, left: 60, zIndex: 5,
        fontFamily: headingFont, fontSize: 48, fontWeight: 700,
        color: theme.accentColor, textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {flavor}
      </div>

      {theme.strainType && (
        <div style={{
          position: 'absolute', bottom: 95, left: 60, zIndex: 5,
          color: '#ffffff50', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {theme.strainType} • Ultra Premium • Live Resin
        </div>
      )}

      {/* Hook text */}
      <div style={{
        position: 'absolute', bottom: 60, left: 60, right: 60, zIndex: 5,
        fontFamily: bodyFont, fontSize: 20, fontWeight: 500,
        color: '#ffffffAA', lineHeight: 1.3,
      }}>
        {hook}
      </div>
    </AbsoluteFill>
  )
}

// ─── Main component — selects template ───
export default function SingleImage({ flavor, hook, caption, hashtags, pillar, subcategory, layoutTemplate }: SingleImageProps) {
  const theme = getFlavorTheme(flavor)
  const images = theme.productImages
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)

  const props = { theme, flavor, hook, images }

  let template: React.ReactNode
  switch (layoutTemplate) {
    case 1: template = <SupremeBox {...props} />; break
    case 2: template = <StreetDark {...props} />; break
    case 3: template = <CatalogGrid {...props} />; break
    case 4: template = <StickerBomb {...props} />; break
    case 5: template = <SplitText {...props} />; break
    case 6: template = <Polaroid {...props} />; break
    case 7: template = <Poster {...props} />; break
    case 8: template = <Floating {...props} />; break
    case 9: template = <Versus {...props} />; break
    case 10: template = <Closeup {...props} />; break
    case 11: template = <QuoteCard {...props} />; break
    case 12: template = <DiagonalBanner {...props} />; break
    case 13: template = <StampCard {...props} />; break
    case 14: template = <NeonSign {...props} />; break
    case 15: template = <Stack {...props} />; break
    case 16: template = <Shout {...props} />; break
    case 17: template = <Lineup {...props} />; break
    case 18: template = <PersonaPick {...props} />; break
    case 19: template = <Teaser {...props} />; break
    case 20: template = <GiftTag {...props} />; break
    case 21: template = <BubblePop {...props} />; break
    case 22: template = <CleanStudio {...props} />; break
    case 23: template = <WarmShot {...props} />; break
    case 24: template = <HeroProduct {...props} />; break
    default: template = <SupremeBox {...props} />
  }

  if (!badgeLabel) return <>{template}</>
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {template}
      <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} />
    </div>
  )
}
