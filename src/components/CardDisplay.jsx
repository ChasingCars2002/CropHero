import { parseCard } from '../lib/pokerUtils.js'

function Card({ card, size = 'md' }) {
  const parsed = parseCard(card)
  const sizeClasses = size === 'sm'
    ? 'w-8 h-11 text-sm'
    : 'w-10 h-14 text-base'

  if (!parsed) {
    return (
      <div className={`${sizeClasses} rounded bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 font-bold select-none`}>
        ?
      </div>
    )
  }

  const colorClass = parsed.color === 'red' ? 'text-red-400' : 'text-white'

  return (
    <div className={`${sizeClasses} rounded bg-gray-800 border border-gray-600 flex flex-col items-center justify-center gap-0 select-none`}>
      <span className={`font-bold leading-none ${colorClass} ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
        {parsed.rank}
      </span>
      <span className={`leading-none ${colorClass} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {parsed.symbol}
      </span>
    </div>
  )
}

export default function CardDisplay({ label, cards = [], size = 'md', placeholder = 0 }) {
  const totalCards = Math.max(cards.length, placeholder)

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      )}
      <div className="flex gap-1 flex-wrap">
        {cards.map((card, i) => (
          <Card key={i} card={card} size={size} />
        ))}
        {/* Placeholder slots for unknown cards */}
        {Array.from({ length: Math.max(0, placeholder - cards.length) }).map((_, i) => (
          <Card key={`ph-${i}`} card={null} size={size} />
        ))}
        {totalCards === 0 && (
          <span className="text-gray-600 text-sm italic">None visible</span>
        )}
      </div>
    </div>
  )
}
