import { linkDestination, linkRel } from '@getcortexlabs/mavis-core'
import type { NavigationOptions } from '@getcortexlabs/mavis-core'

/** One real anchor; the application can supply a RouterLink custom-slot navigate callback. */
export function navigationAttrs(
  options: NavigationOptions,
  disabled: boolean,
  activate: () => void,
  fail: (error: unknown) => void,
) {
  const href = linkDestination(options.href!)
  return {
    href: disabled ? undefined : href,
    role: 'link',
    target: options.target,
    rel: linkRel(options.target ?? '_self', options.rel),
    tabindex: disabled ? -1 : undefined,
    'aria-disabled': disabled || undefined,
    onClick(event: MouseEvent) {
      if (disabled) {
        event.preventDefault()
        return
      }
      if (event.defaultPrevented) return
      activate()
      if (
        !options.navigate ||
        (options.target && options.target !== '_self') ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      event.preventDefault()
      try {
        Promise.resolve(options.navigate(href)).catch(fail)
      } catch (error) {
        fail(error)
      }
    },
  }
}
