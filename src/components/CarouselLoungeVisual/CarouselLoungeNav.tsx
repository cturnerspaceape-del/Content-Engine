export function CarouselLoungeNav({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <>
      {current > 0 && (
        <button
          onClick={onPrev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: '32px',
            textAlign: 'center',
          }}
        >
          ‹
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={onNext}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: '32px',
            textAlign: 'center',
          }}
        >
          ›
        </button>
      )}
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
    </>
  )
}
