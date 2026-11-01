import { computed, defineComponent, provide, type PropType } from '@vue/runtime-core'
import type { MavisTheme } from '../theme/types.js'
import { themeKey, useMavisTheme, type AppearanceMode, type MavisThemeContext } from './theme.js'

export const themeProviderProps = {
  theme: { type: Object as PropType<MavisTheme>, default: undefined },
  darkTheme: { type: Object as PropType<MavisTheme>, default: undefined },
  appearance: { type: String as PropType<AppearanceMode>, default: undefined },
}

/** Renderless, controlled scope. Device appearance is shared with the application subscription. */
export const MThemeProvider = defineComponent({
  name: 'MThemeProvider',
  inheritAttrs: false,
  props: themeProviderProps,
  emits: {
    'update:theme': (_theme: MavisTheme) => true,
    'update:appearance': (_appearance: AppearanceMode) => true,
  },
  setup(props, { slots, emit }) {
    const parent = useMavisTheme()
    const themes = computed(() => {
      if (props.darkTheme && props.darkTheme.appearance !== 'dark')
        throw new RangeError('darkTheme must have dark appearance')
      return {
        ...parent.themes.value,
        ...(props.theme ? { [props.theme.appearance]: props.theme } : {}),
        ...(props.darkTheme ? { dark: props.darkTheme } : {}),
      }
    })
    const appearance = computed(() => {
      const mode = props.appearance ?? props.theme?.appearance ?? parent.appearance.value
      if (!['system', 'light', 'dark'].includes(mode))
        throw new RangeError(`Unknown appearance mode: ${mode}`)
      return mode
    })
    const theme = computed(() => {
      const wanted =
        appearance.value === 'system'
          ? (parent.systemAppearance.value ??
            props.theme?.appearance ??
            parent.theme.value.appearance)
          : appearance.value
      return (
        themes.value[wanted] ??
        themes.value[wanted === 'dark' ? 'light' : 'dark'] ??
        parent.theme.value
      )
    })
    const context: MavisThemeContext = {
      theme,
      themes,
      appearance,
      systemAppearance: parent.systemAppearance,
      setTheme(next) {
        emit('update:theme', next)
        emit('update:appearance', next.appearance)
      },
      setAppearance(mode) {
        if (!['system', 'light', 'dark'].includes(mode))
          throw new RangeError(`Unknown appearance mode: ${mode}`)
        emit('update:appearance', mode)
      },
      // No listener is owned by a scope; Vue disposes its computed effects on unmount.
      dispose() {},
    }
    provide(themeKey, context)
    return () => {
      // Validate scopes even when their slot currently has no Mavis children.
      void theme.value
      return slots.default?.()
    }
  },
})
