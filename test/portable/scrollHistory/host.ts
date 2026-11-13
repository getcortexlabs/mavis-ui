import type { App } from 'vue'
import { createScrollProbe, scrollProbeKey } from './probe'
// These probes exercise the generated Mac history and AppKit bridge. Other hosts keep their
// existing routers; the shared screen still renders and calls an asynchronous host service.
export function install(app: App) {
  app.provide(
    scrollProbeKey,
    createScrollProbe({
      async run() {
        return 'Shared host ready'
      },
    }),
  )
}
