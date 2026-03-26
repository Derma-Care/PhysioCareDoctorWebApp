import pako from 'pako'

export const decodeCompressedBase64 = (compressedBase64, mimeType = 'image/png') => {
  try {
    const binary = atob(compressedBase64) // base64 to binary
    const binaryData = Uint8Array.from(binary, char => char.charCodeAt(0))
    const decompressed = pako.inflate(binaryData)
    const blob = new Blob([decompressed], { type: mimeType })
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Image decompression failed:', error)
    return null
  }
}
