import { useMemo } from 'react'
import { normalizeCard, handRankToStrength } from '../lib/pokerUtils.js'

// pokersolver uses CommonJS — Vite handles interop automatically
// but we need to handle the possible named vs default export pattern
let Hand
try {
  const mod = await import('pokersolver')
  Hand = mod.Hand ?? mod.default?.Hand
} catch (_) {
  Hand = null
}

/**
 * Evaluate the best hand from holeCards + communityCards using pokersolver.
 * Returns { handName, rankPct } when 5+ cards are available, null otherwise.
 */
export function useHandEvaluator(holeCards, communityCards) {
  return useMemo(() => {
    if (!Hand) return null

    const all = [
      ...(holeCards      || []),
      ...(communityCards || []),
    ]
      .map(normalizeCard)
      .filter(Boolean)

    if (all.length < 5) return null

    try {
      const solved = Hand.solve(all)
      // solved.rank is 1 (High Card) through 9 (Straight Flush)
      return {
        handName: solved.name,
        rankPct:  handRankToStrength(solved.rank),
      }
    } catch (_) {
      return null
    }
  }, [holeCards, communityCards])
}
