export type LinkTarget = '_self' | '_blank'
export type LinkNavigate = (href: string) => void | Promise<unknown>
export interface NavigationOptions {
  href?: string
  navigate?: LinkNavigate
  target?: LinkTarget
  rel?: string
}

/** App-owned navigation. Instances belong to one app (and one SSR request). */
export interface MavisNavigation {
  /** Releases host hooks when the application unmounts. */
  dispose?(): void
  resolve(href: string): string
  push: LinkNavigate
  replace: LinkNavigate
  back(): void | Promise<unknown>
}

/** The common string-route subset of Vue Router, Nuxt's router and vue-router-ns. */
export interface MavisRouter {
  resolve(href: string): { href?: string; fullPath?: string }
  push(href: string): unknown
  replace(href: string): unknown
  back(): unknown
}

export function isAppDestination(href: string): boolean {
  return !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) && !href.includes('\\')
}

/** Retains router guards/history and Web base/hash URLs; does not install a router. */
export function createRouterNavigation(router: MavisRouter): MavisNavigation {
  const internal = (href: string) => {
    const value = linkDestination(href)
    if (!isAppDestination(value))
      throw new TypeError('Router navigation requires an in-app destination.')
    return value
  }
  return {
    resolve(href) {
      const value = internal(href)
      const resolved = router.resolve(value)
      return linkDestination(resolved.href ?? resolved.fullPath ?? value)
    },
    async push(href) {
      return router.push(internal(href))
    },
    async replace(href) {
      return router.replace(internal(href))
    },
    async back() {
      return router.back()
    },
  }
}

/** An explicit callback takes precedence. External links keep the platform default. */
export function resolveNavigation(
  options: NavigationOptions,
  navigation?: MavisNavigation,
): NavigationOptions {
  if (options.href === undefined) return options
  const href = linkDestination(options.href)
  if (options.navigate || !navigation || !isAppDestination(href)) return { ...options, href }
  return {
    ...options,
    href: linkDestination(navigation.resolve(href)),
    navigate: () => navigation.push(href),
  }
}

/** Navigation belongs to the host; the shared contract only validates its destination. */
export function linkDestination(href: string): string {
  const value = href.trim()
  if (!value || /[\u0000-\u001f\u007f]/.test(value))
    throw new TypeError('MLink requires a nonempty destination without control characters.')
  if (/^(?:javascript|data|vbscript):/i.test(value))
    throw new TypeError('MLink does not accept executable destinations.')
  return value
}

export function linkRel(target: LinkTarget, rel = ''): string | undefined {
  const tokens = new Set(rel.split(/\s+/).filter(Boolean))
  if (target === '_blank') {
    tokens.delete('opener')
    tokens.add('noopener')
    tokens.add('noreferrer')
  }
  return [...tokens].join(' ') || undefined
}
