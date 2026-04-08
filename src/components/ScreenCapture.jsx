export default function ScreenCapture({ videoRef, isCapturing, dimensions, error, onStart, onStop }) {
  return (
    <div className="flex-1 flex flex-col bg-gray-950 relative overflow-hidden">
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-contain ${isCapturing ? 'block' : 'hidden'}`}
      />

      {/* Empty state */}
      {!isCapturing && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="text-center space-y-2">
            <div className="text-6xl mb-4">🃏</div>
            <h2 className="text-xl font-semibold text-gray-300">Select your poker window</h2>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Click below to share your screen. You can select your entire display
              or just the poker client window.
            </p>
          </div>
          <button
            onClick={onStart}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Select Screen
          </button>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      )}

      {/* Controls overlay when capturing */}
      {isCapturing && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {dimensions && (
            <span className="text-xs bg-black/60 text-gray-400 px-2 py-0.5 rounded">
              {dimensions.width}×{dimensions.height}
            </span>
          )}
          <button
            onClick={onStop}
            className="text-xs bg-black/60 hover:bg-red-900/60 text-gray-400 hover:text-red-300 px-2 py-0.5 rounded transition-colors"
          >
            Stop capture
          </button>
        </div>
      )}
    </div>
  )
}
