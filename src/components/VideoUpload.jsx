import { useState, useCallback, useRef } from 'react'

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']

export default function VideoUpload({ onVideoSelect }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm)$/i)) {
      alert('Please upload a valid video file (MP4, MOV, AVI, or WebM)')
      return
    }
    onVideoSelect(file)
  }, [onVideoSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">CropHero</h1>
        <p className="text-gray-400 text-lg">Upload a video, crop it visually, export the result.</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          w-full max-w-lg p-12 rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200 text-center
          ${dragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/80'
          }
        `}
      >
        <div className="mb-4">
          <svg className="mx-auto w-16 h-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-white text-lg font-medium mb-1">
          Drop your video here
        </p>
        <p className="text-gray-500 text-sm">
          or click to browse &middot; MP4, MOV, AVI, WebM
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
