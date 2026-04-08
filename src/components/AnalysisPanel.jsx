import CardDisplay from './CardDisplay.jsx'
import HandStrengthMeter from './HandStrengthMeter.jsx'
import ActionRecommendation from './ActionRecommendation.jsx'
import StatusBar from './StatusBar.jsx'
import { useHandEvaluator } from '../hooks/useHandEvaluator.js'
import { formatChips } from '../lib/pokerUtils.js'

export default function AnalysisPanel({
  analysisResult,
  isAnalyzing,
  isLoading,
  error,
  rateLimited,
  rateLimitSecs,
  lastAnalyzedAt,
  errorCount,
  onOpenApiKey,
}) {
  const r = analysisResult

  // Local hand evaluation from pokersolver (overrides Claude's estimate when available)
  const localHand = useHandEvaluator(r?.holeCards, r?.communityCards)

  const strengthPct = localHand?.rankPct ?? r?.handStrengthEstimate ?? null
  const handName    = localHand?.handName ?? null

  return (
    <div className="w-96 min-w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto">
      {/* Status bar */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-800">
        <StatusBar
          isAnalyzing={isAnalyzing}
          isLoading={isLoading}
          rateLimited={rateLimited}
          rateLimitSecs={rateLimitSecs}
          lastAnalyzedAt={lastAnalyzedAt}
          error={error}
          errorCount={errorCount}
          onOpenApiKey={onOpenApiKey}
        />
      </div>

      {/* Game info header */}
      <div className="px-4 py-3 border-b border-gray-800">
        {r ? (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">
                {r.gameType || 'Poker'}
              </span>
              {r.heroPosition && (
                <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded">
                  {r.heroPosition}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {r.currentStreet && (
                <span className="capitalize">{r.currentStreet}</span>
              )}
              {r.potSize != null && (
                <span>Pot: {formatChips(r.potSize)}</span>
              )}
              {r.playerCount != null && (
                <span>{r.playerCount} players</span>
              )}
              {r.effectiveStack != null && (
                <span>Stack: {formatChips(r.effectiveStack)}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-gray-800 rounded w-3/4 animate-pulse" />
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="px-4 py-3 border-b border-gray-800 space-y-3">
        <CardDisplay
          label="Your Cards"
          cards={r?.holeCards || []}
          placeholder={r ? 0 : 2}
        />
        <CardDisplay
          label="Board"
          cards={r?.communityCards || []}
          size="sm"
          placeholder={r ? 0 : 5}
        />
      </div>

      {/* Hand strength */}
      <div className="px-4 py-3 border-b border-gray-800">
        <HandStrengthMeter handName={handName} percentage={strengthPct} />
      </div>

      {/* Pot odds + equity */}
      <div className="px-4 py-3 border-b border-gray-800 grid grid-cols-2 gap-4">
        <Stat
          label="Pot Odds"
          value={r?.potOdds != null ? `${r.potOdds.toFixed(1)}%` : null}
          sub={r?.facingBet ? `Call ${formatChips(r.facingBet)}` : 'No bet'}
        />
        <Stat
          label="Equity Est."
          value={r?.equityEstimate != null ? `${r.equityEstimate}%` : null}
          sub="vs. likely range"
        />
      </div>

      {/* Action + reasoning */}
      <div className="px-4 py-4 flex-1">
        <ActionRecommendation
          recommendation={r?.recommendation}
          sizing={r?.recommendationSizing}
          reasoning={r?.reasoning}
          isLoading={isLoading && !r}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-200">
        {value ?? <span className="text-gray-600 text-base">—</span>}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}
