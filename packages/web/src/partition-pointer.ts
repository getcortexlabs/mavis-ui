import { onBeforeUnmount, onDeactivated, watch } from 'vue'

export function usePartitionPointer(
  options: {
    vertical(): boolean
    direction(): number
    disabled(): boolean
    value(): number
    begin(): boolean
    update(value: number): void
    end(): void
    cancel(): void
    bounds(): DOMRect | undefined
  },
  absolute = false,
) {
  let contact:
    | { id: number; x: number; y: number; value: number; bounds: DOMRect; element: HTMLElement }
    | undefined
  function release(cancel: boolean) {
    const old = contact
    contact = undefined
    if (!old) return
    if (old.element.hasPointerCapture(old.id)) old.element.releasePointerCapture(old.id)
    if (cancel) options.cancel()
    else options.end()
  }
  function update(event: PointerEvent) {
    if (!contact || event.pointerId !== contact.id) return
    if (options.disabled()) {
      release(true)
      return
    }
    const vertical = options.vertical(),
      size = vertical ? contact.bounds.height : contact.bounds.width
    if (size <= 0) return
    const delta = vertical
      ? event.clientY - contact.y
      : (event.clientX - contact.x) * options.direction()
    const point = vertical
      ? event.clientY - contact.bounds.top
      : options.direction() === -1
        ? contact.bounds.right - event.clientX
        : event.clientX - contact.bounds.left
    options.update(absolute ? (point / size) * 100 : contact.value + (delta / size) * 100)
  }
  watch(
    () => [options.vertical(), options.direction(), options.disabled()],
    () => release(true),
  )
  onBeforeUnmount(() => release(true))
  onDeactivated(() => release(true))
  return {
    onKeydownCapture(event: KeyboardEvent) {
      if (event.key === 'Escape' && contact) {
        event.preventDefault()
        release(true)
      }
    },
    onPointerdown(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0 || contact || options.disabled()) return
      const bounds = options.bounds()
      if (!bounds || !options.begin()) return
      const element = event.currentTarget as HTMLElement
      contact = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        value: options.value(),
        bounds,
        element,
      }
      element.setPointerCapture(event.pointerId)
      element.focus({ preventScroll: true })
      event.preventDefault()
      if (absolute) update(event)
    },
    onPointermove: update,
    onPointerup(event: PointerEvent) {
      if (contact?.id === event.pointerId) {
        update(event)
        release(false)
      }
    },
    onPointercancel: () => release(true),
    onLostpointercapture: () => release(true),
  }
}
