import { createAppIconController, type AppIconChoice } from '@getcortexlabs/mavis-core'
import { nativeAppIcons } from './native/app-icons'

export interface NativeAppIcon extends AppIconChoice {
  /** null for the primary icon; alternate names must appear in CFBundleAlternateIcons. */
  iosName: string | null
  /** Fully qualified activity-alias name, including the primary launcher alias. */
  androidAlias: string
}
export interface AppIconsOptions {
  primary: string
  icons: readonly NativeAppIcon[]
}

/** Optional integration: importing Mavis components never changes launcher configuration. */
export function createAppIcons(options: AppIconsOptions) {
  const config = { primary: options.primary, icons: options.icons.map((icon) => ({ ...icon })) }
  return createAppIconController(config.icons, config.primary, nativeAppIcons(config))
}
export { AppIconError } from '@getcortexlabs/mavis-core'
export type { AppIconController, AppIconChoice } from '@getcortexlabs/mavis-core'
