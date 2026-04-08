const MAX_WIDTH = 1280
const JPEG_QUALITY = 0.82

/**
 * Extract a JPEG frame from a video element and return it as a base64 string.
 * Returns null if the video is not ready.
 */
export function extractJpegFrame(videoElement, quality = JPEG_QUALITY) {
  if (!videoElement) return null
  if (videoElement.readyState < 2) return null // HAVE_CURRENT_DATA
  if (!videoElement.videoWidth || !videoElement.videoHeight) return null

  const scale = Math.min(1, MAX_WIDTH / videoElement.videoWidth)
  const width  = Math.floor(videoElement.videoWidth  * scale)
  const height = Math.floor(videoElement.videoHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  // Strip the "data:image/jpeg;base64," prefix
  return dataUrl.split(',')[1] ?? null
}
