import { Application, Page, GridLayout, type LayoutBase } from '@nativescript/core'
import { createNativeComponent } from '@getcortexlabs/mavis/native'
import { bridge, initial, theme, isolatedTheme, surface, type State } from './model'

export function start() {
  Application.run({
    create: () => {
      let state: State = { ...initial }
      const all: Array<{ dispose(): void }> = []
      const create: typeof createNativeComponent = (name, props, options = {}) => {
        const control = createNativeComponent(name, props, { theme, ...options })
        all.push(control)
        return control
      }
      const root = create('MColumn', {
        id: 'catalog',
        gap: 'md',
        padding: 'lg',
        height: '100%',
        backgroundColor: theme.theme.colors.background,
      })
      const heading = create('MText', {
        id: 'heading',
        text: '__MAVIS_NAME__',
        variant: 'title',
      })
      const row = create('MRow', { id: 'row', gap: 'sm' })
      const button = create(
        'MButton',
        { id: 'action', text: 'Count 0' },
        { events: { activate: () => update({ count: state.count + 1 }) } },
      )
      const input = create(
        'MInput',
        { id: 'editor', label: 'Name', modelValue: state.value },
        { events: { valueChange: (value) => update({ value }) } },
      )
      const box = create('MBox', {
        id: 'motion',
        width: 100,
        height: 30,
        backgroundColor: '#4f46e5',
        motionSurface: surface,
      })
      const separate = create(
        'MText',
        { id: 'isolated', text: 'Independent theme' },
        { theme: isolatedTheme },
      )
      const separateBox = create('MBox', {
        padding: 'md',
        radius: 'md',
        backgroundColor: isolatedTheme.theme.colors.background,
      })
      separateBox.view.addChild(separate.view)
      const offTheme = theme.subscribe(() =>
        root.update({
          id: 'catalog',
          gap: 'md',
          padding: 'lg',
          height: '100%',
          backgroundColor: theme.theme.colors.background,
        }),
      )
      ;(row.view as LayoutBase).addChild(button.view)
      for (const control of [heading, row, input, box, separateBox])
        (root.view as LayoutBase).addChild(control.view)
      function update(patch: Partial<State>) {
        const before = state
        state = { ...state, ...patch }
        button.update({
          id: 'action',
          text: `Count ${state.count}`,
          disabled: state.disabled,
          loading: state.loading,
        })
        input.update({
          id: 'editor',
          label: 'Name',
          modelValue: state.value,
          disabled: state.disabled,
        })
        if (before.visible !== state.visible) {
          if (state.visible) (root.view as LayoutBase).addChild(box.view)
          else (root.view as LayoutBase).removeChild(box.view)
        }
      }
      const page = new Page()
      page.actionBarHidden = true
      page.content = root.view
      bridge.read = () => state
      bridge.update = update
      bridge.focus = input.focus
      bridge.dispose = () => {
        page.content = new GridLayout()
        offTheme()
        all.forEach((control) => control.dispose())
      }
      return page
    },
  })
}
