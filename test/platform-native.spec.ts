import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { node, renderer } from './renderer.js'
const native = vi.hoisted(() => ({ ios: false }))
vi.mock('@nativescript/core', () => ({
  get isIOS() {
    return native.ios
  },
  Application: { systemAppearance: () => 'light', on() {}, off() {} },
}))
import { createMavisServices } from '../packages/nativescript/src/vue/services.js'
import { MPlatform, useMavisPlatform } from '../packages/core/src/vue/platform.js'
describe('automatic native platform services', () => {
  it.each([true, false])('identifies iOS=%s without Web or a global override', (ios) => {
    native.ios = ios
    let captured: ReturnType<typeof useMavisPlatform> | undefined
    const app = renderer
      .createApp({
        setup() {
          captured = useMavisPlatform()
          return () => h(MPlatform, { only: ios ? 'ios' : 'android' }, () => h('Label', 'Native'))
        },
      })
      .use(createMavisServices())
    app.mount(node('root'))
    expect(captured).toEqual({
      platform: ios ? 'ios' : 'android',
      isWeb: false,
      isNative: true,
      isIOS: ios,
      isAndroid: !ios,
    })
    expect(Object.keys(app._context.components)).toEqual([])
    app.unmount()
  })
})
