import { useState, useCallback } from 'react'

export function useFFmpeg() {
  const [progress, setProgress] = useState(0)
  const [exporting, setExporting] = useState(false)

  const cropVideo = useCallback(async (videoFile, cropParams) => {
    setExporting(true)
    setProgress(0)

    try {
      const { w, h, x, y } = cropParams

      // Create an offscreen video element for reading frames
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.src = URL.createObjectURL(videoFile)

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = reject
      })

      // Create a canvas sized to the crop output
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')

      // Use MediaRecorder to capture the canvas as video
      const stream = canvas.captureStream(30)

      // Try to get audio from the original video
      let audioStream = null
      try {
        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaElementSource(video)
        const dest = audioCtx.createMediaStreamDestination()
        source.connect(dest)
        source.connect(audioCtx.destination) // keep audio audible for processing
        audioStream = dest.stream
        // Add audio tracks to the canvas stream
        for (const track of audioStream.getAudioTracks()) {
          stream.addTrack(track)
        }
      } catch {
        // No audio or audio capture not supported - continue without audio
      }

      // Determine supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ]
      let mimeType = ''
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          mimeType = mt
          break
        }
      }

      const chunks = []
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 8_000_000,
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      const recorderDone = new Promise((resolve) => {
        recorder.onstop = resolve
      })

      recorder.start()

      // Play the video and draw cropped frames to canvas
      video.currentTime = 0
      await video.play()

      const duration = video.duration

      const drawFrame = () => {
        if (video.paused || video.ended) return
        ctx.drawImage(video, x, y, w, h, 0, 0, w, h)
        setProgress(Math.round((video.currentTime / duration) * 100))
        requestAnimationFrame(drawFrame)
      }

      drawFrame()

      // Wait for video to finish playing
      await new Promise((resolve) => {
        video.onended = resolve
        video.onpause = resolve
      })

      // Draw final frame
      ctx.drawImage(video, x, y, w, h, 0, 0, w, h)
      setProgress(100)

      recorder.stop()
      await recorderDone

      // Clean up video element
      URL.revokeObjectURL(video.src)

      // Download the result
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      const baseName = (videoFile.name || 'video').replace(/\.[^.]+$/, '')
      a.download = `cropped_${baseName}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }, [])

  // Keep the same API shape - load is now a no-op
  const load = useCallback(async () => {}, [])

  return { load, loaded: true, loading: false, cropVideo, exporting, progress }
}
