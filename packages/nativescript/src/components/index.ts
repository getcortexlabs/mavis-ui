import { GridLayout, View, type LayoutBase, type Label, type Button } from '@nativescript/core'
import { MavisFlexLayout } from '../native/flex-layout'
import { MavisBox } from '../native/box'
import { MavisButton } from '../native/button'
import { MavisLabel } from '../native/label'
import { NativeComponentController } from './controller.js'
import { createMavisTheme, MavisThemeScope } from './theme.js'
import type {
  NativeComponentName,
  NativeComponentProps,
  NativeComponentEvents,
  NativeComponentOptions,
} from './contracts.js'
import type { MavisTheme } from '@getcortexlabs/mavis-core'

export * from './contracts.js'
export { componentEvents, plainComponentText, type ComponentCallbacks } from './bindings.js'
export { createMavisTheme, MavisThemeScope } from './theme.js'

/** Framework bridges assign an immutable props snapshot; native view attributes stay separate. */
export interface MavisNativeView extends View {
  mavisProps: NativeComponentProps<NativeComponentName>
  mavisTheme: MavisThemeScope | undefined
  mavisEvents: NativeComponentEvents
  mavisContentText: string
  disposeMavis(): void
  focusInput(): void
  blurInput(): void
  focusInputAction(): void
}

export type NativeViewFor<N extends NativeComponentName> = MavisNativeView &
  (N extends 'MBox' | 'MRow' | 'MColumn' | 'MInput'
    ? LayoutBase
    : N extends 'MText'
      ? Label
      : Button)

function componentClass(
  name: NativeComponentName,
  Base: new () => View,
): new () => MavisNativeView {
  return class extends Base {
    private mavisController = new NativeComponentController(this, name)
    set mavisProps(props: NativeComponentProps<NativeComponentName>) {
      this.mavisController.setProps(props)
    }
    get mavisProps() {
      return this.mavisController.props as NativeComponentProps<NativeComponentName>
    }
    set mavisTheme(scope: MavisThemeScope | undefined) {
      this.mavisController.setTheme(scope)
    }
    get mavisTheme(): MavisThemeScope {
      return this.mavisController.themeScope
    }
    set mavisEvents(events: NativeComponentEvents) {
      this.mavisController.events = events ?? {}
    }
    get mavisEvents() {
      return this.mavisController.events
    }
    set mavisContentText(text: string) {
      this.mavisController.setContentText(text)
    }
    disposeMavis() {
      this.mavisController.dispose()
    }
    focusInput() {
      this.mavisController.focus()
    }
    blurInput() {
      this.mavisController.blur()
    }
    focusInputAction() {
      this.mavisController.focusAction()
    }
  }
}

export const nativeComponents = {
  MBox: componentClass('MBox', MavisBox),
  MRow: componentClass('MRow', MavisFlexLayout),
  MColumn: componentClass('MColumn', MavisFlexLayout),
  MText: componentClass('MText', MavisLabel),
  MButton: componentClass('MButton', MavisButton),
  MInput: componentClass('MInput', GridLayout),
} as const

/** Direct JS/TS integration. The owner decides whether to accept controlled value requests. */
export function createNativeComponent<N extends NativeComponentName>(
  name: N,
  props: NativeComponentProps<N>,
  options: NativeComponentOptions = {},
) {
  const view = new nativeComponents[name]() as NativeViewFor<N>
  view.mavisTheme = options.theme
  view.mavisEvents = options.events ?? {}
  view.mavisProps = props
  return {
    view,
    update(next: NativeComponentProps<N>) {
      view.mavisProps = next
    },
    setEvents(events: NativeComponentEvents) {
      view.mavisEvents = events
    },
    focus() {
      view.focusInput()
    },
    blur() {
      view.blurInput()
    },
    focusAction() {
      view.focusInputAction()
    },
    dispose() {
      view.disposeMavis()
    },
  }
}

export function createMavis(options: { theme?: MavisTheme } = {}) {
  const scope = createMavisTheme(options.theme)
  return {
    theme: scope,
    setTheme: (theme: MavisTheme) => scope.setTheme(theme),
    create<N extends NativeComponentName>(
      name: N,
      props: NativeComponentProps<N>,
      events?: NativeComponentEvents,
    ) {
      return createNativeComponent(name, props, { theme: scope, events })
    },
  }
}
