import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, type App, type Component } from 'vue'
import {
  avatarInitials,
  avatarSizes,
  badgeColors,
  mavis,
  midnight,
} from '../packages/core/src/index.js'
import { MAvatar as NativeAvatar } from '../packages/nativescript/src/vue/components/MAvatar.js'
import { MBadge as NativeBadge } from '../packages/nativescript/src/vue/components/MBadge.js'
import { MAvatar as WebAvatar } from '../packages/web/src/components/MAvatar.js'
import { MBadge as WebBadge } from '../packages/web/src/components/MBadge.js'
import { node, renderer, find, fire } from './renderer.js'

vi.mock('@nativescript/core', () => ({}))
const load = vi.hoisted(() => vi.fn())
vi.mock('../packages/nativescript/src/native/avatar-image.ts', () => ({ loadAvatarImage: load }))
let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  load.mockReset()
})
const settle = async () => {
  await Promise.resolve()
  await nextTick()
}
function mount(component: Component, props = ref<Record<string, unknown>>({})) {
  const root = node('root')
  app = renderer.createApp({ render: () => h(component, props.value) })
  app.mount(root)
  return root
}

describe('Avatar identity', () => {
  it('normalizes whitespace and Unicode, using first and last words', () => {
    expect(avatarInitials('  Marina de Costa ')).toBe('MC')
    expect(avatarInitials('e\u0301lodie Durand')).toBe('ÉD')
    expect(avatarInitials('李 明')).toBe('李明')
    expect(avatarInitials('Marina')).toBe('M')
    expect(avatarInitials('  ')).toBe('')
    expect(avatarSizes).toEqual({ sm: 32, md: 48, lg: 64, xl: 96 })
  })
  it('keeps native fallback through failed and stale requests, including A → B → A', async () => {
    const requests: { resolve: (value: unknown) => void; reject: (reason: Error) => void }[] = []
    load.mockImplementation(
      () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
    )
    const props = ref({ name: 'Marina Costa', src: 'a' })
    const root = mount(NativeAvatar, props)
    expect(find(root, 'MavisAvatarLabel').props.text).toBe('MC')
    props.value.src = 'b'
    await settle()
    props.value.src = 'a'
    await settle()
    requests[0]!.resolve({ old: true })
    await settle()
    expect(() => find(root, 'Image')).toThrow()
    requests[1]!.reject(new Error('Missing'))
    await settle()
    expect(() => find(root, 'Image')).toThrow()
    const image = { current: true, width: 192, height: 192 }
    requests[2]!.resolve(image)
    await settle()
    expect(find(root, 'Image').props.imageSource).toBe(image)
    props.value.src = 'broken'
    await settle()
    expect(() => find(root, 'Image')).toThrow()
    requests[3]!.reject(new Error('Decode'))
    await settle()
    expect(find(root, 'MavisAvatarLabel').props.text).toBe('MC')
    props.value.src = 'late'
    await settle()
    app!.unmount()
    app = undefined
    requests[4]!.resolve({ late: true })
    await settle()
    expect(root.children).toHaveLength(0)
  })
  it('keeps initials when a native decoder resolves an empty image instead of rejecting', async () => {
    load.mockResolvedValue({ width: NaN, height: NaN })
    const root = mount(
      NativeAvatar,
      ref({ name: 'Marina Costa', src: 'data:image/png;base64,broken' }),
    )
    await settle()
    expect(() => find(root, 'Image')).toThrow()
    expect(find(root, 'MavisAvatarLabel').props.text).toBe('MC')
  })
  it('ignores old Web image events and restores the fallback when the source changes', async () => {
    const props = ref({ name: 'Marina Costa', src: '/a.png' })
    const root = mount(WebAvatar, props)
    const old = find(root, 'img')
    props.value.src = '/b.png'
    await nextTick()
    const current = find(root, 'img')
    fire(old, 'onLoad')
    await nextTick()
    expect(current.props.style).toMatchObject({ visibility: 'hidden' })
    fire(current, 'onLoad')
    await nextTick()
    expect(current.props.style).toMatchObject({ visibility: 'visible', objectFit: 'cover' })
    fire(current, 'onError')
    await nextTick()
    expect(current.props.style).toMatchObject({ visibility: 'hidden' })
    props.value.src = ''
    await nextTick()
    expect(() => find(root, 'img')).toThrow()
  })
  for (const [platform, Avatar, tag] of [
    ['native', NativeAvatar, 'MavisBox'],
    ['web', WebAvatar, 'span'],
  ] as const) {
    it(`names the ${platform} avatar once and allows decorative output`, async () => {
      const props = ref({
        name: 'Marina Costa',
        size: 'lg',
        shape: 'square',
        accessibilityHidden: false,
      })
      const root = mount(Avatar, props)
      const element = find(root, tag)
      if (platform === 'native') {
        expect(element.props).toMatchObject({
          accessible: true,
          accessibilityLabel: 'Marina Costa',
        })
        expect(element.props.style).toMatchObject({
          width: 64,
          height: 64,
          borderRadius: 16,
          flexShrink: 0,
        })
        expect(find(root, 'MavisAvatarLabel').props.accessibilityHidden).toBe(true)
      } else {
        expect(element.props).toMatchObject({ role: 'img', 'aria-label': 'Marina Costa' })
        expect(element.props.style).toMatchObject({
          width: '64px',
          height: '64px',
          borderRadius: '16px',
        })
      }
      props.value.accessibilityHidden = true
      await nextTick()
      expect(element.props[platform === 'native' ? 'accessibilityHidden' : 'aria-hidden']).toBe(
        platform === 'native' ? true : 'true',
      )
    })
  }
})

describe('Badge content and semantics', () => {
  for (const [platform, Badge, tag] of [
    ['native', NativeBadge, 'MavisLabel'],
    ['web', WebBadge, 'span'],
  ] as const) {
    it(`preserves zero, updates copy and exposes a contextual ${platform} label without an action`, async () => {
      const props = ref<Record<string, unknown>>({
        text: 0,
        accessibilityLabel: '0 unread messages',
        tone: 'accent',
      })
      const root = mount(Badge, props),
        element = find(root, tag)
      expect(platform === 'native' ? element.props.text : element.text).toBe('0')
      expect(element.props[platform === 'native' ? 'accessibilityLabel' : 'aria-label']).toBe(
        '0 unread messages',
      )
      expect(element.props).not.toHaveProperty('onClick')
      expect(element.props).not.toHaveProperty('tabindex')
      props.value = { text: 'Needs attention', tone: 'danger', size: 'sm' }
      await nextTick()
      expect(platform === 'native' ? element.props.text : element.text).toBe('Needs attention')
      expect(element.props.style).toMatchObject({ color: mavis.colors.danger })
      expect(element.props.style).not.toHaveProperty('height')
      if (platform === 'web') expect(element.props.role).toBeUndefined()
    })
  }
  it('uses theme colors for every semantic tone in both appearances', () => {
    for (const theme of [mavis, midnight]) {
      for (const tone of [
        'neutral',
        'primary',
        'accent',
        'success',
        'warning',
        'danger',
      ] as const) {
        const colors = badgeColors(theme.colors, tone)
        expect(colors.color).toBe(theme.colors[tone === 'neutral' ? 'text' : tone])
        expect(Object.values(theme.colors)).toContain(colors.backgroundColor)
      }
    }
  })
})
