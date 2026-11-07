import { ImageSource } from '@nativescript/core'
import { cropOutputSize, validateImageCrop, type CropSource } from '@getcortexlabs/mavis-core'
import { loadSource, saveCrop } from './image-crop-common'
interface Size {
  width: number
  height: number
}
interface Rect {
  origin: { x: number; y: number }
  size: Size
}
interface UIImage {
  size: Size
  scale: number
  drawInRect(rect: Rect): void
}
declare function UIGraphicsBeginImageContextWithOptions(
  size: Size,
  opaque: boolean,
  scale: number,
): void
declare function UIGraphicsGetImageFromCurrentImageContext(): UIImage | null
declare function UIGraphicsGetCurrentContext(): unknown
declare function UIGraphicsEndImageContext(): void
declare function CGContextScaleCTM(context: unknown, x: number, y: number): void
declare function CGContextTranslateCTM(context: unknown, x: number, y: number): void
declare function CGContextRotateCTM(context: unknown, angle: number): void
declare function CGContextSetRGBFillColor(
  context: unknown,
  r: number,
  g: number,
  b: number,
  a: number,
): void
declare function CGContextFillRect(context: unknown, rect: Rect): void
const rect = (width: number, height: number): Rect => ({
  origin: { x: 0, y: 0 },
  size: { width, height },
})
export async function loadCropImage(src: string): Promise<CropSource> {
  const source = await loadSource(src),
    original = source.ios as UIImage,
    width = Math.round(original.size.width * original.scale),
    height = Math.round(original.size.height * original.scale)
  if (width * height > 40000000)
    throw new RangeError('ImageCropper supports at most 40 megapixels.')
  let image: UIImage | null
  UIGraphicsBeginImageContextWithOptions({ width, height }, false, 1)
  try {
    original.drawInRect(rect(width, height))
    image = UIGraphicsGetImageFromCurrentImageContext()
  } finally {
    UIGraphicsEndImageContext()
  }
  if (!image) throw new Error('Could not normalize the source image.')
  const normalized = image,
    preview = new ImageSource(normalized)
  let disposed = false
  return {
    width,
    height,
    preview,
    dispose() {
      disposed = true
    },
    async export(crop, options) {
      if (disposed) throw new Error('Image source has been released.')
      validateImageCrop({ width, height }, crop)
      const size = cropOutputSize(crop, options)
      let result: UIImage | null
      UIGraphicsBeginImageContextWithOptions(size, false, 1)
      try {
        const context = UIGraphicsGetCurrentContext()
        if (!context) throw new Error('Could not allocate the crop context.')
        if (options.mimeType === 'image/jpeg') {
          CGContextSetRGBFillColor(context, 1, 1, 1, 1)
          CGContextFillRect(context, rect(size.width, size.height))
        }
        CGContextScaleCTM(context, size.width / crop.width, size.height / crop.height)
        CGContextTranslateCTM(context, -crop.x, -crop.y)
        if (crop.rotation === 90) CGContextTranslateCTM(context, height, 0)
        if (crop.rotation === 180) CGContextTranslateCTM(context, width, height)
        if (crop.rotation === 270) CGContextTranslateCTM(context, 0, width)
        CGContextRotateCTM(context, (crop.rotation * Math.PI) / 180)
        normalized.drawInRect(rect(width, height))
        result = UIGraphicsGetImageFromCurrentImageContext()
      } finally {
        UIGraphicsEndImageContext()
      }
      if (!result) throw new Error('Could not render the cropped image.')
      return saveCrop(new ImageSource(result), size.width, size.height, options)
    },
  }
}
