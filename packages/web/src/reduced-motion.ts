import type { WebMotionContext } from './motion-context.js'

/**
 * The effective preference of the region's runtime: the system's, unless the runtime was
 * configured to always or never reduce. The lease keeps that runtime alive while observed.
 */
export function followReducedMotion(
  context: WebMotionContext,
  document: Document,
  changed: () => void,
) {
  const lease = context.acquire(document)
  let last = lease.runtime.reducedMotion()
  let off: (() => void) | undefined = lease.runtime.onReducedMotion((reduced) => {
    last = reduced
    changed()
  })
  return {
    get reduced() {
      return off ? (last = lease.runtime.reducedMotion()) : last
    },
    release() {
      if (!off) return
      last = lease.runtime.reducedMotion()
      off()
      off = undefined
      lease.release()
    },
  }
}
