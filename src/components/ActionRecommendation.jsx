import { getActionStyle, formatChips } from '../lib/pokerUtils.js'

export default function ActionRecommendation({ recommendation, sizing, reasoning, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-14 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2" />
      </div>
    )
  }

  if (!recommendation) {
    return (
      <div className="h-14 bg-gray-800 rounded-lg border border-dashed border-gray-700 flex items-center justify-center">
        <span className="text-gray-600 text-sm">Waiting for analysis...</span>
      </div>
    )
  }

  const { bg, text, label } = getActionStyle(recommendation)
  const sizingLabel = sizing ? ` ${formatChips(sizing)}` : ''

  return (
    <div className="space-y-3">
      <div className={`${bg} ${text} rounded-lg px-4 py-3 flex items-center gap-3`}>
        <ActionIcon action={recommendation} />
        <span className="text-xl font-bold tracking-wide">
          {label}{sizingLabel}
        </span>
      </div>
      {reasoning && (
        <p className="text-sm text-gray-400 leading-relaxed">{reasoning}</p>
      )}
    </div>
  )
}

function ActionIcon({ action }) {
  switch (action?.toLowerCase()) {
    case 'fold':
      return <span className="text-2xl">✕</span>
    case 'call':
      return <span className="text-2xl">↗</span>
    case 'check':
      return <span className="text-2xl">✓</span>
    case 'raise':
    case 'reraise':
      return <span className="text-2xl">⬆</span>
    default:
      return null
  }
}
