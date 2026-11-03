import type { WebRuntime } from '@rafaelaugusto/jolt/web'
import type {
  MotionRegionAdapter,
  MotionSurfaceAdapter,
} from '@getcortexlabs/mavis-core/experimental'

export function webPlatformMotion(
  runtime: WebRuntime,
  target: HTMLElement,
  resolve: (surface: MotionSurfaceAdapter) => HTMLElement,
): Pick<MotionRegionAdapter, 'onKeyboard' | 'physicsWorld'> {
  return {
    onKeyboard: (callback) => runtime.onKeyboard(callback),
    async physicsWorld(bodies, options) {
      const world = runtime.physicsWorld(
        target,
        bodies.map(({ target, ...body }) => ({ ...body, view: resolve(target) })),
        options,
      )
      return {
        get paused() {
          return world.paused
        },
        pause: () => world.pause(),
        resume: () => world.play(),
        reset: () => world.reset(),
        impulse: (id, value) => world.impulse(id, value),
        attach: (id, value) => world.attach(id, value),
        spring: (id, value) => world.spring(id, value),
        snapTo: (id, index) => world.snapTo(id, index),
        snapshot: () => world.snapshot(),
        dispose: () => world.dispose(),
      }
    },
  }
}
