import { useState, useEffect } from 'react'
import ApiKeySetup from './components/ApiKeySetup.jsx'
import ScreenCapture from './components/ScreenCapture.jsx'
import AnalysisPanel from './components/AnalysisPanel.jsx'
import { useScreenCapture } from './hooks/useScreenCapture.js'
import { usePokerAnalysis } from './hooks/usePokerAnalysis.js'

function App() {
  const [apiKey, setApiKey]             = useState(() => localStorage.getItem('pokerlens_api_key') || null)
  const [showApiSetup, setShowApiSetup] = useState(false)

  const {
    videoRef,
    isCapturing,
    dimensions,
    error: captureError,
    startCapture,
    stopCapture,
  } = useScreenCapture()

  const {
    analysisResult,
    isAnalyzing,
    isLoading,
    error: analysisError,
    rateLimited,
    rateLimitSecs,
    lastAnalyzedAt,
    errorCount,
    startAnalyzing,
    stopAnalyzing,
    analyzeOnce,
  } = usePokerAnalysis(videoRef, apiKey)

  // Show API key setup on first load if no key exists
  useEffect(() => {
    if (!apiKey) setShowApiSetup(true)
  }, [apiKey])

  function handleApiKeySave(key) {
    setApiKey(key)
    setShowApiSetup(false)
  }

  function handleAnalyzeToggle() {
    if (isAnalyzing) stopAnalyzing()
    else startAnalyzing()
  }

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-400">PokerLens</span>
          <span className="text-xs text-gray-600 hidden sm:block">AI Poker Analysis</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Analyze once button */}
          <button
            onClick={analyzeOnce}
            disabled={!isCapturing || !apiKey || isLoading}
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Analyze current frame once"
          >
            Analyze Once
          </button>

          {/* Live / Stop toggle */}
          <button
            onClick={handleAnalyzeToggle}
            disabled={!isCapturing || !apiKey}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5
              ${isAnalyzing
                ? 'bg-red-800 hover:bg-red-700 text-red-200'
                : 'bg-indigo-700 hover:bg-indigo-600 text-white'
              }`}
          >
            {isAnalyzing ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Stop
              </>
            ) : (
              <>
                <span>▶</span>
                Live
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <ScreenCapture
          videoRef={videoRef}
          isCapturing={isCapturing}
          dimensions={dimensions}
          error={captureError}
          onStart={startCapture}
          onStop={stopCapture}
        />

        <AnalysisPanel
          analysisResult={analysisResult}
          isAnalyzing={isAnalyzing}
          isLoading={isLoading}
          error={analysisError}
          rateLimited={rateLimited}
          rateLimitSecs={rateLimitSecs}
          lastAnalyzedAt={lastAnalyzedAt}
          errorCount={errorCount}
          onOpenApiKey={() => setShowApiSetup(true)}
        />
      </div>

      {/* API key setup modal */}
      {showApiSetup && (
        <ApiKeySetup
          existingKey={apiKey}
          onSave={handleApiKeySave}
          onClose={apiKey ? () => setShowApiSetup(false) : null}
        />
      )}
    </div>
  )
}

export default App
