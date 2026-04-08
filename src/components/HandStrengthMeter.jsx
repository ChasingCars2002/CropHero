import { getStrengthLabel } from '../lib/pokerUtils.js'

function getBarColor(pct) {
  if (pct >= 85) return 'bg-emerald-500'
  if (pct >= 65) return 'bg-green-500'
  if (pct >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function HandStrengthMeter({ handName, percentage }) {
  if (percentage == null) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>HAND STRENGTH</span>
          <span>—</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full" />
      </div>
    )
  }

  const label = handName || getStrengthLabel(percentage)
  const color = getBarColor(percentage)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Hand Strength</span>
        <span className="text-xs text-gray-300">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`text-sm font-semibold ${color.replace('bg-', 'text-')}`}>
        {label}
      </p>
    </div>
  )
}
