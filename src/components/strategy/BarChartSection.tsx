interface BarData {
  label: string
  value: number
  maxValue: number
  color?: string
}

interface BarChartSectionProps {
  title: string
  data: BarData[]
}

export default function BarChartSection({ title, data }: BarChartSectionProps) {
  return (
    <div className="glass-panel p-6 card-enter">
      <h3
        className="text-sm font-bold uppercase tracking-wider mb-4"
        style={{ color: 'var(--accent)' }}
      >
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item) => {
          const widthPercent = item.maxValue > 0
            ? Math.max((item.value / item.maxValue) * 100, 2)
            : 0
          const barColor = item.color || 'var(--accent)'

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {item.label}
                </span>
                <span className="text-xs font-bold" style={{ color: barColor }}>
                  {item.value}%
                </span>
              </div>
              <div
                className="h-5 rounded-full w-full"
                style={{ background: 'var(--panel-2)' }}
              >
                <div
                  className="h-5 rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    background: barColor,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
