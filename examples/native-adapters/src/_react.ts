import { Application, type View } from '@nativescript/core'
import { createElement as h, useState, useRef } from 'react'
import { NSVRoot, render, unmountComponentAtNode } from 'react-nativescript'
import {
  MColumn,
  MRow,
  MBox,
  MText,
  MButton,
  MInput,
  MThemeProvider,
  type MavisComponentHandle,
} from '@getcortexlabs/mavis/react'
import { bridge, initial, theme, isolatedTheme, surface } from './_model'

function Catalog() {
  const [state, setState] = useState(initial)
  const input = useRef<MavisComponentHandle>(null)
  bridge.read = () => state
  bridge.update = (patch) => setState((value) => ({ ...value, ...patch }))
  bridge.focus = () => input.current?.focus()
  return h(
    'page',
    { actionBarHidden: true },
    h(
      MThemeProvider,
      { theme },
      h(
        MColumn,
        { id: 'catalog', gap: 'md', padding: 'lg' },
        h(MText, { id: 'heading', variant: 'title' }, 'Direct NativeScript / React'),
        h(
          MRow,
          { id: 'row', gap: 'sm' },
          h(
            MButton,
            {
              id: 'action',
              disabled: state.disabled,
              loading: state.loading,
              onClick: () => bridge.update?.({ count: state.count + 1 }),
            },
            `Count ${state.count}`,
          ),
        ),
        h(MInput, {
          id: 'editor',
          label: 'Name',
          modelValue: state.value,
          disabled: state.disabled,
          onValueChange: (value) => bridge.update?.({ value }),
          ref: input,
        }),
        state.visible
          ? h(MBox, {
              id: 'motion',
              width: 100,
              height: 30,
              backgroundColor: '#4f46e5',
              motionSurface: surface,
            })
          : null,
        h(MText, { id: 'isolated', theme: isolatedTheme, text: 'Independent theme' }),
      ),
    ),
  )
}
export function start() {
  Application.run({
    create: () => {
      const root = new NSVRoot()
      render(h(Catalog), root, undefined, 'mavis-adapters')
      bridge.dispose = () => unmountComponentAtNode('mavis-adapters')
      return root.baseRef!.nativeView as View
    },
  })
}
