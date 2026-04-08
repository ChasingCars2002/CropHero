// Card suit symbols for display
const SUIT_SYMBOLS = { h: '♥', d: '♦', c: '♣', s: '♠' }
const SUIT_COLORS = { h: 'red', d: 'red', c: 'white', s: 'white' }

// Normalize card string to pokersolver format: "Ah", "Kd", "Tc", etc.
export function normalizeCard(str) {
  if (!str || typeof str !== 'string') return null
  str = str.trim()

  // Already correct format like "Ah", "Tc", "2s"
  if (/^[2-9TJQKA][hdcs]$/i.test(str)) {
    return str[0].toUpperCase() + str[1].toLowerCase()
  }

  // Handle suit symbols: A♥ K♦ etc.
  const symbolMap = { '♥': 'h', '♦': 'd', '♣': 'c', '♠': 's' }
  for (const [sym, suit] of Object.entries(symbolMap)) {
    if (str.includes(sym)) {
      const rank = str.replace(sym, '').trim()
      const normalized = normalizeRank(rank)
      return normalized ? normalized + suit : null
    }
  }

  // Handle "Ace of Hearts", "King of Diamonds" etc.
  const longMatch = str.match(/^(Ace|King|Queen|Jack|Ten|\d)\s+of\s+(Hearts|Diamonds|Clubs|Spades)$/i)
  if (longMatch) {
    const rankMap = { ace: 'A', king: 'K', queen: 'Q', jack: 'J', ten: 'T' }
    const suitMap = { hearts: 'h', diamonds: 'd', clubs: 'c', spades: 's' }
    const rank = rankMap[longMatch[1].toLowerCase()] || longMatch[1]
    const suit = suitMap[longMatch[2].toLowerCase()]
    return rank + suit
  }

  return null
}

function normalizeRank(r) {
  if (!r) return null
  r = r.trim().toUpperCase()
  if (r === '10') return 'T'
  if (/^[2-9TJQKA]$/.test(r)) return r
  return null
}

// Parse a card string into display parts
export function parseCard(card) {
  const normalized = normalizeCard(card)
  if (!normalized) return null
  const rank = normalized[0]
  const suit = normalized[1]
  return {
    rank,
    suit,
    symbol: SUIT_SYMBOLS[suit] || suit,
    color: SUIT_COLORS[suit] || 'white',
    display: rank + (SUIT_SYMBOLS[suit] || suit),
    normalized,
  }
}

// Try to parse Claude's response text into a JSON object
export function parseClaudeResponse(text) {
  if (!text) return null

  // Direct parse
  try {
    return JSON.parse(text)
  } catch (_) {}

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim())
    } catch (_) {}
  }

  // Extract first JSON object
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch (_) {}
  }

  return null
}

// Calculate pot odds as a percentage
export function calcPotOdds(callAmount, potSize) {
  if (!callAmount || callAmount <= 0) return null
  return (callAmount / (potSize + callAmount)) * 100
}

// Map hand strength 0-100 to a label
export function getStrengthLabel(pct) {
  if (pct == null) return 'Unknown'
  if (pct >= 85) return 'Monster'
  if (pct >= 65) return 'Strong'
  if (pct >= 40) return 'Marginal'
  return 'Weak'
}

// Map pokersolver rank (0–8) to a 0–100 strength percentile
export function handRankToStrength(rank) {
  // pokersolver ranks: 1=High Card, 2=Pair, 3=Two Pair, 4=Three of a Kind,
  // 5=Straight, 6=Flush, 7=Full House, 8=Four of a Kind, 9=Straight Flush
  const map = { 1: 10, 2: 25, 3: 45, 4: 60, 5: 70, 6: 78, 7: 88, 8: 95, 9: 100 }
  return map[rank] ?? 50
}

// Format chip/dollar amounts
export function formatChips(n) {
  if (n == null) return '?'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

// Action color classes for Tailwind
export function getActionStyle(action) {
  switch (action?.toLowerCase()) {
    case 'fold':    return { bg: 'bg-red-600',    text: 'text-white', label: 'FOLD' }
    case 'call':    return { bg: 'bg-blue-600',   text: 'text-white', label: 'CALL' }
    case 'check':   return { bg: 'bg-gray-600',   text: 'text-white', label: 'CHECK' }
    case 'raise':   return { bg: 'bg-green-600',  text: 'text-white', label: 'RAISE' }
    case 'reraise': return { bg: 'bg-emerald-600', text: 'text-white', label: 'RE-RAISE' }
    default:        return { bg: 'bg-gray-700',   text: 'text-white', label: action?.toUpperCase() ?? '...' }
  }
}

// Format seconds ago
export function timeAgo(date) {
  if (!date) return null
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  return `${Math.floor(secs / 60)}m ago`
}
