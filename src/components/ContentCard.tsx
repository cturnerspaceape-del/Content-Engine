import { Player } from '@remotion/player'
import type { ContentItem } from '../types'
import { SingleImage, Carousel, Reel } from '../remotion/compositions'
import type { SingleImageProps, CarouselProps, ReelProps } from '../remotion/types'

const formatColors: Record<string, string> = {
  'Carousel': '#a855f7',
  'Reel': '#ec4899',
  'Single Image': '#3b82f6',
}

// Gradient pairs for mock visuals
const gradientSets = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
]

function pickGradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return gradientSets[Math.abs(h) % gradientSets.length]
}

function MockVisual({ format, pillar, accentColor }: { format: string; pillar: string; accentColor: string }) {
  const [g1, g2] = pickGradient(pillar + format)
  const bg = `linear-gradient(135deg, ${g1}, ${g2})`

  if (format === 'Reel') {
    return (
      <div className="rounded-lg overflow-hidden mb-3" style={{ background: bg, height: 140, position: 'relative' }}>
        {/* Phone-style vertical video */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.3)', backdropFilter: 'blur(4px)' }}
          >
            <span style={{ color: '#fff', fontSize: 16, marginLeft: 2 }}>▶</span>
          </div>
          <span className="text-[9px] font-bold mt-2" style={{ color: 'rgba(255,255,255,.8)' }}>REEL • 0:15</span>
        </div>
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center gap-1.5" style={{ background: 'rgba(0,0,0,.3)' }}>
          <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,.4)' }} />
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }}>
            <div className="h-1 rounded-full w-1/3" style={{ background: '#fff' }} />
          </div>
        </div>
      </div>
    )
  }

  if (format === 'Carousel') {
    return (
      <div className="flex gap-1.5 mb-3 overflow-hidden rounded-lg" style={{ height: 90 }}>
        {[0, 1, 2, 3].map((i) => {
          const [cg1, cg2] = pickGradient(pillar + format + i)
          return (
            <div
              key={i}
              className="flex-1 rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${cg1}, ${cg2})`,
                minWidth: 50,
                opacity: i === 0 ? 1 : 0.7 - i * 0.15,
              }}
            >
              <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,.7)' }}>
                {i + 1}
              </span>
            </div>
          )
        })}
        <div
          className="flex items-center justify-center rounded-md px-1"
          style={{ background: 'var(--panel-2)', minWidth: 30 }}
        >
          <span className="text-[9px]" style={{ color: 'var(--muted)' }}>+6</span>
        </div>
      </div>
    )
  }

  // Single Image
  return (
    <div className="rounded-lg overflow-hidden mb-3" style={{ background: bg, height: 120, position: 'relative' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,.25)', backdropFilter: 'blur(4px)' }}
        >
          <span className="text-[10px] font-bold" style={{ color: '#fff' }}>📸 1:1</span>
        </div>
      </div>
    </div>
  )
}

interface ContentCardProps {
  item: ContentItem
  day: string
  theme: string
  index: number
  onShuffle: () => void
  onGenerate: () => void
  onLogPost: () => void
}

export default function ContentCard({ item, day, theme, index, onShuffle, onGenerate, onLogPost }: ContentCardProps) {
  const accentColor = formatColors[item.contentType] || '#a855f7'
  const isGenerated = item.generated
  const isLogged = item.logged

  const titleParts = item.title.split(' — ')
  const format = titleParts[0] || item.contentType
  const pillarSubcat = titleParts[1] || ''
  const pillar = pillarSubcat.split(':')[0]?.trim() || 'General'
  const subcat = pillarSubcat.split(':')[1]?.trim() || ''

  // Split description into lines for display
  const descLines = item.description
    .split('\n')
    .map((l) => l.replace(/^• /, '').trim())
    .filter(Boolean)

  return (
    <div
      className="glass-panel flex flex-col card-enter"
      style={{
        width: 260,
        minWidth: 260,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        animationDelay: `${index * 0.04}s`,
        opacity: isLogged ? 0.5 : 1,
      }}
    >
      {/* Top color bar */}
      <div
        style={{
          height: 4,
          background: isLogged ? '#10b981' : accentColor,
          borderRadius: '16px 16px 0 0',
        }}
      />

      <div className="p-4 flex flex-col flex-1">
        {/* Logged overlay badge */}
        {isLogged && (
          <div
            className="text-center text-xs font-bold py-1.5 -mx-4 -mt-4 mb-3"
            style={{ background: 'rgba(16,185,129,.1)', color: '#10b981' }}
          >
            Posted ✓
          </div>
        )}

        {/* Title row */}
        <h3
          className="text-xs font-bold uppercase leading-tight mb-1"
          style={{ color: 'var(--text)', letterSpacing: '0.02em' }}
        >
          {pillar}{subcat ? `: ${subcat}` : ''}
        </h3>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${accentColor}15`, color: accentColor }}
          >
            {format}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(59,130,246,.1)', color: 'var(--accent)' }}
          >
            {day}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--panel-2)', color: 'var(--muted)' }}
          >
            {theme}
          </span>
        </div>

        {/* Divider */}
        <div className="mb-3" style={{ borderBottom: '1px solid var(--border)' }} />

        {/* Visual preview — Remotion compositions or mock fallback */}
        {isGenerated && item.generatedVisual ? (
          format === 'Single Image' ? (
            <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1' }}>
              <Player
                component={SingleImage}
                compositionWidth={1080}
                compositionHeight={1080}
                durationInFrames={1}
                fps={30}
                style={{ width: '100%', height: '100%' }}
                inputProps={{
                  flavor: (item.generatedVisual.flavor || 'Amped Apple') as SingleImageProps['flavor'],
                  hook: item.generatedVisual.hook,
                  caption: item.generatedVisual.caption,
                  hashtags: item.generatedVisual.hashtags,
                  pillar: item.generatedVisual.pillar,
                  subcategory: item.generatedVisual.subcategory,
                  layoutTemplate: item.generatedVisual.layoutTemplate || 1,
                }}
              />
            </div>
          ) : format === 'Carousel' ? (
            <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1' }}>
              <Player
                component={Carousel}
                compositionWidth={1080}
                compositionHeight={1080}
                durationInFrames={(item.generatedVisual.slideCount || 7) * 45}
                fps={30}
                style={{ width: '100%', height: '100%' }}
                controls
                loop
                autoPlay={false}
                inputProps={{
                  flavor: (item.generatedVisual.flavor || 'Amped Apple') as CarouselProps['flavor'],
                  hook: item.generatedVisual.hook,
                  caption: item.generatedVisual.caption,
                  hashtags: item.generatedVisual.hashtags,
                  pillar: item.generatedVisual.pillar,
                  subcategory: item.generatedVisual.subcategory,
                  layoutTemplate: item.generatedVisual.layoutTemplate || 1,
                  slideCount: item.generatedVisual.slideCount || 7,
                }}
              />
            </div>
          ) : format === 'Reel' ? (
            <div className="rounded-lg overflow-hidden mb-3" style={{ maxHeight: 200, position: 'relative' }}>
              <Player
                component={Reel}
                compositionWidth={1080}
                compositionHeight={1920}
                durationInFrames={450}
                fps={30}
                style={{ width: '100%' }}
                controls
                autoPlay={false}
                inputProps={{
                  flavor: (item.generatedVisual.flavor || 'Amped Apple') as ReelProps['flavor'],
                  hook: item.generatedVisual.hook,
                  caption: item.generatedVisual.caption,
                  hashtags: item.generatedVisual.hashtags,
                  pillar: item.generatedVisual.pillar,
                  subcategory: item.generatedVisual.subcategory,
                  layoutTemplate: item.generatedVisual.layoutTemplate || 1,
                }}
              />
              <div style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.5)', color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '2px 6px',
                borderRadius: 4, letterSpacing: '0.05em',
              }}>
                9:16
              </div>
            </div>
          ) : (
            <MockVisual format={format} pillar={pillar} accentColor={accentColor} />
          )
        ) : isGenerated ? (
          <MockVisual format={format} pillar={pillar} accentColor={accentColor} />
        ) : null}

        {/* Content area — checklist or generated copy */}
        <div className="flex-1 mb-3">
          {isGenerated ? (
            // Generated content: show as flowing copy
            descLines.map((line, i) => {
              // First line = hook (bold), hashtags line, or body
              const isHook = i === 0
              const isHashtags = line.startsWith('#')
              return (
                <p
                  key={i}
                  className={`${isHashtags ? 'text-[10px]' : 'text-[11px]'} leading-snug ${i < descLines.length - 1 ? 'mb-1.5' : ''}`}
                  style={{
                    color: isHashtags ? accentColor : 'var(--text)',
                    fontWeight: isHook ? 700 : 400,
                    fontStyle: isHook ? 'italic' : 'normal',
                  }}
                >
                  {isHook ? `"${line}"` : line}
                </p>
              )
            })
          ) : (
            // Checklist instructions
            descLines.map((line, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <span
                  className="mt-px flex-shrink-0 text-[9px] leading-none"
                  style={{ color: '#10b981' }}
                >
                  ✓
                </span>
                <span className="text-[11px] leading-snug" style={{ color: 'var(--text)' }}>
                  {line}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Action buttons */}
        {isLogged ? (
          <div
            className="text-center py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(16,185,129,.08)', color: '#10b981' }}
          >
            Logged ✓
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex gap-2">
              <button
                onClick={onShuffle}
                className="flex-1 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                Shuffle
              </button>
              <button
                onClick={onGenerate}
                className="flex-1 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
                style={
                  isGenerated
                    ? {
                        background: 'rgba(16,185,129,.1)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--muted)',
                      }
                }
              >
                {isGenerated ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            <button
              onClick={onLogPost}
              className="w-full py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
              style={{
                background: 'rgba(59,130,246,.1)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
              }}
            >
              Log Post
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
