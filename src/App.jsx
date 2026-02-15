import { useState, useCallback } from 'react'
import VideoUpload from './components/VideoUpload'
import VideoCropper from './components/VideoCropper'
import { useFFmpeg } from './hooks/useFFmpeg'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const { load, loaded, loading, cropVideo, exporting, progress } = useFFmpeg()

  const handleExport = useCallback(async (cropParams) => {
    try {
      if (!loaded) {
        await load()
      }
      await cropVideo(videoFile, cropParams)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Make sure your browser supports SharedArrayBuffer (Cross-Origin Isolation required).')
    }
  }, [loaded, load, cropVideo, videoFile])

  const handleReset = useCallback(() => {
    setVideoFile(null)
  }, [])

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden">
      {!videoFile ? (
        <VideoUpload onVideoSelect={setVideoFile} />
      ) : (
        <>
          <VideoCropper
            videoFile={videoFile}
            onExport={handleExport}
            exporting={exporting}
            progress={progress}
            ffmpegLoading={loading}
          />
          {!exporting && (
            <button
              onClick={handleReset}
              className="absolute top-3 right-40 px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all z-50"
            >
              New Video
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default App
