import { useState, useRef, useEffect, useCallback } from 'react'

const ASPECT_PRESETS = [
  { label: 'Free', ratio: null },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
]

const HANDLE_SIZE = 12

export default function VideoCropper({ videoFile, onExport, exporting, progress }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const wrapperRef = useRef(null)

  const [videoUrl, setVideoUrl] = useState(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 })
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 })
  const [activePreset, setActivePreset] = useState('Free')
  const [isPlaying, setIsPlaying] = useState(false)
  const [dragging, setDragging] = useState(null) // null | 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

  const dragStartRef = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  const getScale = useCallback(() => {
    if (!displayDimensions.width || !videoDimensions.width) return 1
    return videoDimensions.width / displayDimensions.width
  }, [displayDimensions, videoDimensions])

  const getActualCrop = useCallback(() => {
    const scale = getScale()
    return {
      x: Math.round(cropBox.x * scale),
      y: Math.round(cropBox.y * scale),
      w: Math.round(cropBox.width * scale),
      h: Math.round(cropBox.height * scale),
    }
  }, [cropBox, getScale])

  const computeDisplay = useCallback((actualW, actualH) => {
    const container = containerRef.current
    if (!container) return null

    const style = getComputedStyle(container)
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    const maxW = container.clientWidth - padX
    const maxH = container.clientHeight - padY

    if (maxW <= 0 || maxH <= 0) return null

    const videoAspect = actualW / actualH
    let dispW, dispH

    if (videoAspect > maxW / maxH) {
      dispW = maxW
      dispH = maxW / videoAspect
    } else {
      dispH = maxH
      dispW = maxH * videoAspect
    }

    return { width: Math.floor(dispW), height: Math.floor(dispH) }
  }, [])

  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const actualW = video.videoWidth
    const actualH = video.videoHeight
    setVideoDimensions({ width: actualW, height: actualH })

    const disp = computeDisplay(actualW, actualH)
    if (disp) {
      setDisplayDimensions(disp)
      const margin = Math.min(20, disp.width * 0.05, disp.height * 0.05)
      setCropBox({
        x: margin,
        y: margin,
        width: disp.width - margin * 2,
        height: disp.height - margin * 2,
      })
    }
  }, [computeDisplay])

  useEffect(() => {
    const handleResize = () => {
      if (videoDimensions.width > 0) {
        const disp = computeDisplay(videoDimensions.width, videoDimensions.height)
        if (disp) {
          const scaleX = disp.width / (displayDimensions.width || 1)
          const scaleY = disp.height / (displayDimensions.height || 1)
          setDisplayDimensions(disp)
          setCropBox((prev) => ({
            x: prev.x * scaleX,
            y: prev.y * scaleY,
            width: prev.width * scaleX,
            height: prev.height * scaleY,
          }))
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [videoDimensions, displayDimensions, computeDisplay])

  const constrain = useCallback((x, y, w, h) => {
    const maxW = displayDimensions.width
    const maxH = displayDimensions.height
    const newW = Math.min(Math.max(w, 30), maxW)
    const newH = Math.min(Math.max(h, 30), maxH)
    const newX = Math.min(Math.max(x, 0), maxW - newW)
    const newY = Math.min(Math.max(y, 0), maxH - newH)
    return { x: newX, y: newY, width: newW, height: newH }
  }, [displayDimensions])

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

    setCropBox(constrain((maxW - newW) / 2, (maxH - newH) / 2, newW, newH))
  }, [displayDimensions, constrain])

  // Custom drag & resize logic
  const getPointerPos = useCallback((e) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return { x: 0, y: 0 }
    const rect = wrapper.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const handlePointerDown = useCallback((e, type) => {
    e.preventDefault()
    e.stopPropagation()
    const pos = getPointerPos(e)
    dragStartRef.current = { type, startPos: pos, startBox: { ...cropBox } }
    setDragging(type)
  }, [cropBox, getPointerPos])

  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (e) => {
      e.preventDefault()
      const pos = getPointerPos(e)
      const start = dragStartRef.current
      if (!start) return

      const dx = pos.x - start.startPos.x
      const dy = pos.y - start.startPos.y
      const box = start.startBox
      const preset = ASPECT_PRESETS.find((p) => p.label === activePreset)
      const ratio = preset?.ratio || null

      let newBox
      if (start.type === 'move') {
        newBox = constrain(box.x + dx, box.y + dy, box.width, box.height)
      } else {
        let nx = box.x, ny = box.y, nw = box.width, nh = box.height

        if (start.type.includes('e')) { nw = box.width + dx }
        if (start.type.includes('w')) { nx = box.x + dx; nw = box.width - dx }
        if (start.type.includes('s')) { nh = box.height + dy }
        if (start.type.includes('n')) { ny = box.y + dy; nh = box.height - dy }

        // Enforce min size
        if (nw < 30) { nw = 30; if (start.type.includes('w')) nx = box.x + box.width - 30 }
        if (nh < 30) { nh = 30; if (start.type.includes('n')) ny = box.y + box.height - 30 }

        // Lock aspect ratio if preset selected
        if (ratio) {
          if (start.type === 'n' || start.type === 's') {
            nw = nh * ratio
            if (start.type === 'n') {
              // Anchor from bottom
            }
            nx = box.x + (box.width - nw) / 2
          } else if (start.type === 'w' || start.type === 'e') {
            nh = nw / ratio
            ny = box.y + (box.height - nh) / 2
          } else {
            // Corner handles
            nh = nw / ratio
            if (start.type.includes('n')) {
              ny = box.y + box.height - nh
            }
          }
        }

        newBox = constrain(nx, ny, nw, nh)
      }

      setCropBox(newBox)
    }

    const handlePointerUp = () => {
      setDragging(null)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchmove', handlePointerMove, { passive: false })
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [dragging, constrain, activePreset, getPointerPos])

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
    onExport(getActualCrop())
  }, [getActualCrop, onExport])

  const actualCrop = getActualCrop()

  const handles = [
    { id: 'nw', cursor: 'nwse-resize', style: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 } },
    { id: 'ne', cursor: 'nesw-resize', style: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 } },
    { id: 'sw', cursor: 'nesw-resize', style: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 } },
    { id: 'se', cursor: 'nwse-resize', style: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 } },
    { id: 'n', cursor: 'ns-resize', style: { top: -3, left: '30%', right: '30%', height: 6 }, isEdge: true },
    { id: 's', cursor: 'ns-resize', style: { bottom: -3, left: '30%', right: '30%', height: 6 }, isEdge: true },
    { id: 'w', cursor: 'ew-resize', style: { left: -3, top: '30%', bottom: '30%', width: 6 }, isEdge: true },
    { id: 'e', cursor: 'ew-resize', style: { right: -3, top: '30%', bottom: '30%', width: 6 }, isEdge: true },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700/50 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg mr-4">CropHero</h2>
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.label)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activePreset === preset.label
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            exporting
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700'
          }`}
        >
          {exporting ? `Exporting ${progress}%` : 'Export Video'}
        </button>
      </div>

      {/* Progress bar */}
      {exporting && (
        <div className="h-1 bg-gray-800 shrink-0">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main cropping area */}
      <div
        className="flex-1 flex items-center justify-center bg-gray-950 p-6 overflow-hidden min-h-0"
        ref={containerRef}
      >
        {displayDimensions.width > 0 ? (
          <div
            ref={wrapperRef}
            className="relative select-none"
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
              style={{ pointerEvents: dragging ? 'none' : 'auto' }}
            />

            {/* Dark overlay - top */}
            <div className="absolute bg-black/60 pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: cropBox.y }} />
            {/* Dark overlay - bottom */}
            <div className="absolute bg-black/60 pointer-events-none" style={{ top: cropBox.y + cropBox.height, left: 0, width: '100%', height: Math.max(0, displayDimensions.height - cropBox.y - cropBox.height) }} />
            {/* Dark overlay - left */}
            <div className="absolute bg-black/60 pointer-events-none" style={{ top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height }} />
            {/* Dark overlay - right */}
            <div className="absolute bg-black/60 pointer-events-none" style={{ top: cropBox.y, left: cropBox.x + cropBox.width, width: Math.max(0, displayDimensions.width - cropBox.x - cropBox.width), height: cropBox.height }} />

            {/* Crop window */}
            <div
              onMouseDown={(e) => handlePointerDown(e, 'move')}
              onTouchStart={(e) => handlePointerDown(e, 'move')}
              className="absolute z-10"
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height,
                border: '2px solid rgba(129, 140, 248, 0.8)',
                boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.3)',
                cursor: dragging === 'move' ? 'grabbing' : 'grab',
              }}
            >
              {/* Rule of thirds grid */}
              <div className="w-full h-full relative pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
              </div>

              {/* Resize handles */}
              {handles.map((h) => (
                <div
                  key={h.id}
                  onMouseDown={(e) => handlePointerDown(e, h.id)}
                  onTouchStart={(e) => handlePointerDown(e, h.id)}
                  className="absolute z-20"
                  style={{
                    ...h.style,
                    ...(h.isEdge ? {} : { width: HANDLE_SIZE, height: HANDLE_SIZE, background: '#818cf8', borderRadius: 2, border: '2px solid #312e81' }),
                    ...(h.isEdge ? { background: 'transparent' } : {}),
                    cursor: h.cursor,
                  }}
                />
              ))}
            </div>

            {/* Play icon */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleVideoLoaded}
              className="hidden"
            />
            Loading video...
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-700/50 text-xs text-gray-400 shrink-0">
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
