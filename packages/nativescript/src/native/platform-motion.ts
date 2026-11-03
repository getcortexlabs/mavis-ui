import type { View } from '@nativescript/core'
import { onKeyboard, type MotionScope } from '@rafaelaugusto/jolt'
import { physicsWorld } from '@rafaelaugusto/jolt/physics'
import type {
  MotionRegionAdapter,
  MotionSurfaceAdapter,
  MotionKeyboardState,
} from '@getcortexlabs/mavis-core/experimental'

function afterLayout(targets: readonly View[], scope: MotionScope): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false,
      release: (() => void) | undefined
    const clear = () => {
      settled = true
      for (const target of targets) {
        target.off('layoutChanged', changed)
        target.off('unloaded', unloaded)
      }
      release?.()
    }
    const check = () => {
      if (settled) return
      if (
        targets.every(
          (target) =>
            target.isLoaded &&
            target.isLayoutValid &&
            target.getActualSize().width > 0 &&
            target.getActualSize().height > 0,
        )
      ) {
        clear()
        resolve()
      }
    }
    const changed = () => {
      void Promise.resolve().then(check)
    }
    const unloaded = () => {
      if (settled) return
      clear()
      reject(new Error('Physics presentation released before layout.'))
    }
    if (scope.disposed || scope.suspended) {
      unloaded()
      return
    }
    for (const target of targets) {
      target.on('layoutChanged', changed)
      target.on('unloaded', unloaded)
    }
    release = scope.use(() => unloaded)
    check()
  })
}
export function nativePlatformMotion(
  target: View,
  resolve: (surface: MotionSurfaceAdapter) => View,
  scope: MotionScope,
): Pick<MotionRegionAdapter, 'onKeyboard' | 'physicsWorld'> {
  return {
    onKeyboard(callback) {
      let state: MotionKeyboardState = {
        visible: false,
        height: 0,
        duration: 0,
        backend: 'native',
        accuracy: 'unavailable',
      }
      const read = () => state
      const release = scope.use(() => {
        const off = onKeyboard((value) => {
          state = { ...value, backend: 'native', accuracy: 'native' }
          callback(state)
        })
        callback(read())
        return off
      })
      return { snapshot: read, dispose: release }
    },
    async physicsWorld(bodies, options) {
      const mapped = bodies.map(({ target, ...body }) => ({ ...body, view: resolve(target) }))
      await afterLayout([target, ...mapped.map((body) => body.view)], scope)
      if (scope.disposed || scope.suspended) throw new Error('Physics presentation is inactive.')
      const world = physicsWorld(target, mapped, { ...options, scope })
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
