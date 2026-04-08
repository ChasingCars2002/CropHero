import { timeAgo } from '../lib/pokerUtils.js'

export default function StatusBar({
  isAnalyzing,
  isLoading,
  rateLimited,
  rateLimitSecs,
  lastAnalyzedAt,
  error,
  errorCount,
  onOpenApiKey,
}) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-500 py-1">
      <div className="flex items-center gap-2">
        {rateLimited ? (
          <span className="text-yellow-500 flex items-center gap-1">
            <span>⚠</span>
            <span>Rate limited — resuming in {rateLimitSecs}s</span>
          </span>
        ) : isLoading ? (
          <span className="text-blue-400 flex items-center gap-1.5">
            <Spinner />
            <span>Analyzing...</span>
          </span>
        ) : isAnalyzing ? (
          <span className="text-green-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Live</span>
          </span>
        ) : (
          <span className="text-gray-600">Idle</span>
        )}

        {lastAnalyzedAt && !isLoading && (
          <span className="text-gray-600">{timeAgo(lastAnalyzedAt)}</span>
        )}

        {error && (
          <span className="text-red-400 max-w-48 truncate" title={error}>
            {error}
          </span>
        )}

        {errorCount > 0 && !error && (
          <span className="text-gray-600">{errorCount} errors</span>
        )}
      </div>

      <button
        onClick={onOpenApiKey}
        className="text-gray-600 hover:text-gray-400 transition-colors"
        title="API Key Settings"
      >
        ⚙
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-3 h-3 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
