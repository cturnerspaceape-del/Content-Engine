import type { MouseEvent } from 'react'

type Size = 'sm' | 'lg'

interface CarouselNavProps {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  // 'sm' matches the ContentCard feed grid (compact, top-right counter).
  // 'lg' matches the CarouselLoungeVisual main slide (no counter, dot
  // indicators along the bottom — that view has its own slide-N-of-N badge).
  size?: Size
}

const SIZES: Record<Size, {
  btn: number
  fontSize: number
  offset: number
  bg: string
  showCounter: boolean
  showDots: boolean
}> = {
  sm: { btn: 22, fontSize: 10, offset: 4, bg: 'rgba(0,0,0,0.4)', showCounter: true, showDots: false },
  lg: { btn: 32, fontSize: 16, offset: 8, bg: 'rgba(0,0,0,0.55)', showCounter: false, showDots: true },
}

export default function CarouselNav({ current, total, onPrev, onNext, size = 'sm' }: CarouselNavProps) {
  const cfg = SIZES[size]

  const handlePrev = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onPrev()
  }
  const handleNext = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onNext()
  }

  return (
    <>
      {cfg.showCounter && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.05em',
          }}
        >
          {current + 1} / {total}
        </div>
      )}
      {current > 0 && (
        <button
          onClick={handlePrev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: cfg.offset,
            top: '50%',
            transform: 'translateY(-50%)',
            width: cfg.btn,
            height: cfg.btn,
            borderRadius: '50%',
            background: cfg.bg,
            border: 'none',
            color: '#fff',
            fontSize: cfg.fontSize,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ‹
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={handleNext}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: cfg.offset,
            top: '50%',
            transform: 'translateY(-50%)',
            width: cfg.btn,
            height: cfg.btn,
            borderRadius: '50%',
            background: cfg.bg,
            border: 'none',
            color: '#fff',
            fontSize: cfg.fontSize,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ›
        </button>
      )}
      {cfg.showDots && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
          }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
