import { Utils } from '@nativescript/core'
import { linkDestination, type NavigationOptions } from '@getcortexlabs/mavis-core'

export function nativeDestination(options: NavigationOptions) {
  const href = linkDestination(options.href!)
  if (!options.navigate && !/^[a-z][a-z\d+.-]*:/i.test(href))
    throw new TypeError('Native navigation needs a navigate handler for in-app destinations.')
  return href
}

export async function navigateNative(options: NavigationOptions) {
  const href = nativeDestination(options)
  if (options.navigate) await options.navigate(href)
  else if (!(await Utils.openUrl(href))) throw new Error(`The system could not open ${href}.`)
}
