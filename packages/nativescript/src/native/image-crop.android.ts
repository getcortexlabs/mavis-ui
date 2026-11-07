import { ImageSource, File, Http, knownFolders, path } from '@nativescript/core'
import { cropOutputSize, validateImageCrop, type CropSource } from '@getcortexlabs/mavis-core'
import { loadSource, saveCrop } from './image-crop-common'
interface Bitmap {
  getWidth(): number
  getHeight(): number
  recycle(): void
}
interface Matrix {
  postRotate(degrees: number): void
  postScale(x: number, y: number): void
}
interface Canvas {
  drawColor(color: number): void
  scale(x: number, y: number): void
  translate(x: number, y: number): void
  rotate(degrees: number): void
  drawBitmap(bitmap: Bitmap, x: number, y: number, paint: unknown): void
}
declare const android: {
  util: { Base64: { decode(value: string, flags: number): unknown } }
  media: {
    ExifInterface: new (path: string) => { getAttributeInt(name: string, fallback: number): number }
  }

  graphics: {
    Bitmap: {
      Config: { ARGB_8888: unknown }
      createBitmap(width: number, height: number, config: unknown): Bitmap
      createBitmap(
        source: Bitmap,
        x: number,
        y: number,
        width: number,
        height: number,
        matrix: Matrix,
        filter: boolean,
      ): Bitmap
    }
    Matrix: new () => Matrix
    Canvas: new (bitmap: Bitmap) => Canvas
    Paint: new (flags: number) => unknown
    Color: { WHITE: number }
  }
}
let sequence = 0
/** Keep original bytes until EXIF has been applied, including data URIs and downloads. */
async function androidSource(src: string) {
  let filename = src,
    temporary = false
  try {
    if (/^https?:\/\//i.test(src) || src.startsWith('data:image/')) {
      filename = path.join(
        knownFolders.temp().path,
        `mavis-crop-source-${Date.now()}-${++sequence}.img`,
      )
      temporary = true
      if (src.startsWith('data:image/')) {
        if (!src.slice(0, src.indexOf(',')).endsWith(';base64'))
          throw new TypeError('Native crop data URIs must be base64 encoded.')
        File.fromPath(filename).writeSync(
          android.util.Base64.decode(src.slice(src.indexOf(',') + 1), 0),
        )
      } else await Http.getFile(src, filename)
    } else if (src.startsWith('~/'))
      filename = path.join(knownFolders.currentApp().path, src.slice(2))
    const source = await loadSource(filename)
    let orientation = 1
    if (!filename.startsWith('res://')) {
      // Platform ExifInterface may not support metadata for every decodable format.
      try {
        orientation = new android.media.ExifInterface(filename).getAttributeInt('Orientation', 1)
      } catch {
        orientation =
          ({ 90: 6, 180: 3, 270: 8 } as Record<number, number>)[source.rotationAngle] ?? 1
      }
    }
    return { source, orientation }
  } finally {
    if (temporary && File.exists(filename)) await File.fromPath(filename).remove()
  }
}
export async function loadCropImage(src: string): Promise<CropSource> {
  const { source, orientation } = await androidSource(src)
  let bitmap = source.android as Bitmap
  if (source.width * source.height > 40000000)
    throw new RangeError('ImageCropper supports at most 40 megapixels.')
  if (orientation >= 2 && orientation <= 8) {
    const matrix = new android.graphics.Matrix()
    const rotation =
      ({ 3: 180, 4: 180, 5: 90, 6: 90, 7: 270, 8: 270 } as Record<number, number>)[orientation] ?? 0
    if (rotation) matrix.postRotate(rotation)
    if ([2, 4, 5, 7].includes(orientation)) matrix.postScale(-1, 1)
    bitmap = android.graphics.Bitmap.createBitmap(
      bitmap,
      0,
      0,
      source.width,
      source.height,
      matrix,
      true,
    )
  }
  const width = bitmap.getWidth(),
    height = bitmap.getHeight(),
    preview = new ImageSource(bitmap)
  let disposed = false
  return {
    width,
    height,
    preview,
    dispose() {
      disposed = true /* The view can retain the bitmap until its next layout; leave native reclamation to GC. */
    },
    async export(crop, options) {
      if (disposed) throw new Error('Image source has been released.')
      validateImageCrop({ width, height }, crop)
      const size = cropOutputSize(crop, options)
      const output = android.graphics.Bitmap.createBitmap(
        size.width,
        size.height,
        android.graphics.Bitmap.Config.ARGB_8888,
      )
      try {
        const canvas = new android.graphics.Canvas(output)
        if (options.mimeType === 'image/jpeg') canvas.drawColor(android.graphics.Color.WHITE)
        canvas.scale(size.width / crop.width, size.height / crop.height)
        canvas.translate(-crop.x, -crop.y)
        if (crop.rotation === 90) canvas.translate(height, 0)
        if (crop.rotation === 180) canvas.translate(width, height)
        if (crop.rotation === 270) canvas.translate(0, width)
        canvas.rotate(crop.rotation)
        canvas.drawBitmap(bitmap, 0, 0, new android.graphics.Paint(3))
        return await saveCrop(new ImageSource(output), size.width, size.height, options)
      } finally {
        output.recycle()
      }
    },
  }
}
