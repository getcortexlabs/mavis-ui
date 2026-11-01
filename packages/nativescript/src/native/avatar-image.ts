import { ImageSource, Utils } from '@nativescript/core'

/** Use Core decoding without leaving rejected local-image promises unhandled. */
export function loadAvatarImage(src: string): Promise<ImageSource | null> {
  if (Utils.isDataURI(src)) return ImageSource.fromBase64(src.slice(src.indexOf(',') + 1))
  if (src.startsWith('res://')) return ImageSource.fromResource(src.slice(6))
  if (Utils.isFileOrResourcePath(src)) return ImageSource.fromFile(src)
  return ImageSource.fromUrl(src)
}
