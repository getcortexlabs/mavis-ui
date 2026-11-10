import { expect, it, vi } from 'vitest'
import { createPreset } from '@rafaelaugusto/jolt/web'
import { parsePath } from '../node_modules/@rafaelaugusto/jolt/dist/core/svg-path.js'
import {
  bindMotionSurface,
  createMotionSurface,
  motionChannels,
  motionKeyframes,
  motionPath,
  resolvePerspective,
  elevationMotion,
  type MotionEffectKind,
  type MotionFrames,
  type MotionPath,
} from '../packages/core/src/experimental.js'
import { defineTheme, mavis, motionRecipe } from '../packages/core/src/index.js'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMavis, MBox, MCard } from '../packages/web/src/index.js'

function bound(shadow = false) {
  const stops = vi.fn()
  const handle = { finished: new Promise<boolean>(() => {}), stop: stops }
  const adapter = {
    animate: vi.fn(() => handle),
    set: vi.fn(() => handle),
    supports: (effect: MotionEffectKind) => effect === 'shadow' && shadow,
  }
  const surface = createMotionSurface()
  bindMotionSurface(surface, adapter)
  return { surface, adapter, stops }
}
const arc = () =>
  motionPath(
    { x: 0, y: 0 },
    { to: { x: 120, y: 0 }, control: { x: 60, y: -80 } },
    {
      to: { x: 240, y: 40 },
      control: [
        { x: 160, y: 60 },
        { x: 220, y: 100 },
      ],
    },
    { to: { x: 240, y: 0 } },
  )

it('describes lines, quadratic and cubic curves with bounds and an end tangent', () => {
  const path = arc()
  expect(path.data).toBe('M 0 0 Q 60 -80 120 0 C 160 60 220 100 240 40 L 240 0')
  expect(path.bounds).toEqual({ left: 0, top: -40, right: 240, bottom: 69.68 })
  expect(path.end).toEqual({ x: 240, y: 0, rotate: -90 })
  expect(Object.isFrozen(path) && Object.isFrozen(path.bounds) && Object.isFrozen(path.end)).toBe(
    true,
  )
  const loop = motionPath(
    { x: 0, y: 0 },
    {
      to: { x: 0, y: 0 },
      control: [
        { x: 90, y: -60 },
        { x: -90, y: -60 },
      ],
    },
  )
  expect(loop.end).toEqual({ x: 0, y: 0, rotate: 33.69 })
  expect(loop.bounds.top).toBe(-45)
})

it('keeps every point of the curve inside the declared bounds, as Jolt samples it', () => {
  const path = arc()
  const geometry = parsePath(path.data)
  for (let step = 0; step <= 400; step++) {
    const pose = geometry.at(step / 400)
    expect(pose.x).toBeGreaterThanOrEqual(path.bounds.left - 0.01)
    expect(pose.x).toBeLessThanOrEqual(path.bounds.right + 0.01)
    expect(pose.y).toBeGreaterThanOrEqual(path.bounds.top - 0.01)
    expect(pose.y).toBeLessThanOrEqual(path.bounds.bottom + 0.01)
  }
  const last = geometry.at(1)
  expect([last.x, last.y, last.rotate]).toEqual([path.end.x, path.end.y, path.end.rotate])
})

it('rejects paths without finite geometry', () => {
  expect(() => motionPath({ x: 0, y: 0 })).toThrow(/between 1 and 64/)
  expect(() => motionPath({ x: 0, y: Infinity }, { to: { x: 1, y: 1 } })).toThrow(/finite/)
  expect(() => motionPath({ x: 0, y: 0 }, { to: { x: 2e5, y: 0 } })).toThrow(/within 100000/)
  expect(() => motionPath({ x: 4, y: 4 }, { to: { x: 4, y: 4 } })).toThrow(/no length/)
  expect(() =>
    motionPath({ x: 0, y: 0 }, { to: { x: 4, y: 4 }, control: [] as never }),
  ).not.toThrow()
  expect(() =>
    motionPath(
      { x: 0, y: 0 },
      {
        to: { x: 4, y: 4 },
        control: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
          { x: 3, y: 3 },
        ] as never,
      },
    ),
  ).toThrow(/one or two control points/)
})

it('hands the descriptor to the renderer and names the channels it replaces', () => {
  const { surface, adapter } = bound()
  const path = arc()
  surface.animate({ path, orient: true, opacity: [0.4, 1] }, { duration: 900 })
  expect(adapter.animate).toHaveBeenCalledWith(
    { path, orient: true, opacity: [0.4, 1] },
    { duration: 900 },
  )
  expect(motionKeyframes({ path, orient: true, opacity: 1 })).toEqual({
    path: path.data,
    orient: true,
    opacity: 1,
  })
  expect(motionKeyframes<MotionFrames>({ scale: 1.1 })).toEqual({ scale: 1.1 })
  expect(motionChannels({ path, orient: true, opacity: 1 })).toEqual([
    'x',
    'y',
    'rotate',
    'opacity',
  ])
  expect(motionChannels({ path, scale: 1 })).toEqual(['x', 'y', 'scale'])
})

it('rejects conflicting or malformed requests before the running motion is replaced', () => {
  const { surface, adapter, stops } = bound()
  const path = arc()
  surface.animate({ scale: 1.1 })
  const invalid: [MotionFrames, RegExp][] = [
    [{ path, x: 10 }, /path owns x and y/],
    [{ path, y: [0, 10] }, /path owns x and y/],
    [{ path, orient: true, rotate: 20 }, /oriented path owns rotate/],
    [{ orient: true, scale: 1 }, /orient needs a path/],
    [{ path: { ...path } as MotionPath }, /Use motionPath\(\)/],
    [{ path: 'M 0 0 L 1 1' as never }, /Use motionPath\(\)/],
    [{ path, orient: 'auto' as never }, /orient must be a boolean/],
    [{ rotateX: Number.NaN }, /"rotateX" needs finite numbers/],
    [{ rotateY: [] }, /"rotateY" needs finite numbers/],
    [{ skew: 4 } as never, /Unsupported motion property "skew"/],
    [{ shadowRadius: 12 }, /Shadow motion is unavailable/],
  ]
  for (const [values, message] of invalid) expect(() => surface.animate(values)).toThrow(message)
  expect(() => surface.animate({ path }, { type: 'gravity' })).toThrow(/Gravity applies only/)
  expect(() => surface.set({ path } as never)).toThrow(/Unsupported motion property "path"/)
  expect(() => surface.set({ rotateX: [0, 1] as never })).toThrow(/finite numbers/)
  expect(adapter.animate).toHaveBeenCalledTimes(1)
  expect(adapter.set).not.toHaveBeenCalled()
  expect(stops).not.toHaveBeenCalled()
  surface.animate({ path, rotate: 12, rotateX: [null, 20], rotateY: -20 })
  surface.set({ rotateX: 0, rotateY: 0 })
  expect(adapter.animate).toHaveBeenCalledTimes(2)
  expect(adapter.set).toHaveBeenCalledWith({ rotateX: 0, rotateY: 0 })
})

it('animates shadow channels only where the surface reports one usable shadow', () => {
  const { surface, adapter } = bound(true)
  expect(surface.supports('shadow')).toBe(true)
  surface.animate({ y: -6, shadowOpacity: [null, 0.3], shadowRadius: 18, shadowOffsetY: 14 })
  expect(adapter.animate).toHaveBeenCalledTimes(1)
  expect(() => surface.animate({ shadowOpacity: 1.2 })).toThrow(/between 0 and 1/)
  expect(() => surface.animate({ shadowRadius: [0, -1] })).toThrow(/cannot be negative/)
  expect(() => surface.animate({ shadowColor: '#000' } as never)).toThrow(/Unsupported motion/)
  expect(adapter.animate).toHaveBeenCalledTimes(1)
  const flat = bound()
  expect(flat.surface.supports('shadow')).toBe(false)
  expect(() => flat.surface.set({ shadowOffsetX: 2 })).toThrow(/keep the static shadow/)
  expect(flat.adapter.set).not.toHaveBeenCalled()
})

it('reads a theme elevation as shadow channels', () => {
  expect(elevationMotion(mavis.elevation.sm)).toEqual({
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
  })
  expect(elevationMotion(mavis.elevation.none).shadowOpacity).toBe(0)
  const shadow = { x: 1, y: 2, blur: 8, spread: 0 }
  expect(elevationMotion({ ...shadow, color: '#00000080' }).shadowOpacity).toBe(0.502)
  expect(elevationMotion({ ...shadow, color: 'rgb(0 0 0 / 25%)' }).shadowOpacity).toBe(0.25)
  expect(elevationMotion({ ...shadow, color: '#123' }).shadowOpacity).toBe(1)
  expect(() => elevationMotion({ ...shadow, spread: 2, color: '#000' })).toThrow(/without spread/)
  expect(() => elevationMotion({ ...shadow, color: 'var(--shadow)' })).toThrow(/reads rgb/)
})

it('limits perspective to a usable projection distance', () => {
  expect(resolvePerspective(undefined)).toBeUndefined()
  expect(resolvePerspective(640)).toBe(640)
  for (const value of [0, -1, Number.NaN, Infinity, 2e5])
    expect(() => resolvePerspective(value)).toThrow(/Perspective must be between/)
})

it('matches the Jolt enter preset while the theme keeps its own easing', () => {
  const theme = defineTheme({ name: 'depth', motion: { ease: 'easeOut' } }, mavis)
  const enter = motionRecipe(theme, 'enter')
  expect(
    createPreset('fadeInUp', {
      distance: theme.motion.enterOffset,
      duration: theme.motion.enterDuration,
    }),
  ).toEqual(enter)
  const eased = motionRecipe(
    defineTheme({ name: 'slow', motion: { ease: 'easeInOut' } }, mavis),
    'enter',
  )
  expect(eased.transition.ease).toBe('easeInOut')
  expect(createPreset('fadeOut', { duration: theme.motion.exitDuration }).transition).toMatchObject(
    {
      ease: 'easeIn',
    },
  )
  expect(motionRecipe(theme, 'exit').transition.ease).toBe('easeOut')
})

it('renders the parent perspective on the server without touching the surface', async () => {
  const surface = createMotionSurface()
  const render = (perspective: number) =>
    renderToString(
      createSSRApp({
        render: () =>
          h(MBox, { perspective }, () => h(MCard, { motionSurface: surface }, () => 'Depth')),
      }).use(createMavis()),
    )
  const html = await render(640)
  expect(html).toContain('perspective:640px')
  expect(html).toContain('Depth')
  expect(html).not.toContain('[object Object]')
  expect(surface.available).toBe(false)
  await expect(render(0)).rejects.toThrow(/Perspective must be between/)
})
