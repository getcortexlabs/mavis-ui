import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, onUnmounted, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createPlatformContext,
  MPlatform,
  platformKey,
  useMavisPlatform,
  type MavisPlatformTarget,
} from '../packages/core/src/vue/platform.js'
import { createMavisServices } from '../packages/web/src/services.js'
import { renderer, node } from './renderer.js'

describe('platform-owned conditional UI', () => {
  it.each(['web', 'ios', 'android'] as const)(
    'mounts only matching slots on %s without layout wrappers',
    (platform) => {
      const mounted: string[] = []
      const Child = defineComponent({
        props: ['name'],
        setup(props) {
          mounted.push(props.name)
          return () => h('label', props.name)
        },
      })
      const targets = ['web', 'native', 'ios', 'android'] as const
      const root = node('root')
      const app = renderer.createApp({
        render: () => targets.map((only) => h(MPlatform, { only }, () => h(Child, { name: only }))),
      })
      app.provide(platformKey, createPlatformContext(platform))
      app.mount(root)
      expect(mounted).toEqual(platform === 'web' ? ['web'] : ['native', platform])
      expect(
        root.children.filter((child) => !child.tag.startsWith('#')).map((child) => child.tag),
      ).toEqual(mounted.map(() => 'label'))
      app.unmount()
    },
  )

  it('does not evaluate excluded slots and releases children when only changes', async () => {
    const only = ref<MavisPlatformTarget | readonly MavisPlatformTarget[]>('native')
    const setup = vi.fn(),
      disposed = vi.fn(),
      fallback = vi.fn(() => h('label', 'Fallback'))
    const Child = defineComponent({
      setup() {
        setup()
        onUnmounted(disposed)
        return () => h('input')
      },
    })
    const content = vi.fn(() => h(Child))
    const app = renderer.createApp({
      render: () => h(MPlatform, { only: only.value }, { default: content, fallback }),
    })
    app.provide(platformKey, createPlatformContext('web'))
    app.mount(node('root'))
    expect(content).not.toHaveBeenCalled()
    expect(setup).not.toHaveBeenCalled()
    expect(fallback).toHaveBeenCalledOnce()
    only.value = ['ios', 'web']
    await nextTick()
    expect(setup).toHaveBeenCalledOnce()
    only.value = 'android'
    await nextTick()
    expect(disposed).toHaveBeenCalledOnce()
    app.unmount()
  })

  it('uses Web on the server with services-only installation and isolates concurrent apps', async () => {
    const values: unknown[] = []
    const Root = defineComponent({
      setup() {
        const context = useMavisPlatform()
        values.push(context)
        expect(Object.isFrozen(context)).toBe(true)
        return () =>
          h(
            MPlatform,
            { only: 'web' },
            {
              default: () =>
                h(
                  'p',
                  `${context.platform}:${context.isWeb}:${context.isNative}:${context.isIOS}:${context.isAndroid}`,
                ),
              fallback: () => {
                throw new Error('Server must select Web')
              },
            },
          )
      },
    })
    const apps = [createSSRApp(Root), createSSRApp(Root)].map((app) =>
      app.use(createMavisServices()),
    )
    expect(await Promise.all(apps.map((app) => renderToString(app)))).toEqual([
      '<!--[--><p>web:true:false:false:false</p><!--]-->',
      '<!--[--><p>web:true:false:false:false</p><!--]-->',
    ])
    expect(values[0]).not.toBe(values[1])
    expect(Object.keys(apps[0]!._context.components)).toEqual([])
  })

  it('answers for the Mac only where the Mac generator asks', async () => {
    for (const platform of ['web', 'ios', 'android'] as const)
      expect(createPlatformContext(platform).isMacOS).toBe(false)
    expect(createPlatformContext('macos')).toEqual({
      platform: 'macos',
      isWeb: false,
      isNative: false,
      isIOS: false,
      isAndroid: false,
      isMacOS: true,
    })
    let web: ReturnType<typeof useMavisPlatform> | undefined
    const app = createSSRApp({
      setup() {
        web = useMavisPlatform()
        return () => [
          h(MPlatform, { only: 'macos' }, { default: () => 'Mac', fallback: () => 'Elsewhere' }),
          h(MPlatform, { only: ['macos', 'web'] }, () => ' and here'),
        ]
      },
    }).use(createMavisServices())
    expect((await renderToString(app)).replace(/<!--.*?-->/g, '')).toBe('Elsewhere and here')
    expect(web).toMatchObject({ platform: 'web', isMacOS: false })
  })

  it.each(['ios', 'android'] as const)('keeps Mac content out of %s', (platform) => {
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(
          MPlatform,
          { only: 'macos' },
          { default: () => h('label', 'Mac'), fallback: () => h('label', 'Phone') },
        ),
    })
    app.provide(platformKey, createPlatformContext(platform))
    app.mount(root)
    expect(
      root.children.filter((child) => !child.tag.startsWith('#')).map((child) => child.text),
    ).toEqual(['Phone'])
    app.unmount()
  })

  it('reports missing installation and rejects invalid targets', async () => {
    const root = { render: () => h(MPlatform, { only: 'web' }, () => 'Web') }
    const missing = createSSRApp(root)
    missing.config.warnHandler = () => {}
    await expect(renderToString(missing)).rejects.toThrow('Install createMavis()')
    for (const only of ['mobile', [], ['web', 'unknown']]) {
      const app = createSSRApp({
        render: () => h(MPlatform, { only: only as never }, () => 'content'),
      }).use(createMavisServices())
      app.config.warnHandler = () => {}
      await expect(renderToString(app)).rejects.toThrow('MPlatform.only')
    }
  })
})
