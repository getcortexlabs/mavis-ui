import type { App } from 'vue'
import { createPanelPreferences, panelPreferencesKey, type PanelSizes } from './preferences'
export function install(app: App) {
  const key = 'mavis-conformance-panel-preferences'
  // Each verification starts clean. Subsequent closes destroy the panels and reset memory,
  // while reopening reads the stored host value. NativeScript uses an equivalent memory host.
  const browser = typeof localStorage !== 'undefined' ? localStorage : undefined
  browser?.removeItem(key)
  let memory: PanelSizes | null = null
  app.provide(
    panelPreferencesKey,
    createPanelPreferences({
      async load() {
        const json = browser?.getItem(key)
        return json ? JSON.parse(json) : memory && { ...memory }
      },
      async save(sizes) {
        if (browser) browser.setItem(key, JSON.stringify(sizes))
        else memory = { ...sizes }
      },
    }),
  )
}
