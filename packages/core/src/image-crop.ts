export type CropRotation = 0 | 90 | 180 | 270
/** Coordinates in the decoded image after applying the clockwise quarter rotation. */
export interface ImageCrop {
  x: number
  y: number
  width: number
  height: number
  rotation: CropRotation
}
export interface CropImage {
  width: number
  height: number
}
export interface CropExportOptions {
  mimeType: 'image/png' | 'image/jpeg'
  quality: number
  width?: number
}
/** Web returns a data URI; NativeScript returns a temporary file owned by the caller. */
export interface CropExport {
  uri: string
  width: number
  height: number
  mimeType: 'image/png' | 'image/jpeg'
  dispose(): Promise<void>
}
export interface CropSource extends CropImage {
  readonly preview: unknown
  export(crop: ImageCrop, options: CropExportOptions): Promise<CropExport>
  dispose(): void
}
export function rotatedImage(image: CropImage, rotation: CropRotation) {
  if (
    ![0, 90, 180, 270].includes(rotation) ||
    !Number.isFinite(image.width) ||
    !Number.isFinite(image.height) ||
    image.width <= 0 ||
    image.height <= 0
  )
    throw new RangeError('Crop source dimensions and quarter rotation must be valid.')
  return rotation === 90 || rotation === 270 ? { width: image.height, height: image.width } : image
}
export function fitImageCrop(
  image: CropImage,
  aspectRatio: number,
  rotation: CropRotation = 0,
): ImageCrop {
  const size = rotatedImage(image, rotation)
  if (!Number.isFinite(aspectRatio) || aspectRatio < 0.1 || aspectRatio > 10)
    throw new RangeError('Crop aspectRatio must be between 0.1 and 10.')
  const width = Math.min(size.width, size.height * aspectRatio),
    height = width / aspectRatio
  return { x: (size.width - width) / 2, y: (size.height - height) / 2, width, height, rotation }
}
export function validateImageCrop(image: CropImage, crop: ImageCrop, aspectRatio?: number) {
  const size = rotatedImage(image, crop.rotation)
  if (
    ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width < 1 ||
    crop.height < 1 ||
    crop.x + crop.width > size.width + 0.001 ||
    crop.y + crop.height > size.height + 0.001 ||
    (aspectRatio !== undefined && Math.abs(crop.width / crop.height - aspectRatio) > 0.001)
  )
    throw new RangeError('Crop must stay inside the rotated source and respect the aspect ratio.')
  return crop
}
export function moveImageCrop(
  image: CropImage,
  crop: ImageCrop,
  dx: number,
  dy: number,
): ImageCrop {
  validateImageCrop(image, crop)
  if (![dx, dy].every(Number.isFinite)) throw new RangeError('Crop offsets must be finite.')
  const size = rotatedImage(image, crop.rotation)
  return {
    ...crop,
    x: Math.max(0, Math.min(size.width - crop.width, crop.x + dx)),
    y: Math.max(0, Math.min(size.height - crop.height, crop.y + dy)),
  }
}
export function zoomImageCrop(image: CropImage, crop: ImageCrop, zoom: number): ImageCrop {
  validateImageCrop(image, crop)
  if (!Number.isFinite(zoom) || zoom < 1 || zoom > 8)
    throw new RangeError('Crop zoom must be between 1 and 8.')
  const fit = fitImageCrop(image, crop.width / crop.height, crop.rotation),
    width = fit.width / Math.min(zoom, fit.width, fit.height),
    height = fit.height / Math.min(zoom, fit.width, fit.height)
  return moveImageCrop(
    image,
    { ...crop, x: 0, y: 0, width, height },
    crop.x + crop.width / 2 - width / 2,
    crop.y + crop.height / 2 - height / 2,
  )
}
export function cropOutputSize(crop: ImageCrop, options: CropExportOptions) {
  if (
    !['image/png', 'image/jpeg'].includes(options.mimeType) ||
    !Number.isFinite(options.quality) ||
    options.quality < 0 ||
    options.quality > 1
  )
    throw new RangeError('Invalid crop output format or quality.')
  const width = options.width ?? Math.round(crop.width),
    height = Math.round((width * crop.height) / crop.width)
  if (!Number.isInteger(width) || width < 1 || width > 4096 || height < 1 || height > 4096)
    throw new RangeError('Crop output dimensions must be between 1 and 4096 pixels.')
  return { width, height }
}
/** Original-image center and scale within the crop viewport; rotation is about the center. */
export function cropPresentation(image: CropImage, crop: ImageCrop, viewportWidth: number) {
  validateImageCrop(image, crop)
  const size = rotatedImage(image, crop.rotation),
    scale = viewportWidth / crop.width
  return {
    width: image.width * scale,
    height: image.height * scale,
    x: (size.width / 2 - crop.x - image.width / 2) * scale,
    y: (size.height / 2 - crop.y - image.height / 2) * scale,
    rotation: crop.rotation,
  }
}
