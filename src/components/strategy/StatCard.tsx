interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  index: number
}

export default function StatCard({ label, value, subtitle, index }: StatCardProps) {
  return (
    <div
      className="glass-panel p-5 text-center card-enter"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </p>
      <p className="text-3xl font-bold gradient-text">{value}</p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
