import { cropOutputSize, validateImageCrop, type CropSource } from '@getcortexlabs/mavis-core'
export async function loadCropImage(src: string): Promise<CropSource> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  await image.decode()
  const width = image.naturalWidth,
    height = image.naturalHeight
  if (!width || !height || width * height > 40000000) {
    image.src = ''
    throw new RangeError('ImageCropper needs an image of at most 40 megapixels.')
  }
  let disposed = false
  return {
    width,
    height,
    preview: src,
    dispose() {
      disposed = true
      image.src = ''
    },
    async export(crop, options) {
      if (disposed) throw new Error('Image source has been released.')
      validateImageCrop({ width, height }, crop)
      const size = cropOutputSize(crop, options)
      const canvas = document.createElement('canvas')
      canvas.width = size.width
      canvas.height = size.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas image export is unavailable.')
      try {
        if (options.mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, size.width, size.height)
        }
        ctx.scale(size.width / crop.width, size.height / crop.height)
        ctx.translate(-crop.x, -crop.y)
        if (crop.rotation === 90) ctx.translate(height, 0)
        if (crop.rotation === 180) ctx.translate(width, height)
        if (crop.rotation === 270) ctx.translate(0, width)
        ctx.rotate((crop.rotation * Math.PI) / 180)
        ctx.drawImage(image, 0, 0)
        const uri = canvas.toDataURL(options.mimeType, options.quality)
        if (!uri.startsWith(`data:${options.mimeType};`))
          throw new Error('Requested image encoding is unavailable.')
        return { ...size, uri, mimeType: options.mimeType, async dispose() {} }
      } catch (error) {
        throw new Error(
          `Image export failed. Remote images must allow CORS. ${error instanceof Error ? error.message : String(error)}`,
        )
      } finally {
        canvas.width = 0
        canvas.height = 0
      }
    },
  }
}
