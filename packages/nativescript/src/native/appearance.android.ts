import { Application, Utils } from '@nativescript/core'
import type { Appearance, AppearanceSource } from '@getcortexlabs/mavis-core/vue'

interface Configuration {
  uiMode: number
}
interface Context {
  getResources(): { getConfiguration(): Configuration }
  registerComponentCallbacks(callbacks: object): void
  unregisterComponentCallbacks(callbacks: object): void
}
declare const android: {
  content: {
    ComponentCallbacks2: new (implementation: {
      onConfigurationChanged(configuration: Configuration): void
      onLowMemory(): void
      onTrimMemory(level: number): void
    }) => object
  }
}

// android.content.res.Configuration.UI_MODE_NIGHT_MASK and UI_MODE_NIGHT_YES.
const NIGHT_MASK = 0x30
const NIGHT_YES = 0x20

function context(): Context | undefined {
  try {
    return Utils.android.getApplicationContext() as Context
  } catch {
    // The application context does not exist before launch.
    return undefined
  }
}

const appearanceOf = (configuration: Configuration): Appearance =>
  (configuration.uiMode & NIGHT_MASK) === NIGHT_YES ? 'dark' : 'light'

/** Reads `uiMode` from the application configuration directly; Core's window cache can lag on older devices. */
export function systemAppearance(): AppearanceSource {
  return {
    current() {
      const app = context()
      return app ? appearanceOf(app.getResources().getConfiguration()) : undefined
    },
    observe(listener) {
      let registered: { app: Context; callbacks: object } | undefined
      const register = () => {
        const app = context()
        if (!app || registered) return
        const callbacks = new android.content.ComponentCallbacks2({
          onConfigurationChanged: (configuration) => listener(appearanceOf(configuration)),
          onLowMemory() {},
          onTrimMemory() {},
        })
        app.registerComponentCallbacks(callbacks)
        registered = { app, callbacks }
        listener(appearanceOf(app.getResources().getConfiguration()))
      }
      // An Android 8 phone skipped one of four configuration deliveries; resuming re-reads it.
      const resumed = () => {
        const app = context()
        if (app) listener(appearanceOf(app.getResources().getConfiguration()))
      }
      register()
      Application.on(Application.launchEvent, register)
      Application.on(Application.resumeEvent, resumed)
      return () => {
        Application.off(Application.launchEvent, register)
        Application.off(Application.resumeEvent, resumed)
        registered?.app.unregisterComponentCallbacks(registered.callbacks)
        registered = undefined
      }
    },
  }
}
