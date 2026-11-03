import {
  defineComponent,
  inject,
  type InjectionKey,
  type PropType,
  type SlotsType,
} from '@vue/runtime-core'

export type MavisPlatform = 'web' | 'ios' | 'android'
export type MavisPlatformTarget = MavisPlatform | 'native'
export type MavisPlatformContext = Readonly<{
  platform: MavisPlatform
  isWeb: boolean
  isNative: boolean
  isIOS: boolean
  isAndroid: boolean
}>

/** @internal Supplied by the renderer, including services-only installation. */
export const platformKey: InjectionKey<MavisPlatformContext> = Symbol('mavis-platform')

/** @internal No browser globals, viewport detection or mutable process-wide state. */
export function createPlatformContext(platform: MavisPlatform): MavisPlatformContext {
  if (!['web', 'ios', 'android'].includes(platform)) throw new RangeError('Unknown Mavis platform.')
  return Object.freeze({
    platform,
    isWeb: platform === 'web',
    isNative: platform !== 'web',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  })
}

export function useMavisPlatform(): MavisPlatformContext {
  const platform = inject(platformKey, undefined)
  if (!platform)
    throw new Error(
      'Install createMavis() or createMavisServices() in this app before using Mavis platform APIs.',
    )
  return platform
}

export const platformProps = {
  only: {
    type: [String, Array] as PropType<MavisPlatformTarget | readonly MavisPlatformTarget[]>,
    required: true as const,
  },
}

/** Only the selected slot is evaluated; excluded children never run setup or mount. */
export const MPlatform = defineComponent({
  name: 'MPlatform',
  inheritAttrs: false,
  props: platformProps,
  slots: Object as SlotsType<{ default: () => unknown; fallback: () => unknown }>,
  setup(props, { slots }) {
    const platform = useMavisPlatform()
    return () => {
      const targets = Array.isArray(props.only) ? props.only : [props.only]
      if (
        !targets.length ||
        targets.some((target) => !['web', 'native', 'ios', 'android'].includes(target))
      )
        throw new RangeError(
          'MPlatform.only requires web, native, ios, android, or a non-empty array of these targets.',
        )
      const matches = targets.some(
        (target) => target === platform.platform || (target === 'native' && platform.isNative),
      )
      return matches ? slots.default?.() : slots.fallback?.()
    }
  },
})
