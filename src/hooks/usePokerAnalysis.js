import { useState, useRef, useCallback, useEffect } from 'react'
import { analyzePokerFrame, RateLimitError } from '../lib/claudeApi.js'
import { extractJpegFrame } from '../lib/frameExtractor.js'
import { parseClaudeResponse } from '../lib/pokerUtils.js'

const POLL_INTERVAL_MS   = 4000  // how often to capture + analyze
const RATE_LIMIT_WAIT_MS = 30000 // backoff after 429

export function usePokerAnalysis(videoRef, apiKey) {
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing,    setIsAnalyzing]    = useState(false)
  const [isLoading,      setIsLoading]      = useState(false)
  const [error,          setError]          = useState(null)
  const [rateLimited,    setRateLimited]    = useState(false)
  const [rateLimitSecs,  setRateLimitSecs]  = useState(0)
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(null)
  const [errorCount,     setErrorCount]     = useState(0)

  const intervalRef     = useRef(null)
  const rateLimitTimer  = useRef(null)
  const isLoadingRef    = useRef(false) // sync ref to avoid stale closure in interval

  const clearTimers = useCallback(() => {
    if (intervalRef.current)    clearInterval(intervalRef.current)
    if (rateLimitTimer.current) clearInterval(rateLimitTimer.current)
    intervalRef.current    = null
    rateLimitTimer.current = null
  }, [])

  // Single analysis shot — used by both manual trigger and polling
  const runAnalysis = useCallback(async () => {
    if (!apiKey || !videoRef?.current) return
    if (isLoadingRef.current) return // skip if previous call still in-flight

    const frame = extractJpegFrame(videoRef.current)
    if (!frame) return

    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const rawText = await analyzePokerFrame(frame, apiKey)
      const parsed  = parseClaudeResponse(rawText)

      if (!parsed) {
        setErrorCount(c => c + 1)
        setError('Could not parse response from Claude')
        return
      }

      if (parsed.error) {
        setError(parsed.error)
        return
      }

      setAnalysisResult(parsed)
      setLastAnalyzedAt(new Date())
      setErrorCount(0)
      setError(null)
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimited(true)
        setIsAnalyzing(false)
        clearTimers()

        // Countdown display
        let remaining = RATE_LIMIT_WAIT_MS / 1000
        setRateLimitSecs(remaining)
        rateLimitTimer.current = setInterval(() => {
          remaining -= 1
          setRateLimitSecs(remaining)
          if (remaining <= 0) {
            clearInterval(rateLimitTimer.current)
            rateLimitTimer.current = null
            setRateLimited(false)
            setRateLimitSecs(0)
          }
        }, 1000)
      } else {
        setErrorCount(c => c + 1)
        setError(err.message || 'Analysis failed')
      }
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [apiKey, videoRef, clearTimers])

  // Start continuous polling
  const startAnalyzing = useCallback(() => {
    if (!apiKey) {
      setError('No API key set')
      return
    }
    setIsAnalyzing(true)
    setError(null)
  }, [apiKey])

  // Stop polling
  const stopAnalyzing = useCallback(() => {
    setIsAnalyzing(false)
    clearTimers()
  }, [clearTimers])

  // Manual single-shot trigger
  const analyzeOnce = useCallback(() => {
    runAnalysis()
  }, [runAnalysis])

  // Start / stop polling based on isAnalyzing
  useEffect(() => {
    if (isAnalyzing) {
      runAnalysis() // immediate first shot
      intervalRef.current = setInterval(runAnalysis, POLL_INTERVAL_MS)
    } else {
      clearTimers()
    }
    return clearTimers
  }, [isAnalyzing, runAnalysis, clearTimers])

  // Clean up on unmount
  useEffect(() => () => clearTimers(), [clearTimers])

  return {
    analysisResult,
    isAnalyzing,
    isLoading,
    error,
    rateLimited,
    rateLimitSecs,
    lastAnalyzedAt,
    errorCount,
    startAnalyzing,
    stopAnalyzing,
    analyzeOnce,
  }
}
