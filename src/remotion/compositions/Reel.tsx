import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion'
import { getFlavorTheme } from '../flavorThemes'
import type { ReelProps, FlavorTheme } from '../types'
import {
  ProductImg, GrainOverlay, VignetteOverlay,
  polkaDotBg, outlinedTextStyle, boldShadowStyle,
  seedFromText, seededInt, seededRange,
  headingFont, bodyFont, accentFont,
  getVisualMode, getBadgeLabel, BadgeOverlay,
  themeShadow, darkenColor, lightenColor, saturateColor,
} from '../components/shared'
import {
  gradientTextStyle, perspectiveTilt, clipCircleReveal, clipDiagonalWipe,
  GlassPanel, AnimatedGradient, ChromaShift, CharacterReveal,
  ShimmerSweep, ScanLines, LightLeak, HalftoneOverlay,
  DuotoneFilter, duotoneStyle,
} from '../components/effects'
import {
  SLAM, PREMIUM, POP, BREATHE,
  TOTAL_FRAMES, FPS,
  type PhaseConfig, getPhase,
  MaskReveal, SlowDrift, scaleSnap, BrandClose,
} from '../components/motion'

// ─── Phase timing configs (4 phases: hook → reveal → story → close) ───

const TIMINGS: Record<string, PhaseConfig> = {
  kineticType:  { hookEnd: 55, revealEnd: 145, storyEnd: 275 },
  productDrop:  { hookEnd: 50, revealEnd: 150, storyEnd: 270 },
  splitMotion:  { hookEnd: 55, revealEnd: 140, storyEnd: 275 },
  glowPulse:    { hookEnd: 50, revealEnd: 145, storyEnd: 270 },
  glitchReveal: { hookEnd: 55, revealEnd: 155, storyEnd: 280 },
  neonDrift:    { hookEnd: 50, revealEnd: 140, storyEnd: 275 },
}

// ─── Shared helpers ───

/** Pick first strong sentence from caption for the story phase */
function storyLine(caption: string, hook: string): string {
  const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 15)
  return sentences[0]?.trim() || hook
}

// ═══════════════════════════════════════════════════════════
// Template 1: KineticType — Words slam in, product with anticipation
// ═══════════════════════════════════════════════════════════

function KineticType({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const phase = getPhase(frame, TIMINGS.kineticType)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, 0, 0, images.length - 1)]
  const words = hook.split(' ')
  const story = storyLine(caption, hook)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <SlowDrift frame={frame}>
        {/* Rotating gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(${interpolate(frame, [0, TOTAL_FRAMES], [135, 225], { easing: BREATHE })}deg, ${theme.primaryColor}, ${theme.backgroundColor})`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          ...polkaDotBg(theme.accentColor, 'transparent', 5, 26),
        }} />
        <GrainOverlay opacity={0.03} frame={frame} />

        {/* ── HOOK: Words slam in instantly ── */}
        {phase.name === 'hook' && (
          <div style={{
            position: 'absolute', top: 580, left: 55, right: 55,
            display: 'flex', flexWrap: 'wrap', gap: '6px 12px',
            opacity: phase.opacity,
          }}>
            {words.map((word, i) => {
              const delay = i * 2
              const progress = interpolate(Math.max(0, frame - delay), [0, 8], [0, 1], {
                extrapolateRight: 'clamp', easing: SLAM,
              })
              return (
                <span key={i} style={{
                  fontFamily: headingFont, fontSize: 74, fontWeight: 700,
                  textTransform: 'uppercase', lineHeight: 1.0, display: 'inline-block',
                  ...outlinedTextStyle('#fff', `${theme.backgroundColor}80`, 3),
                  opacity: 0.7 + progress * 0.3,
                  transform: `translateY(${(1 - progress) * 35}px) scale(${0.92 + progress * 0.08})`,
                }}>
                  {word}
                </span>
              )
            })}
          </div>
        )}

        {/* ── REVEAL: Product with anticipation + MaskReveal flavor ── */}
        {(phase.name === 'reveal' || (phase.name === 'hook' && frame >= TIMINGS.kineticType.hookEnd - 10)) && phase.name !== 'hook' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            {/* Product with scaleSnap (anticipation → overshoot → settle) */}
            <div style={{
              position: 'absolute', top: 250, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 700, alignItems: 'center',
              transform: `scale(${scaleSnap(phase.localFrame, 0)})`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 500, maxHeight: 500,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
            {/* Flavor name — MaskReveal from below */}
            <div style={{ position: 'absolute', bottom: 260, left: 50, right: 50, textAlign: 'center' }}>
              <MaskReveal frame={phase.localFrame} delay={15} duration={14}>
                <div style={{
                  fontFamily: headingFont, fontSize: 56, fontWeight: 700,
                  textTransform: 'uppercase', color: '#fff',
                  textShadow: `0 4px 20px ${theme.primaryColor}80`,
                }}>
                  {flavor}
                </div>
              </MaskReveal>
            </div>
            {theme.strainType && (
              <div style={{
                position: 'absolute', bottom: 220, left: 0, right: 0, textAlign: 'center',
                opacity: interpolate(phase.localFrame, [25, 38], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SLAM }),
                fontFamily: accentFont, fontSize: 14, fontWeight: 600,
                color: '#ffffff60', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {theme.strainType} • Live Resin
              </div>
            )}
          </div>
        )}

        {/* ── STORY: One strong caption + product background ── */}
        {phase.name === 'story' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            {/* Product in background, slow perspective drift */}
            <div style={{
              position: 'absolute', top: 280, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', opacity: 0.18,
              ...perspectiveTilt(Math.sin(frame * 0.008) * 2, Math.cos(frame * 0.006) * 3),
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 550, maxHeight: 550 }} />
            </div>
            {/* Caption — single strong line, MaskReveal */}
            <div style={{ position: 'absolute', top: 620, left: 45, right: 45 }}>
              <MaskReveal frame={phase.localFrame} delay={5} duration={16}>
                <div style={{
                  fontFamily: headingFont, fontSize: 42, fontWeight: 700,
                  color: '#fff', textTransform: 'uppercase', lineHeight: 1.2,
                  textAlign: 'center',
                  textShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}>
                  {story}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── CLOSE: Animated brand + CTA ── */}
        {phase.name === 'close' && (
          <BrandClose frame={phase.localFrame} accentColor={theme.accentColor} style={{ opacity: phase.opacity }} />
        )}

        {/* Delayed brand watermark (after frame 30) */}
        {frame >= 30 && (
          <div style={{
            position: 'absolute', top: 55, left: 50,
            fontFamily: headingFont, fontSize: 20, fontWeight: 700,
            letterSpacing: '0.08em', color: '#ffffff35',
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp', easing: SLAM }),
          }}>
            SPACE APE
          </div>
        )}

        {badgeLabel && frame < TIMINGS.kineticType.revealEnd && (
          <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />
        )}
      </SlowDrift>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 2: ProductDrop — Bounce drop with motion blur
// ═══════════════════════════════════════════════════════════

function ProductDrop({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const phase = getPhase(frame, TIMINGS.productDrop)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, 0, 0, images.length - 1)]
  const story = storyLine(caption, hook)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <SlowDrift frame={frame}>
        {/* Dark base with subtle gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(170deg, ${theme.backgroundColor} 0%, #0a0a0a 60%, ${darkenColor(theme.primaryColor, 25)} 100%)`,
        }} />
        <GrainOverlay opacity={0.03} frame={frame} />

        {/* ── HOOK: Text slams in from bottom ── */}
        {phase.name === 'hook' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{ position: 'absolute', top: 550, left: 55, right: 55 }}>
              <MaskReveal frame={frame} delay={0} duration={10} direction="up">
                <div style={{
                  fontFamily: headingFont, fontSize: 68, fontWeight: 700,
                  textTransform: 'uppercase', lineHeight: 1.0, color: '#fff',
                  textShadow: `0 0 40px ${theme.primaryColor}60`,
                }}>
                  {hook}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── REVEAL: Product drops in with bounce + motion blur ── */}
        {phase.name === 'reveal' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            {(() => {
              const dropProgress = interpolate(phase.localFrame, [0, 25], [0, 1], {
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.34, 1.56, 0.64, 1), // bounce
              })
              const productY = interpolate(dropProgress, [0, 1], [-500, 300])
              const speed = phase.localFrame < 15 ? Math.abs(-500 - productY) * 0.02 : 0
              return (
                <>
                  <div style={{
                    position: 'absolute', top: productY, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center',
                    filter: speed > 2 ? `blur(${Math.min(speed, 6)}px)` : 'none',
                  }}>
                    <ProductImg src={mainImg} style={{
                      maxWidth: 520, maxHeight: 520,
                      filter: themeShadow(theme.primaryColor, 'dramatic'),
                    }} />
                  </div>
                  {/* Flavor — MaskReveal after product lands */}
                  <div style={{ position: 'absolute', bottom: 280, left: 50, right: 50, textAlign: 'center' }}>
                    <MaskReveal frame={phase.localFrame} delay={30} duration={14}>
                      <div style={{
                        fontFamily: headingFont, fontSize: 52, fontWeight: 700,
                        textTransform: 'uppercase', color: '#fff',
                        textShadow: `0 0 30px ${theme.primaryColor}50`,
                      }}>
                        {flavor}
                      </div>
                    </MaskReveal>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* ── STORY: Caption beside floating product ── */}
        {phase.name === 'story' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{
              position: 'absolute', top: 320, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
              transform: `translateY(${Math.sin(frame * 0.04) * 12}px)`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 420, maxHeight: 420, opacity: 0.25,
                filter: themeShadow(theme.primaryColor, 'soft'),
              }} />
            </div>
            <div style={{ position: 'absolute', top: 650, left: 50, right: 50 }}>
              <MaskReveal frame={phase.localFrame} delay={8} duration={16}>
                <div style={{
                  fontFamily: headingFont, fontSize: 40, fontWeight: 700,
                  color: '#fff', textTransform: 'uppercase', lineHeight: 1.2,
                  textAlign: 'center',
                  textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}>
                  {story}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── CLOSE ── */}
        {phase.name === 'close' && (
          <BrandClose frame={phase.localFrame} accentColor={theme.accentColor} style={{ opacity: phase.opacity }} />
        )}

        {frame >= 30 && (
          <div style={{
            position: 'absolute', top: 55, left: 50,
            fontFamily: headingFont, fontSize: 20, fontWeight: 700,
            letterSpacing: '0.08em', color: '#ffffff30',
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            SPACE APE
          </div>
        )}
        {badgeLabel && frame < TIMINGS.productDrop.revealEnd && (
          <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />
        )}
      </SlowDrift>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 3: SplitMotion — Horizontal bands with product reveal
// ═══════════════════════════════════════════════════════════

function SplitMotion({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const phase = getPhase(frame, TIMINGS.splitMotion)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, 0, 0, images.length - 1)]
  const story = storyLine(caption, hook)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <SlowDrift frame={frame} intensity={0.6}>
        <div style={{ position: 'absolute', inset: 0, background: theme.backgroundColor }} />
        <GrainOverlay opacity={0.025} frame={frame} />

        {/* ── HOOK: Bands slam in from left/right, text MaskReveals ── */}
        {phase.name === 'hook' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            {/* Top band — from left */}
            <div style={{
              position: 'absolute', top: 500, left: 0, right: 0, height: 260,
              background: theme.primaryColor,
              transform: `translateX(${interpolate(frame, [0, 10], [-1080, 0], { extrapolateRight: 'clamp', easing: SLAM })}px)`,
            }}>
              <div style={{ position: 'absolute', top: 50, left: 60, right: 60 }}>
                <MaskReveal frame={frame} delay={8} duration={12}>
                  <div style={{
                    fontFamily: headingFont, fontSize: 58, fontWeight: 700,
                    textTransform: 'uppercase', lineHeight: 1.0, color: '#fff',
                  }}>
                    {hook}
                  </div>
                </MaskReveal>
              </div>
            </div>
            {/* Bottom accent band — from right */}
            <div style={{
              position: 'absolute', top: 760, left: 0, right: 0, height: 80,
              background: theme.accentColor,
              transform: `translateX(${interpolate(frame, [4, 14], [1080, 0], { extrapolateRight: 'clamp', easing: SLAM })}px)`,
            }} />
          </div>
        )}

        {/* ── REVEAL: Bands split, product circle-reveals from center ── */}
        {phase.name === 'reveal' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            {/* Bands slide away */}
            {(() => {
              const splitProgress = interpolate(phase.localFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp', easing: PREMIUM })
              return (
                <>
                  <div style={{
                    position: 'absolute', top: 500 - splitProgress * 600, left: 0, right: 0, height: 260,
                    background: theme.primaryColor, opacity: 1 - splitProgress * 0.7,
                  }} />
                  <div style={{
                    position: 'absolute', top: 760 + splitProgress * 600, left: 0, right: 0, height: 80,
                    background: theme.accentColor, opacity: 1 - splitProgress * 0.7,
                  }} />
                </>
              )
            })()}
            {/* Product — circle reveal */}
            <div style={{
              position: 'absolute', top: 250, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 700, alignItems: 'center',
              ...clipCircleReveal(interpolate(phase.localFrame, [8, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: PREMIUM })),
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 500, maxHeight: 500,
                filter: themeShadow(theme.primaryColor, 'dramatic'),
              }} />
            </div>
            <div style={{ position: 'absolute', bottom: 260, left: 50, right: 50, textAlign: 'center' }}>
              <MaskReveal frame={phase.localFrame} delay={25} duration={14}>
                <div style={{
                  fontFamily: headingFont, fontSize: 52, fontWeight: 700,
                  textTransform: 'uppercase', color: '#fff',
                }}>
                  {flavor}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── STORY: Product with reflection, caption MaskReveal ── */}
        {phase.name === 'story' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{
              position: 'absolute', top: 300, left: 0, right: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 380, maxHeight: 380,
                filter: themeShadow(theme.primaryColor, 'medium'),
              }} />
              {/* Reflection */}
              <div style={{
                transform: 'scaleY(-1)', opacity: 0.12, marginTop: -20,
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 60%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 60%)',
              } as React.CSSProperties}>
                <ProductImg src={mainImg} style={{ maxWidth: 380, maxHeight: 200 }} />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 340, left: 50, right: 50 }}>
              <MaskReveal frame={phase.localFrame} delay={10} duration={16}>
                <div style={{
                  fontFamily: headingFont, fontSize: 40, fontWeight: 700,
                  color: '#fff', textTransform: 'uppercase', lineHeight: 1.2,
                  textAlign: 'center',
                }}>
                  {story}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── CLOSE ── */}
        {phase.name === 'close' && (
          <BrandClose frame={phase.localFrame} accentColor={theme.accentColor} style={{ opacity: phase.opacity }} />
        )}

        {frame >= 30 && (
          <div style={{
            position: 'absolute', top: 55, left: 50,
            fontFamily: headingFont, fontSize: 20, fontWeight: 700,
            letterSpacing: '0.08em', color: '#ffffff30',
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            SPACE APE
          </div>
        )}
        {badgeLabel && frame < TIMINGS.splitMotion.revealEnd && (
          <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />
        )}
      </SlowDrift>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 4: GlowPulse — Pulsing glow, premium product showcase
// ═══════════════════════════════════════════════════════════

function GlowPulse({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const phase = getPhase(frame, TIMINGS.glowPulse)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, 0, 0, images.length - 1)]
  const story = storyLine(caption, hook)

  // Persistent pulsing glow behind product (visible in all phases)
  const glowPulse = 0.4 + Math.sin(frame * 0.06) * 0.2
  const glowSize = 500 + Math.sin(frame * 0.04) * 80

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <SlowDrift frame={frame}>
        {/* Dark base with animated mesh */}
        <AnimatedGradient
          frame={frame}
          colors={[darkenColor(theme.primaryColor, 30), theme.backgroundColor, darkenColor(theme.accentColor, 30)]}
          speed={0.2}
          type="mesh"
        />
        <GrainOverlay opacity={0.03} frame={frame} />

        {/* Persistent glow ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: glowSize, height: glowSize,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.accentColor}${Math.round(glowPulse * 60).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          transform: 'translate(-50%, -55%)',
          filter: 'blur(40px)',
        }} />

        {/* ── HOOK: Text sharp at frame 0, glow ring pulses ── */}
        {phase.name === 'hook' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{ position: 'absolute', top: 580, left: 55, right: 55 }}>
              <MaskReveal frame={frame} delay={0} duration={8}>
                <div style={{
                  fontFamily: headingFont, fontSize: 68, fontWeight: 700,
                  textTransform: 'uppercase', lineHeight: 1.0, color: '#fff',
                  textShadow: `0 0 60px ${theme.accentColor}40, 0 0 120px ${theme.accentColor}15`,
                }}>
                  {hook}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── REVEAL: Product fades in with growing glow ── */}
        {phase.name === 'reveal' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{
              position: 'absolute', top: 280, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 700, alignItems: 'center',
              transform: `scale(${scaleSnap(phase.localFrame, 0)})`,
            }}>
              <ProductImg src={mainImg} style={{
                maxWidth: 480, maxHeight: 480,
                filter: `${themeShadow(theme.primaryColor, 'dramatic')} drop-shadow(0 0 80px ${theme.accentColor}40)`,
              }} />
            </div>
            <div style={{ position: 'absolute', bottom: 260, left: 50, right: 50, textAlign: 'center' }}>
              <MaskReveal frame={phase.localFrame} delay={20} duration={14}>
                <div style={{
                  fontFamily: headingFont, fontSize: 54, fontWeight: 700,
                  textTransform: 'uppercase', color: theme.accentColor,
                  textShadow: `0 0 30px ${theme.accentColor}50`,
                }}>
                  {flavor}
                </div>
              </MaskReveal>
            </div>
            {theme.strainType && (
              <div style={{
                position: 'absolute', bottom: 220, left: 0, right: 0, textAlign: 'center',
                opacity: interpolate(phase.localFrame, [30, 42], [0, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SLAM }),
                fontFamily: accentFont, fontSize: 14, fontWeight: 600,
                color: `${theme.accentColor}AA`, textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {theme.strainType} • Live Resin
              </div>
            )}
          </div>
        )}

        {/* ── STORY: Caption in GlassPanel, glow breathes ── */}
        {phase.name === 'story' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{
              position: 'absolute', top: 340, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', opacity: 0.2,
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 500, maxHeight: 500 }} />
            </div>
            <div style={{ position: 'absolute', top: 620, left: 40, right: 40 }}>
              <MaskReveal frame={phase.localFrame} delay={8} duration={16}>
                <GlassPanel blur={24} opacity={0.1} borderColor={`${theme.accentColor}30`} borderRadius={24} style={{ padding: '40px 35px' }}>
                  <div style={{
                    fontFamily: headingFont, fontSize: 38, fontWeight: 700,
                    color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, textAlign: 'center',
                  }}>
                    {story}
                  </div>
                </GlassPanel>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── CLOSE: Glow intensifies, brand with neon surge ── */}
        {phase.name === 'close' && (() => {
          const glowSurge = interpolate(phase.localFrame, [0, 30, 60], [1, 2.5, 1.5], { extrapolateRight: 'clamp', easing: BREATHE })
          return (
            <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: glowSize * glowSurge, height: glowSize * glowSurge,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.accentColor}50 0%, transparent 70%)`,
                transform: 'translate(-50%, -50%)',
                filter: 'blur(60px)',
              }} />
              <BrandClose frame={phase.localFrame} accentColor={theme.accentColor} />
            </div>
          )
        })()}

        {frame >= 30 && (
          <div style={{
            position: 'absolute', top: 55, left: 50,
            fontFamily: headingFont, fontSize: 20, fontWeight: 700,
            letterSpacing: '0.08em', color: '#ffffff25',
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            SPACE APE
          </div>
        )}
        {badgeLabel && frame < TIMINGS.glowPulse.revealEnd && (
          <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />
        )}

        <VignetteOverlay intensity={0.35} />
      </SlowDrift>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 5: GlitchReveal — Chromatic aberration + duotone crossfade
// ═══════════════════════════════════════════════════════════

function GlitchReveal({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const phase = getPhase(frame, TIMINGS.glitchReveal)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, 0, 0, images.length - 1)]
  const story = storyLine(caption, hook)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <SlowDrift frame={frame} intensity={0.7}>
        <AnimatedGradient
          frame={frame}
          colors={[theme.primaryColor, theme.backgroundColor, theme.accentColor]}
          speed={0.25}
          type="mesh"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
        <ScanLines
          spacing={3}
          opacity={phase.name === 'hook' ? 0.04 + Math.abs(Math.sin(frame * 0.3)) * 0.06 : 0.04}
        />
        <GrainOverlay opacity={0.03} frame={frame} />

        {/* ── HOOK: Fast character reveal with settling ChromaShift ── */}
        {phase.name === 'hook' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{ position: 'absolute', top: 580, left: 55, right: 55 }}>
              <ChromaShift
                offset={interpolate(frame, [0, 20], [8, 0], { extrapolateRight: 'clamp', easing: SLAM })}
              >
                <CharacterReveal
                  text={hook.toUpperCase()}
                  frame={frame}
                  fps={FPS}
                  stagger={1}
                  style={{
                    fontFamily: headingFont, fontSize: 66, fontWeight: 700,
                    lineHeight: '1.05', color: '#fff',
                  }}
                />
              </ChromaShift>
            </div>
          </div>
        )}

        {/* ── REVEAL: Circle reveal + duotone-to-normal crossfade ── */}
        {phase.name === 'reveal' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <DuotoneFilter id="duo-gr" darkColor={theme.backgroundColor} lightColor={theme.accentColor} />
            {(() => {
              const revealCircle = interpolate(phase.localFrame, [0, 30], [0, 1], { extrapolateRight: 'clamp', easing: PREMIUM })
              const duoFade = interpolate(phase.localFrame, [20, 60], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
              return (
                <div style={{
                  position: 'absolute', top: 250, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center', height: 750, alignItems: 'center',
                  ...clipCircleReveal(revealCircle),
                }}>
                  <div style={{ position: 'relative', transform: `scale(${scaleSnap(phase.localFrame, 5)})` }}>
                    {duoFade > 0.01 && (
                      <div style={{ position: 'absolute', inset: 0, opacity: duoFade, zIndex: 1 }}>
                        <ProductImg src={mainImg} style={{ maxWidth: 500, maxHeight: 500, ...duotoneStyle('duo-gr') }} />
                      </div>
                    )}
                    <ProductImg src={mainImg} style={{
                      maxWidth: 500, maxHeight: 500,
                      filter: themeShadow(theme.primaryColor, 'dramatic'),
                    }} />
                  </div>
                </div>
              )
            })()}
            <div style={{ position: 'absolute', bottom: 250, left: 50, right: 50, textAlign: 'center' }}>
              <MaskReveal frame={phase.localFrame} delay={35} duration={14}>
                <div style={{
                  fontFamily: headingFont, fontSize: 52, fontWeight: 700,
                  textTransform: 'uppercase',
                  ...gradientTextStyle([theme.accentColor, '#fff']),
                }}>
                  {flavor}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── STORY: Caption in GlassPanel, shimmer sweep ── */}
        {phase.name === 'story' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{
              position: 'absolute', top: 300, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', opacity: 0.18,
              ...perspectiveTilt(Math.sin(frame * 0.008) * 2, Math.cos(frame * 0.006) * 3),
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 550, maxHeight: 550 }} />
            </div>
            <ShimmerSweep frame={phase.localFrame} color="rgba(255,255,255,0.07)" width={250} speed={1.2} />
            <div style={{ position: 'absolute', top: 630, left: 40, right: 40 }}>
              <MaskReveal frame={phase.localFrame} delay={8} duration={16}>
                <GlassPanel blur={24} opacity={0.1} borderColor={`${theme.accentColor}30`} borderRadius={24} style={{ padding: '38px 34px' }}>
                  <div style={{
                    fontFamily: headingFont, fontSize: 38, fontWeight: 700,
                    color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, textAlign: 'center',
                  }}>
                    {story}
                  </div>
                </GlassPanel>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── CLOSE: ChromaShift callback + glow ── */}
        {phase.name === 'close' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <LightLeak frame={phase.localFrame} color={theme.accentColor} position="center" intensity={0.2} />
            <BrandClose frame={phase.localFrame} accentColor={theme.accentColor} />
          </div>
        )}

        {frame >= 30 && (
          <div style={{
            position: 'absolute', top: 55, left: 50,
            fontFamily: headingFont, fontSize: 20, fontWeight: 700,
            letterSpacing: '0.08em',
            ...gradientTextStyle(['#ffffff40', theme.accentColor]),
            opacity: interpolate(frame, [30, 48], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            SPACE APE
          </div>
        )}
        {badgeLabel && frame < TIMINGS.glitchReveal.revealEnd && (
          <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />
        )}
      </SlowDrift>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════
// Template 6: NeonDrift — Gradient text + diagonal wipes
// ═══════════════════════════════════════════════════════════

function NeonDrift({ theme, flavor, hook, caption, images, frame, subcategory }: TemplateProps) {
  const seed = seedFromText(hook)
  const phase = getPhase(frame, TIMINGS.neonDrift)
  const mode = getVisualMode(subcategory)
  const badgeLabel = getBadgeLabel(mode)
  const mainImg = images[seededInt(seed, 0, 0, images.length - 1)]
  const story = storyLine(caption, hook)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', fontFamily: bodyFont }}>
      <SlowDrift frame={frame}>
        <AnimatedGradient
          frame={frame}
          colors={[theme.primaryColor, theme.backgroundColor, theme.accentColor, theme.primaryColor]}
          speed={0.35}
          type="linear"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
        <GrainOverlay opacity={0.025} frame={frame} />

        {/* ── HOOK: Gradient text visible instantly, hue drifts slowly ── */}
        {phase.name === 'hook' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{ position: 'absolute', top: 560, left: 55, right: 55 }}>
              <MaskReveal frame={frame} delay={0} duration={10}>
                <div style={{
                  fontFamily: headingFont, fontSize: 72, fontWeight: 700,
                  textTransform: 'uppercase', lineHeight: 1.0,
                  ...gradientTextStyle([theme.accentColor, '#ffffff', theme.primaryColor], 90 + frame * 1),
                }}>
                  {hook}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── REVEAL: Diagonal wipe + glass framed product ── */}
        {phase.name === 'reveal' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <div style={{
              position: 'absolute', top: 250, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', height: 750, alignItems: 'center',
              ...clipDiagonalWipe(interpolate(phase.localFrame, [0, 25], [0, 1], { extrapolateRight: 'clamp', easing: PREMIUM })),
            }}>
              <GlassPanel blur={16} opacity={0.08} borderColor={`${theme.accentColor}40`} borderRadius={32} style={{
                padding: 28,
                transform: `scale(${scaleSnap(phase.localFrame, 8)})`,
              }}>
                <ProductImg src={mainImg} style={{
                  maxWidth: 440, maxHeight: 440,
                  filter: themeShadow(theme.primaryColor, 'dramatic'),
                }} />
              </GlassPanel>
            </div>
            <ShimmerSweep frame={phase.localFrame} color="rgba(255,255,255,0.08)" width={260} speed={2} />
            <div style={{ position: 'absolute', bottom: 250, left: 50, right: 50, textAlign: 'center' }}>
              <MaskReveal frame={phase.localFrame} delay={28} duration={14}>
                <div style={{
                  fontFamily: headingFont, fontSize: 52, fontWeight: 700,
                  textTransform: 'uppercase',
                  ...gradientTextStyle([theme.accentColor, '#fff']),
                }}>
                  {flavor}
                </div>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── STORY: Caption in MaskReveal, gradient continues ── */}
        {phase.name === 'story' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <ScanLines spacing={4} opacity={0.04} />
            <div style={{
              position: 'absolute', top: 320, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', opacity: 0.15,
            }}>
              <ProductImg src={mainImg} style={{ maxWidth: 500, maxHeight: 500 }} />
            </div>
            <div style={{ position: 'absolute', top: 640, left: 40, right: 40 }}>
              <MaskReveal frame={phase.localFrame} delay={8} duration={16}>
                <GlassPanel blur={22} opacity={0.1} borderColor={`${theme.accentColor}28`} borderRadius={24} style={{ padding: '38px 34px' }}>
                  <div style={{
                    fontFamily: headingFont, fontSize: 38, fontWeight: 700,
                    color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, textAlign: 'center',
                  }}>
                    {story}
                  </div>
                </GlassPanel>
              </MaskReveal>
            </div>
          </div>
        )}

        {/* ── CLOSE: Neon glow + shimmer finale ── */}
        {phase.name === 'close' && (
          <div style={{ position: 'absolute', inset: 0, opacity: phase.opacity }}>
            <ShimmerSweep frame={phase.localFrame} color="rgba(255,255,255,0.08)" width={300} speed={1.8} />
            <LightLeak frame={phase.localFrame} color={theme.accentColor} position="top-right" intensity={0.18} />
            <BrandClose frame={phase.localFrame} accentColor={theme.accentColor} />
          </div>
        )}

        <VignetteOverlay intensity={interpolate(frame, [0, TOTAL_FRAMES], [0.2, 0.4], { easing: BREATHE })} />

        {frame >= 30 && (
          <div style={{
            position: 'absolute', top: 55, left: 50,
            fontFamily: headingFont, fontSize: 20, fontWeight: 700,
            letterSpacing: '0.08em', color: '#ffffff30',
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            SPACE APE
          </div>
        )}
        {badgeLabel && frame < TIMINGS.neonDrift.revealEnd && (
          <BadgeOverlay label={badgeLabel} color="#fff" bgColor={theme.primaryColor} x={40} y={120} />
        )}
      </SlowDrift>
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
    case 5: return <GlitchReveal {...props} />
    case 6: return <NeonDrift {...props} />
    default: return <KineticType {...props} />
  }
}
