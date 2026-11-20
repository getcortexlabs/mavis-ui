/** Svelte 4 passes CustomEventInit; Svelte Native 1.0.32 stores that object as detail.
 * Repair only the nonconforming native shim, after initializeDom installs it.
 */
export function normalizeNativeCustomEvent() {
  const NativeEvent = globalThis.CustomEvent
  const marker = {}
  if (new NativeEvent('mavis-event-check', { detail: marker }).detail === marker) return
  globalThis.CustomEvent = class<T = unknown> extends NativeEvent<T> {
    private prevented = false
    constructor(type: string, options: CustomEventInit<T> = {}) {
      super(type, options)
      Object.defineProperties(this, {
        detail: { value: options.detail ?? null },
        bubbles: { value: options.bubbles ?? false },
        cancelable: { value: options.cancelable ?? false },
      })
    }
    override get defaultPrevented() {
      return this.prevented
    }
    override preventDefault() {
      if (this.cancelable) this.prevented = true
    }
  }
}
