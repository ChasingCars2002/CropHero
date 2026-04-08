import { useRef, useState, useCallback, useEffect } from 'react'

export function useScreenCapture() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState(null)
  const [dimensions, setDimensions] = useState(null)

  // Stop capture and clean up
  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
    setDimensions(null)
  }, [])

  // Start screen capture — MUST be called synchronously from a click handler
  const startCapture = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 5, max: 10 },
          width:     { ideal: 1920 },
          height:    { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream

      // Listen for user stopping share from browser's built-in bar
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopCapture()
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setDimensions({
            width:  videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          })
        }
      }

      setIsCapturing(true)
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setError(err.message || 'Failed to start screen capture')
      }
      // NotAllowedError = user cancelled the picker — not a real error
    }
  }, [stopCapture])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return { videoRef, streamRef, isCapturing, error, dimensions, startCapture, stopCapture }
}
