import { createContext, useContext, createComponent, onCleanup, type Element } from 'solid-js'
import { createElement, spread } from '@nativescript-community/solid-js'
import { registerElement } from 'dominative'
import { componentContracts } from '@getcortexlabs/mavis-core'
import {
  nativeComponents,
  type NativeComponentName,
  type NativeComponentProps,
  type MavisNativeView,
  type MavisThemeScope,
} from '../components/index.js'
import {
  componentEvents,
  plainComponentText,
  type ComponentCallbacks,
} from '../components/bindings.js'

export { createMavisTheme } from '../components/theme.js'
export type {
  MBoxProps,
  MRowProps,
  MColumnProps,
  MTextProps,
  MButtonProps,
  MInputProps,
} from '../components/contracts.js'

const themeContext = createContext<(() => MavisThemeScope) | null>(null)
export function MThemeProvider(props: { theme: MavisThemeScope; children?: Element }) {
  return createComponent(themeContext, {
    value: () => props.theme,
    get children() {
      return props.children
    },
  })
}

type Props<N extends NativeComponentName> = NativeComponentProps<N> &
  ComponentCallbacks & {
    theme?: MavisThemeScope
    children?: Element
    ref?: (view: MavisNativeView) => void
  }

function component<N extends NativeComponentName>(name: N) {
  const tag = `mavis${name.slice(1)}`
  registerElement(tag, nativeComponents[name])
  const layout = name === 'MBox' || name === 'MRow' || name === 'MColumn'
  return (props: Props<N>): Element => {
    const inherited = useContext(themeContext)
    // DOMiNATIVE augments the native view itself; this is not an HTML element.
    const view: MavisNativeView = createElement(tag)
    spread(view, {
      get mavisTheme() {
        return props.theme ?? inherited?.()
      },
      get mavisEvents() {
        return componentEvents(props)
      },
      get mavisProps() {
        const values = Object.fromEntries(
          Object.keys(componentContracts[name].props).map((key) => [key, Reflect.get(props, key)]),
        )
        if (name === 'MInput' && props.children != null)
          throw new TypeError('MInput has no content slot')
        return name === 'MText' || name === 'MButton'
          ? {
              ...values,
              text: (values as { text?: string }).text ?? plainComponentText(props.children),
            }
          : values
      },
      get children() {
        return layout ? props.children : undefined
      },
    })
    props.ref?.(view)
    onCleanup(() => view.disposeMavis())
    return view as unknown as Element
  }
}

export const MBox = component('MBox')
export const MRow = component('MRow')
export const MColumn = component('MColumn')
export const MText = component('MText')
export const MButton = component('MButton')
export const MInput = component('MInput')
