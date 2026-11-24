import { inject, readonly, ref, type InjectionKey } from 'vue'
export type PanelSizes = { horizontal: number; vertical: number }
export interface PanelStorage {
  load(): Promise<PanelSizes | null>
  save(sizes: PanelSizes): Promise<void>
}
export function createPanelPreferences(storage: PanelStorage) {
  const horizontal = ref(40)
  const vertical = ref(55)
  const opened = ref(true)
  const status = ref('Fresh')
  function resizeHorizontal(value: number) {
    horizontal.value = value
  }
  function resizeVertical(value: number) {
    vertical.value = value
  }
  async function save() {
    try {
      await storage.save({ horizontal: horizontal.value, vertical: vertical.value })
      status.value = 'Saved'
    } catch {
      status.value = 'Save failed'
    }
  }
  function close() {
    opened.value = false
    horizontal.value = 50
    vertical.value = 50
    status.value = 'Closed and reset'
  }
  async function open() {
    try {
      const saved = await storage.load()
      if (saved !== null) {
        horizontal.value = saved.horizontal
        vertical.value = saved.vertical
      }
      opened.value = true
      status.value = saved === null ? 'No saved layout' : 'Restored'
    } catch {
      status.value = 'Restore failed'
    }
  }
  return {
    horizontal: readonly(horizontal),
    vertical: readonly(vertical),
    opened: readonly(opened),
    status: readonly(status),
    resizeHorizontal,
    resizeVertical,
    save,
    close,
    open,
  }
}
export type PanelPreferences = ReturnType<typeof createPanelPreferences>
export const panelPreferencesKey: InjectionKey<PanelPreferences> = Symbol('panel-preferences')
export function usePanelPreferences() {
  const store = inject(panelPreferencesKey)
  if (!store) throw new Error('Install panel preferences')
  return store
}
