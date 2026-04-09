export type AccountFilter = 'both' | '@drinkpoppi' | '@starface'

interface AccountSelectorProps {
  selected: AccountFilter
  onChange: (value: AccountFilter) => void
}

const options: { value: AccountFilter; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: '@drinkpoppi', label: 'Poppi' },
  { value: '@starface', label: 'Starface' },
]

export default function AccountSelector({ selected, onChange }: AccountSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const isActive = selected === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={
              isActive
                ? {
                    background: 'var(--accent)',
                    color: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                  }
                : {
                    background: 'rgba(59,130,246,.1)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
