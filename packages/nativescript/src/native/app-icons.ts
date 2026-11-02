import type { AppIconAdapter } from '@getcortexlabs/mavis-core'
import { AppIconError } from '@getcortexlabs/mavis-core'
import type { AppIconsOptions } from '../app-icons.js'

export function nativeAppIcons(_options: AppIconsOptions): AppIconAdapter {
  return {
    supported: () => false,
    current: () => undefined,
    select: () =>
      Promise.reject(new AppIconError('unsupported', 'App icons require iOS or Android.')),
  }
}
