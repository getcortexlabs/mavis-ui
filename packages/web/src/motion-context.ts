import { inject, type InjectionKey } from 'vue'
import { createWebRuntime, type WebRuntime } from '@rafaelaugusto/jolt/web'

export interface WebMotionContext {
  acquire(document: Document): { runtime: WebRuntime; release(): void }
}
export const motionContextKey: InjectionKey<WebMotionContext> = Symbol('mavis-motion-context')

/** A context belongs to a declared region, never to a process or an SSR request singleton. */
export function createMotionContext(): WebMotionContext {
  let current: { document: Document; runtime: WebRuntime; users: number } | undefined
  return {
    acquire(document) {
      if (current && current.document !== document)
        throw new Error('A motion region cannot span documents.')
      const context = (current ??= { document, runtime: createWebRuntime(document), users: 0 })
      context.users++
      let released = false
      return {
        runtime: context.runtime,
        release() {
          if (released) return
          released = true
          if (--context.users === 0) {
            if (current === context) current = undefined
            context.runtime.dispose()
          }
        },
      }
    },
  }
}
export function useMotionContext() {
  return inject(motionContextKey, undefined) ?? createMotionContext()
}
