import {
  createContext,
  createElement,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react'
import { registerElement, type NSVElement } from 'react-nativescript'
import type { View } from '@nativescript/core'
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

const themeContext = createContext<MavisThemeScope | undefined>(undefined)
export function MThemeProvider(props: { theme: MavisThemeScope; children?: ReactNode }) {
  return createElement(themeContext.Provider, { value: props.theme }, props.children)
}

export interface MavisComponentHandle {
  /** Native view escape hatch. Focus remains a separate portable intention. */
  readonly view: MavisNativeView | undefined
  focus(): void
  blur(): void
  focusAction(): void
}
type Props<N extends NativeComponentName> = NativeComponentProps<N> &
  ComponentCallbacks & {
    theme?: MavisThemeScope
    children?: ReactNode
  }
function component<N extends NativeComponentName>(name: N) {
  const tag = `mavis${name.slice(1)}`
  const layout = name === 'MRow' || name === 'MColumn' || name === 'MBox'
  // The renderer's declaration incorrectly types the resolver result as an instance.
  registerElement(tag, () => nativeComponents[name] as unknown as View, {
    viewFlags: layout ? 4 : 8,
  })
  const Component = forwardRef<MavisComponentHandle, Props<N>>((input, ref) => {
    const props = input as Props<N>
    const theme = useContext(themeContext)
    const element = useRef<NSVElement<MavisNativeView> | null>(null)
    useImperativeHandle(
      ref,
      () => ({
        get view() {
          return element.current?.nativeView
        },
        focus: () => element.current?.nativeView.focusInput(),
        blur: () => element.current?.nativeView.blurInput(),
        focusAction: () => element.current?.nativeView.focusInputAction(),
      }),
      [],
    )
    const { children, ...values } = props
    const nativeProps =
      name === 'MText' || name === 'MButton'
        ? { ...values, text: (values as { text?: string }).text ?? plainComponentText(children) }
        : values
    if (name === 'MInput' && children != null) throw new TypeError('MInput has no content slot')
    return createElement(
      tag,
      {
        ref: element,
        mavisTheme: props.theme ?? theme,
        mavisEvents: componentEvents(props),
        mavisProps: nativeProps,
      },
      layout ? children : undefined,
    )
  })
  Component.displayName = name
  return Component
}

export const MBox = component('MBox')
export const MRow = component('MRow')
export const MColumn = component('MColumn')
export const MText = component('MText')
export const MButton = component('MButton')
export const MInput = component('MInput')
