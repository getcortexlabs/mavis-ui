import {
  createRouterNavigation,
  defineNavigationTransition,
  type MavisRouter,
  type NavigationTransition,
} from '@getcortexlabs/mavis-core'

export interface NativeNavigationRouter extends MavisRouter {
  push(
    href: string,
    options?: { animated?: boolean; transition?: { name: string; duration: number } },
  ): unknown
  replace(
    href: string,
    options?: { animated?: boolean; transition?: { name: string; duration: number } },
  ): unknown
  back(options?: { animated?: boolean }): unknown
}

/** vue-router-ns owns native transitions, reduced motion, interactive back and focus. */
export function createMavisNavigation(
  router: NativeNavigationRouter,
  options: { transition?: NavigationTransition } = {},
) {
  const policy = defineNavigationTransition(options.transition)
  const native =
    policy.name === 'none' || policy.duration === 0
      ? { animated: false }
      : { transition: { name: policy.name, duration: policy.duration } }
  return createRouterNavigation({
    resolve: (href) => router.resolve(href),
    push: (href) => router.push(href, native),
    replace: (href) => router.replace(href, native),
    back: () =>
      router.back(
        policy.name === 'none' || policy.duration === 0 ? { animated: false } : undefined,
      ),
  })
}
