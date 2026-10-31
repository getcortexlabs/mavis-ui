import { Application } from '@nativescript/core'
import type { Appearance, AppearanceSource } from '@getcortexlabs/mavis-core/vue'

function read(): Appearance | undefined {
  try {
    return (
      Application.primaryWindow?.systemAppearance() ?? Application.systemAppearance() ?? undefined
    )
  } catch {
    // Android has no application context before launch; the launch event resolves it below.
    return undefined
  }
}

/** Core reports the primary window's appearance and raises `systemAppearanceChanged` on changes. */
export function systemAppearance(): AppearanceSource {
  return {
    current: read,
    observe(listener) {
      const changed = (args: { newValue: Appearance }) => listener(args.newValue)
      const launched = () => {
        const value = read()
        if (value) listener(value)
      }
      Application.on(Application.systemAppearanceChangedEvent, changed)
      Application.on(Application.launchEvent, launched)
      return () => {
        Application.off(Application.systemAppearanceChangedEvent, changed)
        Application.off(Application.launchEvent, launched)
      }
    },
  }
}
