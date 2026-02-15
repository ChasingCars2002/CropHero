import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

export function useFFmpeg() {
  const ffmpegRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })

      await ffmpeg.load({
        coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      setLoaded(true)
    } catch (err) {
      console.error('Failed to load FFmpeg:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loaded])

  const cropVideo = useCallback(async (videoFile, cropParams) => {
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg) throw new Error('FFmpeg not loaded')

    setExporting(true)
    setProgress(0)

    try {
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

      const { w, h, x, y } = cropParams
      const cropFilter = `crop=${Math.round(w)}:${Math.round(h)}:${Math.round(x)}:${Math.round(y)}`

      await ffmpeg.exec([
        '-i', inputName,
        '-filter:v', cropFilter,
        '-c:a', 'copy',
        outputName,
      ])

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([data.buffer], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `cropped_${videoFile.name || 'video.mp4'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }, [])

  return { load, loaded, loading, cropVideo, exporting, progress }
}
