import { Application } from '@nativescript/core'
import { createSignal, createComponent, Show } from 'solid-js'
import { createElement, render } from '@nativescript-community/solid-js'
import {
  MColumn,
  MRow,
  MBox,
  MText,
  MButton,
  MInput,
  MThemeProvider,
} from '@getcortexlabs/mavis/solid'
import { bridge, initial, theme, isolatedTheme, surface } from './_model'

export function start() {
  Application.run({
    create: () => {
      const page = createElement('page', { actionBarHidden: true })
      const dispose = render(() => {
        const [state, setState] = createSignal(initial)
        bridge.read = state
        bridge.update = (patch) => setState((value) => ({ ...value, ...patch }))
        return createComponent(MThemeProvider, {
          theme,
          get children() {
            return createComponent(MColumn, {
              id: 'catalog',
              gap: 'md',
              padding: 'lg',
              get children() {
                return [
                  createComponent(MText, {
                    id: 'heading',
                    text: 'Direct NativeScript / Solid',
                    variant: 'title',
                  }),
                  createComponent(MRow, {
                    id: 'row',
                    gap: 'sm',
                    get children() {
                      return createComponent(MButton, {
                        id: 'action',
                        get text() {
                          return `Count ${state().count}`
                        },
                        get disabled() {
                          return state().disabled
                        },
                        get loading() {
                          return state().loading
                        },
                        onClick: () => bridge.update?.({ count: state().count + 1 }),
                      })
                    },
                  }),
                  createComponent(MInput, {
                    id: 'editor',
                    label: 'Name',
                    get modelValue() {
                      return state().value
                    },
                    get disabled() {
                      return state().disabled
                    },
                    onValueChange: (value) => bridge.update?.({ value }),
                    ref: (view) => {
                      bridge.focus = () => view.focusInput()
                    },
                  }),
                  createComponent(Show, {
                    get when() {
                      return state().visible
                    },
                    children: () =>
                      createComponent(MBox, {
                        id: 'motion',
                        width: 100,
                        height: 30,
                        backgroundColor: '#4f46e5',
                        motionSurface: surface,
                      }),
                  }),
                  createComponent(MText, {
                    id: 'isolated',
                    text: 'Independent theme',
                    theme: isolatedTheme,
                  }),
                ]
              },
            })
          },
        })
      }, page)
      bridge.dispose = dispose
      return page
    },
  })
}
