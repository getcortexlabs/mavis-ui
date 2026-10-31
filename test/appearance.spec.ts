import { describe, expect, it } from 'vitest'
import { mavis, midnight, defineTheme } from '../packages/core/src/index.js'
import { createThemeContext, type AppearanceSource } from '../packages/core/src/vue/index.js'

function fakeSource(initial: 'light' | 'dark' | undefined) {
  const listeners = new Set<(appearance: 'light' | 'dark') => void>()
  let current = initial
  const source: AppearanceSource = {
    current: () => current,
    observe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return {
    source,
    listeners,
    change(next: 'light' | 'dark') {
      current = next
      for (const listener of listeners) listener(next)
    },
  }
}

describe('theme context appearance', () => {
  it('follows the device by default and keeps following after changes', () => {
    const device = fakeSource('dark')
    const context = createThemeContext({ theme: mavis, darkTheme: midnight, source: device.source })
    expect(context.appearance.value).toBe('system')
    expect(context.theme.value).toBe(midnight)
    device.change('light')
    expect(context.theme.value).toBe(mavis)
    device.change('dark')
    expect(context.theme.value).toBe(midnight)
  })

  it('renders the configured theme while the device appearance is unknown', () => {
    const context = createThemeContext({
      theme: mavis,
      darkTheme: midnight,
      source: fakeSource(undefined).source,
    })
    expect(context.theme.value).toBe(mavis)
    const dark = createThemeContext({ theme: midnight, source: fakeSource(undefined).source })
    expect(dark.theme.value).toBe(midnight)
  })

  it('uses the only theme for either appearance', () => {
    const device = fakeSource('dark')
    const context = createThemeContext({ theme: mavis, source: device.source })
    expect(context.theme.value).toBe(mavis)
    context.setAppearance('dark')
    expect(context.theme.value).toBe(mavis)
    const night = createThemeContext({ theme: midnight, source: fakeSource('light').source })
    expect(night.theme.value).toBe(midnight)
  })

  it('pins an explicit appearance until the app follows the device again', () => {
    const device = fakeSource('light')
    const context = createThemeContext({ theme: mavis, darkTheme: midnight, source: device.source })
    context.setAppearance('dark')
    expect(context.theme.value).toBe(midnight)
    device.change('light')
    expect(context.theme.value).toBe(midnight)
    context.setAppearance('system')
    expect(context.theme.value).toBe(mavis)
    device.change('dark')
    expect(context.theme.value).toBe(midnight)
  })

  it('registers an explicit theme for its appearance and pins it', () => {
    const device = fakeSource('dark')
    const studio = defineTheme({ name: 'studio', colors: { primary: '#5636A8' } }, mavis)
    const context = createThemeContext({ theme: mavis, darkTheme: midnight, source: device.source })
    context.setTheme(studio)
    expect(context.appearance.value).toBe('light')
    expect(context.theme.value).toBe(studio)
    context.setAppearance('system')
    expect(context.theme.value).toBe(midnight)
    device.change('light')
    expect(context.theme.value).toBe(studio)
  })

  it('accepts a plain theme, validates modes and disposes its listener', () => {
    const legacy = createThemeContext(midnight)
    expect(legacy.theme.value).toBe(midnight)
    expect(legacy.appearance.value).toBe('system')
    expect(() => createThemeContext({ appearance: 'auto' as never })).toThrow(RangeError)
    expect(() => legacy.setAppearance('night' as never)).toThrow(RangeError)
    const device = fakeSource('light')
    const context = createThemeContext({ theme: mavis, darkTheme: midnight, source: device.source })
    expect(device.listeners.size).toBe(1)
    context.dispose()
    expect(device.listeners.size).toBe(0)
    device.change('dark')
    expect(context.theme.value).toBe(mavis)
  })
})
