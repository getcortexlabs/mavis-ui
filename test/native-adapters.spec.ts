import { describe, expect, it, vi } from 'vitest'

// This fake verifies state/ownership, not SDK layout or actual Jolt animation.
const native = vi.hoisted(() => {
  class View {
    style: Record<string, unknown> = {}
    children: View[] = []
    parent?: View
    listeners = new Map<string, Set<(event: any) => void>>()
    private value = ''
    focus = vi.fn(() => {
      this.emit('focus')
      return true
    })
    dismissSoftInput = vi.fn(() => this.emit('blur'))
    set text(value: string) {
      this.value = value
      this.emit('textChange', { value })
    }
    get text() {
      return this.value
    }
    on(name: string, listener: (event: any) => void) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set())
      this.listeners.get(name)!.add(listener)
    }
    off(name: string, listener: (event: any) => void) {
      this.listeners.get(name)?.delete(listener)
    }
    emit(eventName: string, data = {}) {
      for (const fn of this.listeners.get(eventName) ?? []) fn({ eventName, object: this, ...data })
    }
    addChild(child: View) {
      this.children.push(child)
      child.parent = this
    }
    removeChild(child: View) {
      this.children.splice(this.children.indexOf(child), 1)
      child.parent = undefined
    }
    set(name: string, value: unknown) {
      ;(this as any)[name] = value
    }
    static setRow() {}
  }
  class TextField extends View {}
  class TextView extends View {}
  return {
    View,
    GridLayout: View,
    FlexboxLayout: View,
    Button: View,
    Label: View,
    TextField,
    TextView,
    FormattedString: class {
      spans: unknown[] = []
    },
    Span: class {},
    isAndroid: false,
    Utils: { openUrl: vi.fn(() => true) },
  }
})
vi.mock('@nativescript/core', () => native)
const resources = vi.hoisted(() => ({ press: 0, region: 0, surface: 0 }))
vi.mock('../packages/nativescript/src/native/press.js', () => ({
  attachPressFeedback: () => {
    resources.press++
    return Object.assign(
      () => {
        resources.press--
      },
      { update() {} },
    )
  },
}))
vi.mock('../packages/nativescript/src/native/motion-binding.js', () => ({
  createNativeMotionSurface: () => {
    let loaded = false
    return {
      allowsActivation: () => true,
      refresh() {},
      refreshEnabled() {},
      refreshPerspective() {},
      onLoaded() {
        if (!loaded) {
          loaded = true
          resources.surface++
        }
      },
      onUnloaded() {
        if (loaded) {
          loaded = false
          resources.surface--
        }
      },
    }
  },
}))
vi.mock('../packages/nativescript/src/native/motion-region.js', () => ({
  attachNativeMotionRegion: () => {
    resources.region++
    return () => {
      resources.region--
    }
  },
}))
vi.mock('../packages/nativescript/src/native/input-action', () => ({
  keepEditingOn: () => () => {},
}))

import {
  createMavis,
  createNativeComponent,
  createMavisTheme,
  type MavisNativeView,
} from '../packages/nativescript/src/components/index.js'
import { mavis, midnight } from '@getcortexlabs/mavis-core'

const fake = (view: unknown) => view as InstanceType<typeof native.View>
const load = (view: MavisNativeView) => fake(view).emit('loaded')
const unload = (view: MavisNativeView) => fake(view).emit('unloaded')
const editor = (view: MavisNativeView) =>
  fake(view).children.find(
    (child) => child instanceof native.TextField || child instanceof native.TextView,
  )!

describe('direct NativeScript foundations', () => {
  it('keeps edits controlled, preserves editor identity and emits submit once', async () => {
    const changed = vi.fn(),
      submitted = vi.fn()
    const input = createNativeComponent(
      'MInput',
      { label: 'Name', modelValue: 'Ada' },
      { events: { valueChange: changed, submit: submitted } },
    )
    const field = editor(input.view)
    load(input.view)
    field.text = 'Grace'
    expect(changed).toHaveBeenCalledExactlyOnceWith('Grace')
    await Promise.resolve()
    expect(field.text).toBe('Ada')
    input.setEvents({
      valueChange: (modelValue) => input.update({ label: 'Name', modelValue }),
      submit: submitted,
    })
    field.text = 'Lin'
    await Promise.resolve()
    expect(field.text).toBe('Lin')
    expect(editor(input.view)).toBe(field)
    field.emit('returnPress')
    expect(submitted).toHaveBeenCalledExactlyOnceWith('Lin')
    input.update({ label: 'Name', modelValue: 'Lin', readonly: true })
    input.focus()
    expect(field.focus).not.toHaveBeenCalled()
    field.emit('returnPress')
    expect(submitted).toHaveBeenCalledTimes(1)
    input.dispose()
    expect([...field.listeners.values()].every((set) => set.size === 0)).toBe(true)
  })

  it('separates focus intentions from views and cleans replaced editors', () => {
    const input = createNativeComponent('MInput', { label: 'Note' })
    input.focus()
    const field = editor(input.view)
    expect(field.focus).not.toHaveBeenCalled()
    load(input.view)
    input.focus()
    expect(field.focus).toHaveBeenCalledOnce()
    input.update({ label: 'Note', multiline: true })
    expect(editor(input.view)).not.toBe(field)
    expect([...field.listeners.values()].every((set) => set.size === 0)).toBe(true)
    input.dispose()
  })

  it('validates before changing the last valid input state', () => {
    const input = createNativeComponent('MInput', { label: 'Note', modelValue: 'valid' })
    expect(() => input.update({ label: 'Note', multiline: true, type: 'password' })).toThrow(
      'multiline',
    )
    expect(input.view.mavisProps).toMatchObject({ modelValue: 'valid', multiline: false })
    input.dispose()
  })

  it('isolates themes, follows changes while loaded, and refreshes a retained view on reload', () => {
    const first = createMavis(),
      second = createMavis({ theme: midnight })
    const a = first.create('MText', { text: 'first' }),
      b = second.create('MText', { text: 'second' })
    load(a.view)
    load(b.view)
    expect(a.view.style.color).toBe(mavis.colors.text)
    expect(b.view.style.color).toBe(midnight.colors.text)
    unload(a.view)
    first.setTheme(midnight)
    expect(a.view.style.color).toBe(mavis.colors.text)
    load(a.view)
    expect(a.view.style.color).toBe(midnight.colors.text)
    first.setTheme(mavis)
    expect(b.view.style.color).toBe(midnight.colors.text)
    a.dispose()
    b.dispose()
  })

  it('allows activation only while loaded and enabled, with balanced resource ownership', () => {
    const baseline = { ...resources },
      click = vi.fn()
    const button = createNativeComponent(
      'MButton',
      { text: 'Save' },
      { events: { activate: click } },
    )
    fake(button.view).emit('tap')
    expect(click).not.toHaveBeenCalled()
    load(button.view)
    load(button.view)
    expect(resources.press).toBe(baseline.press + 1)
    fake(button.view).emit('tap')
    expect(click).toHaveBeenCalledOnce()
    button.update({ text: 'Save', loading: true })
    expect(fake(button.view).text).toBe('Loading…')
    fake(button.view).emit('tap')
    expect(click).toHaveBeenCalledOnce()
    button.update({ text: 'Save', disabled: true })
    expect(resources.press).toBe(baseline.press)
    button.update({ text: 'Save' })
    unload(button.view)
    unload(button.view)
    expect(resources).toEqual(baseline)
    load(button.view)
    button.dispose()
    button.dispose()
    expect(resources).toEqual(baseline)
    expect(() => button.update({ text: 'too late' })).toThrow('disposed')
  })

  it('releases input action listeners on final disposal and rejects removed actions', () => {
    const action = vi.fn()
    const input = createNativeComponent(
      'MInput',
      { label: 'Name', trailingAction: { icon: 'x', label: 'Clear' } },
      { events: { action } },
    )
    load(input.view)
    const button = fake(input.view).children.find((child) => child.listeners.has('tap'))!
    button.emit('tap')
    expect(action).toHaveBeenCalledOnce()
    input.update({ label: 'Name' })
    button.emit('tap')
    expect(action).toHaveBeenCalledOnce()
    input.dispose()
    expect([...button.listeners.values()].every((listeners) => listeners.size === 0)).toBe(true)
  })

  it('resets explicit theme overrides and preserves text slot content across theme updates', () => {
    const theme = createMavisTheme(midnight)
    const text = createNativeComponent('MText', {}, { theme })
    text.view.mavisContentText = 'Slot'
    load(text.view)
    theme.setTheme(mavis)
    expect(fake(text.view).text).toBe('Slot')
    text.view.mavisTheme = undefined
    expect(Reflect.get(text.view, 'mavisTheme')?.theme).toBe(mavis)
    text.dispose()
  })
})
