import { inject, type InjectionKey } from '@vue/runtime-core'
import { resolveNavigation, type MavisNavigation, type NavigationOptions } from '../link.js'

export const navigationKey: InjectionKey<MavisNavigation | undefined> = Symbol('mavis-navigation')

export function useMavisNavigation(): MavisNavigation {
  const navigation = inject(navigationKey, undefined)
  if (!navigation) throw new Error('Provide navigation when installing Mavis in this app.')
  return navigation
}

/** Renderer helper; read reactive component props at render/activation time. */
export function useNavigationOptions(options: NavigationOptions) {
  const navigation = inject(navigationKey, undefined)
  return () => resolveNavigation(options, navigation)
}
