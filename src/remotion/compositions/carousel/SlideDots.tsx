export function SlideDots({ current, total, variant, color }: { current: number; total: number; variant: 'circle' | 'dash' | 'pill' | 'glow'; color: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: variant === 'dash' ? 6 : 10,
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === current
        if (variant === 'dash') {
          return <div key={i} style={{
            width: active ? 32 : 16, height: 6, borderRadius: 3,
            background: active ? '#fff' : '#ffffff40',
          }} />
        }
        if (variant === 'pill') {
          return <div key={i} style={{
            width: 10, height: active ? 28 : 14, borderRadius: 5,
            background: active ? color : '#ffffff30',
            border: active ? '2px solid #fff' : 'none',
          }} />
        }
        if (variant === 'glow') {
          return <div key={i} style={{
            width: active ? 16 : 10, height: active ? 16 : 10, borderRadius: '50%',
            background: active ? color : '#ffffff30',
            boxShadow: active ? `0 0 12px ${color}, 0 0 4px #fff` : 'none',
          }} />
        }
        // circle (default)
        return <div key={i} style={{
          width: active ? 28 : 14, height: 14, borderRadius: 7,
          background: active ? '#fff' : '#ffffff40',
          border: active ? `2px solid ${color}` : '2px solid #ffffff30',
        }} />
      })}
    </div>
  )
}
