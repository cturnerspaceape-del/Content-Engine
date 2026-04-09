import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion'
import { getFlavorTheme } from '../flavorThemes'
import type { ReelProps, FlavorTheme } from '../types'
import {
  StickerStar, Daisy, Heart, Sparkle, Blob, StickerFrame, SpeechBubble, WavyDivider, Ring, ProductImg,
  polkaDotBg, stripesBg, diagonalHatchBg, concentricCirclesBg,
  seededStripesBg, seededPolkaDotBg,
  outlinedTextStyle, boldShadowStyle, wiggle, brightBg,
  seedFromText, seededInt, seededRange,
  headingFont, bodyFont, accentFont, handFont,
  getVisualMode, getBadgeLabel, BadgeOverlay, StepIndicator,
  type VisualMode,
  themeShadow,
} from '../components/shared'

const FPS = 30
const TOTAL_FRAMES = 450

// Per-template timing configs
const TIMINGS = {
  kineticType:  { hookEnd: 50, revealEnd: 140, bodyEnd: 280, showcaseEnd: 370 },
  productDrop:  { hookEnd: 35, revealEnd: 150, bodyEnd: 260, showcaseEnd: 350 },
  splitMotion:  { hookEnd: 45, revealEnd: 120, bodyEnd: 280, showcaseEnd: 370 },
  glowPulse:    { hookEnd: 55, revealEnd: 145, bodyEnd: 265, showcaseEnd: 355 },
}

// ─── Template 1: KineticType ───
function KineticType({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const { hookEnd: HOOK_END, revealEnd: REVEAL_END, bodyEnd: BODY_END, showcaseEnd: SHOWCASE_END } = TIMINGS.kineticType
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const imgForPhase = (phase: number) => images[seededInt(seed, phase, 0, images.length - 1)]
  const mainImg = imgForPhase(0)
  const words = hook.split(' ')

  return (
    <AbsoluteFill style={{ background: theme.primaryColor, overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Subtle gradient shift over time */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(${interpolate(frame, [0, TOTAL_FRAMES], [135, 225])}deg, ${theme.primaryColor}, ${theme.backgroundColor})`,
      }} />

      {/* Subtle pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        ...polkaDotBg(theme.accentColor, 'transparent', 6, 28),
      }} />

      {/* SPACE APE watermark — outlined */}
      <div style={{
        position: 'absolute', top: 60, left: 50,
        fontFamily: headingFont, fontSize: 24, fontWeight: 700,
        letterSpacing: '0.08em',
        ...outlinedTextStyle('#ffffff60', 'rgba(0,0,0,0.2)', 1.5),
      }}>
        SPACE APE
      </div>

      {/* Persistent decorations */}
      <StickerStar x={950} y={100} size={44} color="#fff" strokeWidth={2.5} fill={`${theme.accentColor}25`} rotation={frame * 0.3} />
      <Daisy x={30} y={1750} size={48} petalColor={`${theme.accentColor}35`} centerColor="#fff" rotation={frame * -0.2} />

      {/* Visual mode badge */}
      {badgeLabel && <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />}

      {/* ── Hook phase: words spring in one by one ── */}
      {frame < HOOK_END && (
        <div style={{
          position: 'absolute', top: 600, left: 60, right: 60,
          display: 'flex', flexWrap: 'wrap', gap: '8px 14px',
        }}>
          {words.map((word, i) => {
            const delay = i * 4
            const s = spring({ frame: Math.max(0, frame - delay), fps: FPS, config: { damping: 7, stiffness: 180 } })
            return (
              <span key={i} style={{
                fontFamily: headingFont, fontSize: 72, fontWeight: 700,
                textTransform: 'uppercase', lineHeight: 1.0,
                ...outlinedTextStyle('#fff', theme.backgroundColor, 3),
                opacity: s, transform: `translateY(${(1 - s) * 50}px) rotate(${(1 - s) * -5}deg)`,
                display: 'inline-block',
              }}>
                {word}
              </span>
            )
          })}
        </div>
      )}

      {/* ── Product reveal phase ── */}
      {frame >= HOOK_END && frame < REVEAL_END && (() => {
        const revealFrame = frame - HOOK_END
        const productScale = spring({ frame: revealFrame, fps: FPS, config: { damping: 6, stiffness: 160 } })
        const glowOpacity = interpolate(revealFrame, [0, 30, 90], [0, 0.7, 0.4], { extrapolateRight: 'clamp' })
        return (
          <>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 800, height: 800, borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.accentColor}${Math.round(glowOpacity * 99).toString().padStart(2, '0')} 0%, transparent 70%)`,
              transform: 'translate(-50%, -55%)',
            }} />
            <Blob x={200} y={350} size={600} color={`${theme.accentColor}18`} variant={1} />
            <div style={{
              position: 'absolute', top: 200, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 800, alignItems: 'center',
              transform: `scale(${productScale}) rotate(${wiggle(revealFrame, 2, 0.06)}deg)`,
            }}>
              <StickerFrame borderWidth={6} borderRadius={28} rotation={0}>
                <ProductImg src={mainImg} style={{
                  maxWidth: 480, maxHeight: 480,
                  filter: themeShadow(theme.primaryColor, 'dramatic'),
                }} />
              </StickerFrame>
            </div>
            <div style={{
              position: 'absolute', bottom: 200, left: 60, right: 60,
              fontFamily: headingFont, fontSize: 58, fontWeight: 700,
              textTransform: 'uppercase', lineHeight: 1.0,
              textAlign: 'center',
              ...outlinedTextStyle('#fff', theme.backgroundColor, 3),
              opacity: interpolate(revealFrame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              {flavor}
            </div>
            <Heart x={150} y={400} size={40} color={theme.accentColor} fill={`${theme.accentColor}30`} strokeWidth={3} rotation={interpolate(revealFrame, [0, 90], [0, 15])} />
            <Sparkle x={850} y={500} size={30} color="#fff" rotation={revealFrame * 2} />
          </>
        )
      })()}

      {/* ── Body phase: cycling text overlays ── */}
      {frame >= REVEAL_END && frame < BODY_END && (() => {
        const bodyFrame = frame - REVEAL_END
        const phrases = caption.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 3)
        if (phrases.length === 0) phrases.push(caption.slice(0, 80))
        const phraseDuration = (BODY_END - REVEAL_END) / phrases.length
        const currentPhraseIndex = Math.min(Math.floor(bodyFrame / phraseDuration), phrases.length - 1)
        const phraseFrame = bodyFrame - currentPhraseIndex * phraseDuration
        const fadeIn = interpolate(phraseFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
        const fadeOut = interpolate(phraseFrame, [phraseDuration - 10, phraseDuration], [1, 0], { extrapolateRight: 'clamp' })
        const textOpacity = Math.min(fadeIn, fadeOut)

        return (
          <>
            <div style={{
              position: 'absolute', top: 250, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 600, alignItems: 'center',
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 400, maxHeight: 400, opacity: 0.35,
                filter: themeShadow(theme.primaryColor, 'medium'),
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 300, left: 50, right: 50,
              background: theme.primaryColor, border: '4px solid #fff',
              borderRadius: 24, padding: '30px 40px',
              boxShadow: '5px 7px 0px rgba(0,0,0,0.15)',
              opacity: textOpacity,
              transform: `translateY(${(1 - fadeIn) * 20}px)`,
            }}>
              <div style={{
                fontFamily: headingFont, fontSize: 40, fontWeight: 700,
                textTransform: 'uppercase', lineHeight: 1.15,
                textAlign: 'center',
                ...outlinedTextStyle('#fff', theme.backgroundColor, 2),
              }}>
                {phrases[currentPhraseIndex]?.trim()}
              </div>
            </div>
          </>
        )
      })()}

      {/* ── Flavor showcase phase ── */}
      {frame >= BODY_END && frame < SHOWCASE_END && (() => {
        const showFrame = frame - BODY_END
        const fillWidth = interpolate(showFrame, [0, 20], [0, 100], { extrapolateRight: 'clamp' })
        const textScale = spring({ frame: Math.max(0, showFrame - 10), fps: FPS, config: { damping: 7, stiffness: 170 } })
        const productY = interpolate(showFrame, [15, 40], [200, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

        return (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              background: theme.accentColor,
              clipPath: `inset(0 ${100 - fillWidth}% 0 0)`,
            }} />
            <div style={{
              position: 'absolute', top: 300, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
              transform: `translateY(${productY}px)`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 500, maxHeight: 500,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
            <div style={{
              position: 'absolute', top: 150, left: 0, right: 0,
              fontFamily: headingFont, fontSize: 90, fontWeight: 700,
              color: theme.backgroundColor, textTransform: 'uppercase',
              textAlign: 'center', lineHeight: 0.95,
              transform: `scale(${textScale})`,
            }}>
              {flavor}
            </div>
            {theme.strainType && (
              <div style={{
                position: 'absolute', bottom: 250, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                opacity: interpolate(showFrame, [25, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}>
                <div style={{
                  background: theme.backgroundColor, color: theme.accentColor,
                  fontFamily: headingFont, fontSize: 22, fontWeight: 700,
                  padding: '12px 32px', borderRadius: 30, textTransform: 'uppercase',
                }}>
                  {theme.strainType}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* ── CTA/Outro phase ── */}
      {frame >= SHOWCASE_END && (() => {
        const outroFrame = frame - SHOWCASE_END
        const logoScale = spring({ frame: outroFrame, fps: FPS, config: { damping: 6, stiffness: 180 } })
        const ctaOpacity = interpolate(outroFrame, [20, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

        return (
          <div style={{
            position: 'absolute', inset: 0,
            ...polkaDotBg(`${theme.primaryColor}18`, theme.backgroundColor, 8, 30),
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 40,
          }}>
            <StickerStar x={200} y={400} size={56} color={theme.primaryColor} strokeWidth={3} fill={`${theme.accentColor}25`} rotation={outroFrame * 0.5} />
            <StickerStar x={800} y={1300} size={48} color={theme.accentColor} strokeWidth={2.5} rotation={outroFrame * -0.4} />
            <Daisy x={750} y={500} size={52} petalColor={`${theme.primaryColor}40`} centerColor={theme.accentColor} rotation={outroFrame * 0.3} />
            <Heart x={250} y={1200} size={40} color={theme.primaryColor} fill={`${theme.primaryColor}25`} strokeWidth={3} rotation={-15} />
            <div style={{
              fontFamily: headingFont, fontSize: 62, fontWeight: 700,
              letterSpacing: '0.06em',
              ...outlinedTextStyle(theme.primaryColor, '#fff', 3),
              transform: `scale(${logoScale})`,
            }}>
              SPACE APE
            </div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: '#ffffff70',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              opacity: ctaOpacity,
            }}>
              Ultra Premium • Live Resin
            </div>
            <div style={{
              background: theme.primaryColor, color: '#fff',
              fontFamily: headingFont, fontSize: 24, fontWeight: 700,
              padding: '18px 56px', borderRadius: 40,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              border: '3px solid #fff',
              boxShadow: '5px 6px 0px rgba(0,0,0,0.15)',
              opacity: ctaOpacity,
              transform: `translateY(${(1 - ctaOpacity) * 20}px)`,
            }}>
              Follow @SpaceApe
            </div>
          </div>
        )
      })()}
    </AbsoluteFill>
  )
}

// ─── Template 2: ProductDrop ───
function ProductDrop({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const { hookEnd: HOOK_END, revealEnd: REVEAL_END, bodyEnd: BODY_END, showcaseEnd: SHOWCASE_END } = TIMINGS.productDrop
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const imgForPhase = (phase: number) => images[seededInt(seed, phase, 0, images.length - 1)]
  const mainImg = imgForPhase(0)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />
      {/* Subtle pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, ...stripesBg(theme.accentColor, 'transparent', 135, 40) }} />
      {/* Animated light leaks */}
      <div style={{
        position: 'absolute',
        top: interpolate(frame, [0, TOTAL_FRAMES], [-200, 400]),
        left: -100, width: 600, height: 400,
        background: `radial-gradient(ellipse, ${theme.accentColor}30 0%, transparent 70%)`,
        transform: `rotate(${interpolate(frame, [0, TOTAL_FRAMES], [0, 45])}deg)`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: interpolate(frame, [0, TOTAL_FRAMES], [-100, 300]),
        right: -150, width: 500, height: 350,
        background: `radial-gradient(ellipse, ${theme.primaryColor}25 0%, transparent 70%)`,
        transform: `rotate(${interpolate(frame, [0, TOTAL_FRAMES], [0, -30])}deg)`,
      }} />

      {/* SPACE APE watermark */}
      <div style={{
        position: 'absolute', top: 60, left: 50,
        fontFamily: headingFont, fontSize: 24, fontWeight: 700,
        color: '#ffffff30', letterSpacing: '0.08em',
      }}>
        SPACE APE
      </div>

      {/* Visual mode badge */}
      {badgeLabel && <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />}

      {/* ── Hook phase ── */}
      {frame < HOOK_END && (() => {
        const hookOpacity = interpolate(frame, [0, 10, HOOK_END - 5, HOOK_END], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
        return (
          <div style={{
            position: 'absolute', top: 500, left: 60, right: 60,
            opacity: hookOpacity,
          }}>
            {/* Flash effect */}
            {frame < 5 && (
              <div style={{
                position: 'absolute', inset: -2000,
                background: `radial-gradient(circle at 50% 50%, ${theme.accentColor}80 0%, transparent 50%)`,
                opacity: interpolate(frame, [0, 5], [0.8, 0], { extrapolateRight: 'clamp' }),
              }} />
            )}
            <div style={{
              fontFamily: headingFont, fontSize: 64, fontWeight: 700,
              color: '#fff', textTransform: 'uppercase', lineHeight: 1.0,
              textShadow: `0 0 40px ${theme.primaryColor}60`,
            }}>
              {hook}
            </div>
          </div>
        )
      })()}

      {/* ── Product reveal ── */}
      {frame >= HOOK_END && frame < REVEAL_END && (() => {
        const dropFrame = frame - HOOK_END
        const bounceY = spring({ frame: dropFrame, fps: FPS, config: { damping: 9, stiffness: 140 } })
        const startY = -400
        const endY = 280
        const productY = startY + (endY - startY) * bounceY

        return (
          <>
            <div style={{
              position: 'absolute', top: productY, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 550, maxHeight: 550,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
            {/* Caption pinned at bottom */}
            <div style={{
              position: 'absolute', bottom: 150, left: 50, right: 50,
              fontFamily: headingFont, fontSize: 44, fontWeight: 700,
              color: '#fff', textTransform: 'uppercase', textAlign: 'center',
              opacity: interpolate(dropFrame, [20, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              {flavor}
            </div>
          </>
        )
      })()}

      {/* ── Body phase ── */}
      {frame >= REVEAL_END && frame < BODY_END && (() => {
        const bodyFrame = frame - REVEAL_END
        const phrases = caption.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 3)
        if (phrases.length === 0) phrases.push(caption.slice(0, 80))
        const phraseDuration = (BODY_END - REVEAL_END) / phrases.length
        const currentPhraseIndex = Math.min(Math.floor(bodyFrame / phraseDuration), phrases.length - 1)
        const phraseFrame = bodyFrame - currentPhraseIndex * phraseDuration
        const fadeIn = interpolate(phraseFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
        const fadeOut = interpolate(phraseFrame, [phraseDuration - 8, phraseDuration], [1, 0], { extrapolateRight: 'clamp' })

        return (
          <>
            <div style={{
              position: 'absolute', top: 350, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 350, maxHeight: 350, opacity: 0.25,
                filter: themeShadow(theme.primaryColor, 'medium'),
              }} />
            </div>
            {/* Top caption area */}
            <div style={{
              position: 'absolute', top: 200, left: 50, right: 50,
              background: `${theme.primaryColor}80`, backdropFilter: 'blur(10px)',
              borderRadius: 16, padding: '24px 32px',
              opacity: Math.min(fadeIn, fadeOut),
            }}>
              <div style={{
                fontSize: 32, fontWeight: 600, color: '#fff',
                lineHeight: 1.3, textAlign: 'center',
              }}>
                {phrases[currentPhraseIndex]?.trim()}
              </div>
            </div>
            {/* Bottom caption area */}
            <div style={{
              position: 'absolute', bottom: 200, left: 50, right: 50,
              fontFamily: headingFont, fontSize: 36, fontWeight: 700,
              color: theme.accentColor, textTransform: 'uppercase',
              textAlign: 'center',
              opacity: interpolate(bodyFrame, [0, 15], [0, 0.7], { extrapolateRight: 'clamp' }),
            }}>
              {flavor}
            </div>
          </>
        )
      })()}

      {/* ── Flavor showcase ── */}
      {frame >= BODY_END && frame < SHOWCASE_END && (() => {
        const showFrame = frame - BODY_END
        const s = spring({ frame: showFrame, fps: FPS, config: { damping: 12, stiffness: 90 } })

        return (
          <>
            <div style={{
              position: 'absolute', top: 300, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
              transform: `scale(${0.8 + s * 0.2})`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 520, maxHeight: 520,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
            <div style={{
              position: 'absolute', top: 150, left: 0, right: 0,
              fontFamily: headingFont, fontSize: 80, fontWeight: 700,
              color: theme.primaryColor, textTransform: 'uppercase',
              textAlign: 'center', transform: `scale(${s})`,
            }}>
              {flavor}
            </div>
            {theme.strainType && (
              <div style={{
                position: 'absolute', bottom: 300, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                opacity: interpolate(showFrame, [20, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}>
                <div style={{
                  background: theme.primaryColor, color: '#fff',
                  fontFamily: headingFont, fontSize: 20, fontWeight: 700,
                  padding: '12px 30px', borderRadius: 28, textTransform: 'uppercase',
                }}>
                  {theme.strainType}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* ── CTA/Outro ── */}
      {frame >= SHOWCASE_END && (() => {
        const outroFrame = frame - SHOWCASE_END
        const fadeIn = interpolate(outroFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

        return (
          <div style={{
            position: 'absolute', inset: 0,
            background: theme.backgroundColor,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 40,
            opacity: fadeIn,
          }}>
            <div style={{
              fontFamily: headingFont, fontSize: 56, fontWeight: 700,
              color: theme.primaryColor, letterSpacing: '0.06em',
            }}>
              SPACE APE
            </div>
            <div style={{
              fontSize: 16, fontWeight: 600, color: '#ffffff50',
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              Ultra Premium • Live Resin
            </div>
            <div style={{
              background: theme.primaryColor, color: '#fff',
              fontFamily: headingFont, fontSize: 22, fontWeight: 700,
              padding: '16px 50px', borderRadius: 40, textTransform: 'uppercase',
              opacity: interpolate(outroFrame, [15, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              Follow @SpaceApe
            </div>
          </div>
        )
      })()}
    </AbsoluteFill>
  )
}

// ─── Template 3: SplitMotion ───
function SplitMotion({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const { hookEnd: HOOK_END, revealEnd: REVEAL_END, bodyEnd: BODY_END, showcaseEnd: SHOWCASE_END } = TIMINGS.splitMotion
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const imgForPhase = (phase: number) => images[seededInt(seed, phase, 0, images.length - 1)]
  const mainImg = imgForPhase(0)

  return (
    <AbsoluteFill style={{ background: '#FAF7F2', overflow: 'hidden', fontFamily: bodyFont }}>
      {/* SPACE APE watermark */}
      <div style={{
        position: 'absolute', top: 60, left: 50, zIndex: 10,
        fontFamily: headingFont, fontSize: 24, fontWeight: 700,
        color: '#00000030', letterSpacing: '0.08em',
      }}>
        SPACE APE
      </div>

      {/* Visual mode badge */}
      {badgeLabel && <BadgeOverlay label={badgeLabel} color={theme.primaryColor} bgColor="#fff" x={40} y={120} />}

      {/* ── Hook phase: bands slide in ── */}
      {frame < HOOK_END && (() => {
        const band1X = interpolate(frame, [0, 15], [-1080, 0], { extrapolateRight: 'clamp' })
        const band2X = interpolate(frame, [5, 20], [1080, 0], { extrapolateRight: 'clamp' })
        const band3X = interpolate(frame, [10, 25], [-1080, 0], { extrapolateRight: 'clamp' })
        const textOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' })

        return (
          <>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '33.33%',
              background: theme.primaryColor,
              transform: `translateX(${band1X}px)`,
            }} />
            <div style={{
              position: 'absolute', top: '33.33%', left: 0, right: 0, height: '33.34%',
              background: '#FAF7F2',
              transform: `translateX(${band2X}px)`,
            }} />
            <div style={{
              position: 'absolute', top: '66.67%', left: 0, right: 0, height: '33.33%',
              background: theme.accentColor,
              transform: `translateX(${band3X}px)`,
            }} />
            <div style={{
              position: 'absolute', top: '33.33%', left: 60, right: 60,
              height: '33.34%', display: 'flex', alignItems: 'center',
              opacity: textOpacity,
            }}>
              <div style={{
                fontFamily: headingFont, fontSize: 56, fontWeight: 700,
                color: theme.primaryColor, textTransform: 'uppercase', lineHeight: 1.0,
              }}>
                {hook}
              </div>
            </div>
          </>
        )
      })()}

      {/* ── Product reveal ── */}
      {frame >= HOOK_END && frame < REVEAL_END && (() => {
        const revealFrame = frame - HOOK_END
        const s = spring({ frame: revealFrame, fps: FPS, config: { damping: 10, stiffness: 180 } })

        return (
          <>
            {/* Top band */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 300,
              ...stripesBg(theme.primaryColor, theme.accentColor, -45, 26),
            }} />
            {/* Bottom band */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 500,
              background: theme.accentColor,
            }} />
            {/* Center product */}
            <div style={{
              position: 'absolute', top: 250, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 700, alignItems: 'center',
              transform: `scale(${s})`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 520, maxHeight: 520,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 200, left: 60, right: 60,
              fontFamily: headingFont, fontSize: 50, fontWeight: 700,
              color: '#fff', textTransform: 'uppercase', textAlign: 'center',
              opacity: interpolate(revealFrame, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              {flavor}
            </div>
          </>
        )
      })()}

      {/* ── Body phase ── */}
      {frame >= REVEAL_END && frame < BODY_END && (() => {
        const bodyFrame = frame - REVEAL_END
        const phrases = caption.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 3)
        if (phrases.length === 0) phrases.push(caption.slice(0, 80))
        const phraseDuration = (BODY_END - REVEAL_END) / phrases.length
        const currentPhraseIndex = Math.min(Math.floor(bodyFrame / phraseDuration), phrases.length - 1)
        const phraseFrame = bodyFrame - currentPhraseIndex * phraseDuration
        const enterDir = currentPhraseIndex % 2 === 0 ? -1 : 1
        const slideX = interpolate(phraseFrame, [0, 15], [200 * enterDir, 0], { extrapolateRight: 'clamp' })
        const opacity = interpolate(phraseFrame, [0, 12, phraseDuration - 8, phraseDuration], [0, 1, 1, 0], { extrapolateRight: 'clamp' })

        return (
          <>
            <div style={{ position: 'absolute', inset: 0, background: theme.primaryColor }} />
            {/* Product background */}
            <div style={{
              position: 'absolute', top: 350, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', opacity: 0.2,
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 400, maxHeight: 400, filter: themeShadow(theme.primaryColor, 'medium') }} />
            </div>
            {/* Text band sliding in */}
            <div style={{
              position: 'absolute', top: 700, left: 0, right: 0,
              background: '#00000040', backdropFilter: 'blur(10px)',
              padding: '40px 60px',
              transform: `translateX(${slideX}px)`, opacity,
            }}>
              <div style={{
                fontFamily: headingFont, fontSize: 38, fontWeight: 700,
                color: '#fff', textTransform: 'uppercase', lineHeight: 1.15,
              }}>
                {phrases[currentPhraseIndex]?.trim()}
              </div>
            </div>
          </>
        )
      })()}

      {/* ── Flavor showcase ── */}
      {frame >= BODY_END && frame < SHOWCASE_END && (() => {
        const showFrame = frame - BODY_END
        const topBandY = interpolate(showFrame, [0, 15], [-400, 0], { extrapolateRight: 'clamp' })
        const bottomBandY = interpolate(showFrame, [5, 20], [400, 0], { extrapolateRight: 'clamp' })

        return (
          <>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
              background: theme.primaryColor,
              transform: `translateY(${topBandY}px)`,
            }}>
              <div style={{
                position: 'absolute', bottom: 40, left: 60,
                fontFamily: headingFont, fontSize: 80, fontWeight: 700,
                color: '#fff', textTransform: 'uppercase', lineHeight: 0.95,
              }}>
                {flavor}
              </div>
            </div>
            <div style={{
              position: 'absolute', top: '40%', left: 0, right: 0, height: '60%',
              background: theme.accentColor,
              transform: `translateY(${bottomBandY}px)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 480, maxHeight: 480,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
          </>
        )
      })()}

      {/* ── CTA/Outro ── */}
      {frame >= SHOWCASE_END && (() => {
        const outroFrame = frame - SHOWCASE_END
        const s = spring({ frame: outroFrame, fps: FPS, config: { damping: 14, stiffness: 110 } })

        return (
          <div style={{
            position: 'absolute', inset: 0,
            background: '#FAF7F2',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 40,
          }}>
            <div style={{
              fontFamily: headingFont, fontSize: 56, fontWeight: 700,
              color: theme.primaryColor, letterSpacing: '0.06em',
              transform: `scale(${s})`,
            }}>
              SPACE APE
            </div>
            <div style={{
              fontSize: 16, fontWeight: 600, color: theme.backgroundColor,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              opacity: interpolate(outroFrame, [15, 30], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              Ultra Premium • Live Resin
            </div>
            <div style={{
              background: theme.primaryColor, color: '#fff',
              fontFamily: headingFont, fontSize: 22, fontWeight: 700,
              padding: '16px 50px', borderRadius: 40, textTransform: 'uppercase',
              opacity: interpolate(outroFrame, [20, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              Follow @SpaceApe
            </div>
          </div>
        )
      })()}
    </AbsoluteFill>
  )
}

// ─── Template 4: GlowPulse ───
function GlowPulse({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const { hookEnd: HOOK_END, revealEnd: REVEAL_END, bodyEnd: BODY_END, showcaseEnd: SHOWCASE_END } = TIMINGS.glowPulse
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const imgForPhase = (phase: number) => images[seededInt(seed, phase, 0, images.length - 1)]
  const mainImg = imgForPhase(0)
  // Pulsing gradient positions
  const g1x = interpolate(frame, [0, TOTAL_FRAMES], [20, 40])
  const g1y = interpolate(frame, [0, TOTAL_FRAMES], [30, 50])
  const g2x = interpolate(frame, [0, TOTAL_FRAMES], [80, 60])
  const g2y = interpolate(frame, [0, TOTAL_FRAMES], [70, 40])

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      {/* Animated gradient mesh */}
      <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at ${g1x}% ${g1y}%, ${theme.primaryColor}80 0%, transparent 50%),
          radial-gradient(ellipse at ${g2x}% ${g2y}%, ${theme.accentColor}60 0%, transparent 50%)
        `,
      }} />

      {/* SPACE APE watermark */}
      <div style={{
        position: 'absolute', top: 60, left: 50, zIndex: 10,
        fontFamily: headingFont, fontSize: 24, fontWeight: 700,
        color: '#ffffff40', letterSpacing: '0.08em',
      }}>
        SPACE APE
      </div>

      {/* Visual mode badge */}
      {badgeLabel && <BadgeOverlay label={badgeLabel} color={theme.accentColor} bgColor={theme.backgroundColor} x={40} y={120} />}

      {/* ── Hook phase: blur to sharp text ── */}
      {frame < HOOK_END && (() => {
        const blur = interpolate(frame, [0, 20], [12, 0], { extrapolateRight: 'clamp' })
        const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

        return (
          <div style={{
            position: 'absolute', top: 500, left: 60, right: 60,
            fontFamily: headingFont, fontSize: 64, fontWeight: 700,
            color: '#fff', textTransform: 'uppercase', lineHeight: 1.0,
            filter: `blur(${blur}px)`, opacity,
            textShadow: `0 0 40px ${theme.primaryColor}60`,
          }}>
            {hook}
          </div>
        )
      })()}

      {/* ── Product reveal with float ── */}
      {frame >= HOOK_END && frame < REVEAL_END && (() => {
        const revealFrame = frame - HOOK_END
        const s = spring({ frame: revealFrame, fps: FPS, config: { damping: 12, stiffness: 100 } })
        const bob = Math.sin(revealFrame * 0.05) * 15

        return (
          <>
            <div style={{
              position: 'absolute', top: 250 + bob, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 700, alignItems: 'center',
              transform: `scale(${s})`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 520, maxHeight: 520,
                filter: `drop-shadow(0 0 80px ${theme.primaryColor}60) drop-shadow(0 30px 60px rgba(0,0,0,0.4))`,
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 200, left: 60, right: 60,
              fontFamily: headingFont, fontSize: 52, fontWeight: 700,
              color: '#fff', textTransform: 'uppercase', textAlign: 'center',
              opacity: interpolate(revealFrame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              textShadow: `0 0 30px ${theme.accentColor}50`,
            }}>
              {flavor}
            </div>
          </>
        )
      })()}

      {/* ── Body phase ── */}
      {frame >= REVEAL_END && frame < BODY_END && (() => {
        const bodyFrame = frame - REVEAL_END
        const phrases = caption.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 3)
        if (phrases.length === 0) phrases.push(caption.slice(0, 80))
        const phraseDuration = (BODY_END - REVEAL_END) / phrases.length
        const currentPhraseIndex = Math.min(Math.floor(bodyFrame / phraseDuration), phrases.length - 1)
        const phraseFrame = bodyFrame - currentPhraseIndex * phraseDuration
        const blur = interpolate(phraseFrame, [0, 12], [8, 0], { extrapolateRight: 'clamp' })
        const opacity = interpolate(phraseFrame, [0, 12, phraseDuration - 8, phraseDuration], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
        const bob = Math.sin(bodyFrame * 0.06) * 10

        return (
          <>
            <div style={{
              position: 'absolute', top: 300 + bob, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', opacity: 0.3,
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 400, maxHeight: 400 }} />
            </div>
            <div style={{
              position: 'absolute', top: 700, left: 50, right: 50,
              background: `${theme.primaryColor}50`, backdropFilter: 'blur(16px)',
              borderRadius: 24, padding: '36px 44px',
              border: `1px solid ${theme.accentColor}30`,
              filter: `blur(${blur}px)`, opacity,
            }}>
              <div style={{
                fontFamily: headingFont, fontSize: 36, fontWeight: 700,
                color: '#fff', textTransform: 'uppercase', lineHeight: 1.15,
                textAlign: 'center',
              }}>
                {phrases[currentPhraseIndex]?.trim()}
              </div>
            </div>
          </>
        )
      })()}

      {/* ── Flavor showcase ── */}
      {frame >= BODY_END && frame < SHOWCASE_END && (() => {
        const showFrame = frame - BODY_END
        const s = spring({ frame: showFrame, fps: FPS, config: { damping: 12, stiffness: 90 } })
        const bob = Math.sin(showFrame * 0.07) * 12

        return (
          <>
            <div style={{
              position: 'absolute', top: 280 + bob, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
              transform: `scale(${s})`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 520, maxHeight: 520,
                filter: `drop-shadow(0 0 100px ${theme.accentColor}60)`,
              }} />
            </div>
            <div style={{
              position: 'absolute', top: 130, left: 0, right: 0,
              fontFamily: headingFont, fontSize: 86, fontWeight: 700,
              color: theme.accentColor, textTransform: 'uppercase',
              textAlign: 'center', textShadow: `0 0 50px ${theme.accentColor}40`,
              transform: `scale(${s})`,
            }}>
              {flavor}
            </div>
            {theme.strainType && (
              <div style={{
                position: 'absolute', bottom: 280, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                opacity: interpolate(showFrame, [20, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}>
                <div style={{
                  background: `${theme.accentColor}30`, backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.accentColor}50`,
                  color: '#fff', fontFamily: headingFont, fontSize: 20, fontWeight: 700,
                  padding: '12px 30px', borderRadius: 28, textTransform: 'uppercase',
                }}>
                  {theme.strainType}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* ── CTA/Outro ── */}
      {frame >= SHOWCASE_END && (() => {
        const outroFrame = frame - SHOWCASE_END
        const blur = interpolate(outroFrame, [0, 15], [8, 0], { extrapolateRight: 'clamp' })
        const opacity = interpolate(outroFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 40,
            filter: `blur(${blur}px)`, opacity,
          }}>
            <div style={{
              fontFamily: headingFont, fontSize: 56, fontWeight: 700,
              color: theme.accentColor, letterSpacing: '0.06em',
              textShadow: `0 0 40px ${theme.accentColor}40`,
            }}>
              SPACE APE
            </div>
            <div style={{
              fontSize: 16, fontWeight: 600, color: '#ffffff50',
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              Ultra Premium • Live Resin
            </div>
            <div style={{
              border: `2px solid ${theme.accentColor}`,
              color: theme.accentColor,
              fontFamily: headingFont, fontSize: 22, fontWeight: 700,
              padding: '16px 50px', borderRadius: 40, textTransform: 'uppercase',
              boxShadow: `0 0 25px ${theme.accentColor}30`,
            }}>
              Follow @SpaceApe
            </div>
          </div>
        )
      })()}

      <Star x={80} y={200} size={18} color={theme.accentColor} opacity={0.2} />
      <Star x={950} y={400} size={22} color="#fff" opacity={0.1} />
      <Ring x={-30} y={1400} size={200} color={`${theme.accentColor}15`} thickness={2} />
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
  frame: number
  subcategory: string
}

// ─── Main component ───
export default function Reel({ flavor, hook, caption, hashtags, pillar, subcategory, layoutTemplate }: ReelProps) {
  const frame = useCurrentFrame()
  const theme = getFlavorTheme(flavor)
  const images = theme.productImages

  const props: TemplateProps = { theme, flavor, hook, caption, images, frame, subcategory }

  switch (layoutTemplate) {
    case 1: return <KineticType {...props} />
    case 2: return <ProductDrop {...props} />
    case 3: return <SplitMotion {...props} />
    case 4: return <GlowPulse {...props} />
    default: return <KineticType {...props} />
  }
}
