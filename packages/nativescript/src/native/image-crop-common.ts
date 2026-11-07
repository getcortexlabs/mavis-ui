import { ImageSource, File, knownFolders, path } from '@nativescript/core'
import type { CropExport, CropExportOptions } from '@getcortexlabs/mavis-core'
export async function loadSource(src: string) {
  const source = /^https?:\/\//i.test(src)
    ? await ImageSource.fromUrl(src)
    : src.startsWith('data:image/')
      ? await ImageSource.fromBase64(src.slice(src.indexOf(',') + 1))
      : ImageSource.fromFileOrResourceSync(src)
  if (!source || !Number.isFinite(source.width) || source.width <= 0 || source.height <= 0)
    throw new Error('Could not decode the crop image.')
  return source
}
let serial = 0
export async function saveCrop(
  source: ImageSource,
  width: number,
  height: number,
  options: CropExportOptions,
): Promise<CropExport> {
  const uri = path.join(
    knownFolders.temp().path,
    `mavis-crop-${Date.now()}-${++serial}.${options.mimeType === 'image/png' ? 'png' : 'jpg'}`,
  )
  let disposal: Promise<void> | undefined
  function dispose() {
    return (disposal ??= File.exists(uri) ? File.fromPath(uri).remove() : Promise.resolve())
  }
  try {
    const saved = await source.saveToFileAsync(
      uri,
      options.mimeType === 'image/png' ? 'png' : 'jpeg',
      Math.round(options.quality * 100),
    )
    if (!saved) throw new Error('Could not save the cropped image.')
  } catch (error) {
    await dispose()
    throw error
  }
  return {
    uri,
    width,
    height,
    mimeType: options.mimeType,
    dispose,
  }
}
