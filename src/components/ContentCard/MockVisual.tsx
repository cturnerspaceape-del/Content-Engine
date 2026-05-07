import { pickGradient } from './constants'

export function MockVisual({ format, pillar, accentColor }: { format: string; pillar: string; accentColor: string }) {
  const [g1, g2] = pickGradient(pillar + format)
  const bg = `linear-gradient(135deg, ${g1}, ${g2})`

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
