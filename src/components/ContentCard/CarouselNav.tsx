export function CarouselNav({ current, total, onPrev, onNext }: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <>
      <div style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(0,0,0,0.5)', color: '#fff',
        fontSize: 9, fontWeight: 700, padding: '2px 6px',
        borderRadius: 4, letterSpacing: '0.05em',
      }}>
        {current + 1} / {total}
      </div>
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          style={{
            position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', border: 'none',
            color: '#fff', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ‹
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          style={{
            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', border: 'none',
            color: '#fff', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ›
        </button>
      )}
    </>
  )
}
