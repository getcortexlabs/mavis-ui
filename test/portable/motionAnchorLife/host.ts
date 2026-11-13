import type { App } from 'vue'
import { createMotionAnchorProbe, motionAnchorProbeKey } from './probe'
export function install(app: App) {
  app.provide(
    motionAnchorProbeKey,
    createMotionAnchorProbe({
      async run() {
        return 'Shared host ready'
      },
    }),
  )
}
