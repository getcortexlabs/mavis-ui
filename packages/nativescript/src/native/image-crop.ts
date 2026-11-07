import type { CropSource } from '@getcortexlabs/mavis-core'
export async function loadCropImage(_src: string): Promise<CropSource> {
  throw new Error('Image cropping requires an iOS or Android runtime.')
}
