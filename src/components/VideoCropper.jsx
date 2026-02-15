import { useState, useRef, useEffect, useCallback } from 'react'
import { Rnd } from 'react-rnd'

const ASPECT_PRESETS = [
  { label: 'Free', ratio: null },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
]

export default function VideoCropper({ videoFile, onExport, exporting, progress, ffmpegLoading }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [videoUrl, setVideoUrl] = useState(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 })
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [activePreset, setActivePreset] = useState('Free')
  const [isPlaying, setIsPlaying] = useState(false)

  // Create object URL for the video
  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  // Calculate scale factor from display pixels to actual video pixels
  const getScale = useCallback(() => {
    if (!displayDimensions.width || !videoDimensions.width) return 1
    return videoDimensions.width / displayDimensions.width
  }, [displayDimensions, videoDimensions])

  // Get actual crop coordinates in video resolution
  const getActualCrop = useCallback(() => {
    const scale = getScale()
    return {
      x: Math.round(cropBox.x * scale),
      y: Math.round(cropBox.y * scale),
      w: Math.round(cropBox.width * scale),
      h: Math.round(cropBox.height * scale),
    }
  }, [cropBox, getScale])

  // Handle video metadata loaded - get actual resolution
  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const actualW = video.videoWidth
    const actualH = video.videoHeight
    setVideoDimensions({ width: actualW, height: actualH })

    updateDisplayAndCrop(actualW, actualH)
  }, [])

  const updateDisplayAndCrop = useCallback((actualW, actualH) => {
    const container = containerRef.current
    if (!container) return

    const maxW = container.clientWidth
    const maxH = container.clientHeight || 500

    const videoAspect = actualW / actualH
    let dispW, dispH

    if (videoAspect > maxW / maxH) {
      dispW = maxW
      dispH = maxW / videoAspect
    } else {
      dispH = maxH
      dispW = maxH * videoAspect
    }

    setDisplayDimensions({ width: dispW, height: dispH })

    // Initialize crop box to full video area
    const margin = 20
    setCropBox({
      x: margin,
      y: margin,
      width: dispW - margin * 2,
      height: dispH - margin * 2,
    })
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (videoDimensions.width > 0) {
        updateDisplayAndCrop(videoDimensions.width, videoDimensions.height)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [videoDimensions, updateDisplayAndCrop])

  // Constrain crop box within video bounds
  const constrain = useCallback((x, y, w, h) => {
    const maxW = displayDimensions.width
    const maxH = displayDimensions.height

    let newW = Math.min(Math.max(w, 30), maxW)
    let newH = Math.min(Math.max(h, 30), maxH)
    let newX = Math.min(Math.max(x, 0), maxW - newW)
    let newY = Math.min(Math.max(y, 0), maxH - newH)

    return { x: newX, y: newY, width: newW, height: newH }
  }, [displayDimensions])

  // Apply aspect ratio preset
  const applyPreset = useCallback((presetLabel) => {
    setActivePreset(presetLabel)
    const preset = ASPECT_PRESETS.find((p) => p.label === presetLabel)
    if (!preset || !preset.ratio) return

    const ratio = preset.ratio
    const maxW = displayDimensions.width
    const maxH = displayDimensions.height

    let newW, newH
    if (ratio > maxW / maxH) {
      newW = maxW * 0.8
      newH = newW / ratio
    } else {
      newH = maxH * 0.8
      newW = newH * ratio
    }

    const newX = (maxW - newW) / 2
    const newY = (maxH - newH) / 2

    setCropBox(constrain(newX, newY, newW, newH))
  }, [displayDimensions, constrain])

  const handleDragStop = useCallback((e, d) => {
    setCropBox((prev) => constrain(d.x, d.y, prev.width, prev.height))
  }, [constrain])

  const handleResizeStop = useCallback((e, direction, ref, delta, position) => {
    const newW = parseFloat(ref.style.width)
    const newH = parseFloat(ref.style.height)
    setCropBox(constrain(position.x, position.y, newW, newH))
  }, [constrain])

  const handleResize = useCallback((e, direction, ref, delta, position) => {
    const preset = ASPECT_PRESETS.find((p) => p.label === activePreset)
    if (preset && preset.ratio) {
      const newW = parseFloat(ref.style.width)
      const newH = newW / preset.ratio
      ref.style.height = `${newH}px`
    }
  }, [activePreset])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const handleExport = useCallback(() => {
    const actual = getActualCrop()
    onExport(actual)
  }, [getActualCrop, onExport])

  const actualCrop = getActualCrop()
  const lockAspectRatio = ASPECT_PRESETS.find((p) => p.label === activePreset)?.ratio || false

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg mr-4">CropHero</h2>
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.label)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${activePreset === preset.label
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || ffmpegLoading}
          className={`
            px-5 py-2 rounded-lg text-sm font-semibold transition-all
            ${exporting || ffmpegLoading
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700'
            }
          `}
        >
          {ffmpegLoading ? 'Loading FFmpeg...' : exporting ? `Exporting ${progress}%` : 'Export Video'}
        </button>
      </div>

      {/* Progress bar */}
      {(exporting || ffmpegLoading) && (
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: ffmpegLoading ? '100%' : `${progress}%` }}
          />
          {ffmpegLoading && (
            <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '100%', marginTop: '-4px' }} />
          )}
        </div>
      )}

      {/* Main cropping area */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 p-4 overflow-hidden" ref={containerRef}>
        <div
          className="relative"
          style={{ width: displayDimensions.width, height: displayDimensions.height }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleVideoLoaded}
            onClick={togglePlay}
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          />

          {/* Dark overlay mask */}
          {displayDimensions.width > 0 && (
            <>
              {/* Top */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{ top: 0, left: 0, width: '100%', height: cropBox.y }}
              />
              {/* Bottom */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: cropBox.y + cropBox.height,
                  left: 0,
                  width: '100%',
                  height: displayDimensions.height - cropBox.y - cropBox.height,
                }}
              />
              {/* Left */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: cropBox.y,
                  left: 0,
                  width: cropBox.x,
                  height: cropBox.height,
                }}
              />
              {/* Right */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: cropBox.y,
                  left: cropBox.x + cropBox.width,
                  width: displayDimensions.width - cropBox.x - cropBox.width,
                  height: cropBox.height,
                }}
              />

              {/* Draggable/Resizable crop window */}
              <Rnd
                size={{ width: cropBox.width, height: cropBox.height }}
                position={{ x: cropBox.x, y: cropBox.y }}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
                onResize={handleResize}
                bounds="parent"
                lockAspectRatio={lockAspectRatio}
                minWidth={30}
                minHeight={30}
                className="z-10"
                style={{
                  border: '2px solid rgba(129, 140, 248, 0.8)',
                  boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.3)',
                }}
                resizeHandleStyles={{
                  topLeft: handleStyle,
                  topRight: handleStyle,
                  bottomLeft: handleStyle,
                  bottomRight: handleStyle,
                  top: edgeHandleH,
                  bottom: edgeHandleH,
                  left: edgeHandleV,
                  right: edgeHandleV,
                }}
              >
                {/* Grid lines */}
                <div className="w-full h-full relative pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                </div>
              </Rnd>
            </>
          )}

          {/* Play button overlay */}
          {!isPlaying && displayDimensions.width > 0 && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-700/50 text-xs text-gray-400">
        <div className="flex gap-4">
          <span>Source: {videoDimensions.width}x{videoDimensions.height}</span>
          <span>Crop: {actualCrop.w}x{actualCrop.h}</span>
          <span>Position: ({actualCrop.x}, {actualCrop.y})</span>
        </div>
        <div className="flex gap-4">
          <span>Preset: {activePreset}</span>
          <span className="text-gray-600">{videoFile.name}</span>
        </div>
      </div>
    </div>
  )
}

const handleStyle = {
  width: 12,
  height: 12,
  background: '#818cf8',
  borderRadius: 2,
  border: '2px solid #312e81',
}

const edgeHandleH = {
  height: 4,
  background: 'transparent',
}

const edgeHandleV = {
  width: 4,
  background: 'transparent',
}
