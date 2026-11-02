import { Application } from '@nativescript/core'
import { SDK_VERSION } from '@nativescript/core/utils/constants'
import { AppIconError, type AppIconAdapter } from '@getcortexlabs/mavis-core'
import type { AppIconsOptions } from '../app-icons.js'

type Component = object
interface PackageManager {
  getActivityInfo(
    component: Component,
    flags: number,
  ): { enabled: boolean; targetActivity: string | null }
  getComponentEnabledSetting(component: Component): number
  setComponentEnabledSetting(component: Component, state: number, flags: number): void
  setComponentEnabledSettings(settings: object): void
}
declare const android: {
  content: {
    ComponentName: new (context: object, name: string) => Component
    pm: {
      PackageManager: {
        ComponentEnabledSetting: new (component: Component, state: number, flags: number) => object
      }
    }
  }
}
declare const java: { util: { ArrayList: new () => { add(value: object): void } } }

export function nativeAppIcons(options: AppIconsOptions): AppIconAdapter {
  const aliases = new Set<string>()
  for (const icon of options.icons) {
    if (!/^[\w]+(?:\.[\w$]+)+$/.test(icon.androidAlias) || aliases.has(icon.androidAlias))
      throw new AppIconError(
        'configuration',
        'Android needs unique fully qualified activity-alias names.',
      )
    aliases.add(icon.androidAlias)
  }
  const runtime = () => {
    const context = Application.android.context
    const manager = context.getPackageManager() as PackageManager
    const choices = options.icons.map((icon) => {
      const component = new android.content.ComponentName(context, icon.androidAlias)
      const info = manager.getActivityInfo(component, 512) // MATCH_DISABLED_COMPONENTS
      if (!info.targetActivity)
        throw new AppIconError('configuration', `${icon.androidAlias} must be an activity-alias.`)
      const state = manager.getComponentEnabledSetting(component)
      return { ...icon, component, state, enabled: state === 1 || (state === 0 && info.enabled) }
    })
    return { manager, choices }
  }
  return {
    supported: () => Boolean(Application.android.context),
    current() {
      const enabled = runtime().choices.filter((icon) => icon.enabled)
      return enabled.length === 1 ? enabled[0]!.id : undefined
    },
    async select(id) {
      const { manager, choices } = runtime()
      const next = choices.find((icon) => icon.id === id)!
      try {
        if (SDK_VERSION >= 33) {
          const settings = new java.util.ArrayList()
          for (const icon of choices)
            settings.add(
              new android.content.pm.PackageManager.ComponentEnabledSetting(
                icon.component,
                icon.id === id ? 1 : 2,
                1,
              ),
            )
          manager.setComponentEnabledSettings(settings)
        } else {
          // Keep at least one launcher entry enabled throughout the non-atomic fallback.
          manager.setComponentEnabledSetting(next.component, 1, 1) // ENABLED, DONT_KILL_APP
          for (const icon of choices)
            if (icon.id !== id) manager.setComponentEnabledSetting(icon.component, 2, 1)
        }
      } catch (cause) {
        const rollback: unknown[] = []
        for (const icon of [...choices].sort((a, b) => Number(b.enabled) - Number(a.enabled))) {
          try {
            manager.setComponentEnabledSetting(icon.component, icon.state, 1)
          } catch (error) {
            rollback.push(error)
          }
        }
        throw new AppIconError('platform', 'Android could not update launcher aliases.', {
          cause: rollback.length
            ? new AggregateError([cause, ...rollback], 'Launcher rollback failed')
            : cause,
        })
      }
    },
  }
}
