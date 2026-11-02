import { Utils } from '@nativescript/core'
import { AppIconError, type AppIconAdapter } from '@getcortexlabs/mavis-core'
import type { AppIconsOptions } from '../app-icons.js'

declare const UIApplication: {
  sharedApplication: {
    supportsAlternateIcons: boolean
    alternateIconName: string | null
    setAlternateIconNameCompletionHandler(
      name: string | null,
      complete: (error: { localizedDescription: string } | null) => void,
    ): void
  }
}
interface Dictionary {
  objectForKey(key: string): Dictionary | undefined
}
declare const NSBundle: {
  mainBundle: { objectForInfoDictionaryKey(key: string): Dictionary | undefined }
}

export function nativeAppIcons(options: AppIconsOptions): AppIconAdapter {
  const names = new Set<string | null>()
  for (const icon of options.icons) {
    if (
      (icon.iosName !== null && typeof icon.iosName !== 'string') ||
      (icon.id === options.primary) !== (icon.iosName === null) ||
      names.has(icon.iosName) ||
      icon.iosName === ''
    )
      throw new AppIconError(
        'configuration',
        'iOS needs one primary icon and unique alternate names.',
      )
    names.add(icon.iosName)
  }
  const application = () => UIApplication.sharedApplication
  return {
    supported: () => Boolean(application().supportsAlternateIcons),
    current: () =>
      options.icons.find((icon) => icon.iosName === (application().alternateIconName ?? null))?.id,
    select(id) {
      const icon = options.icons.find((choice) => choice.id === id)!
      if (icon.iosName !== null) {
        const declared = ['CFBundleIcons', 'CFBundleIcons~ipad'].some((key) =>
          NSBundle.mainBundle
            .objectForInfoDictionaryKey(key)
            ?.objectForKey('CFBundleAlternateIcons')
            ?.objectForKey(icon.iosName!),
        )
        if (!declared)
          return Promise.reject(
            new AppIconError('configuration', `Missing bundled alternate icon: ${icon.iosName}`),
          )
      }
      return new Promise((resolve, reject) => {
        Utils.executeOnMainThread(() => {
          try {
            application().setAlternateIconNameCompletionHandler(icon.iosName, (error) => {
              // UIKit may invoke completion away from its main queue.
              Utils.executeOnMainThread(() =>
                error
                  ? reject(new AppIconError('platform', error.localizedDescription))
                  : resolve(),
              )
            })
          } catch (cause) {
            reject(new AppIconError('platform', 'iOS could not change the app icon.', { cause }))
          }
        })
      })
    },
  }
}
