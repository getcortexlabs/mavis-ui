import type { TapGestureEventData, View } from '@nativescript/core'

/** A child's native control owns its hit; blank space still belongs to the card. */
export function ownsCardTap(event?: Partial<TapGestureEventData>): boolean {
  const card = (event?.object ?? event?.view) as View | undefined
  if (!card || !event?.getX || !event.getY) return true
  const x = event.getX(),
    y = event.getY()
  if (!Number.isFinite(x) || !Number.isFinite(y)) return true
  const containsControl = (view: View): boolean => {
    if (view.visibility !== undefined && view.visibility !== 'visible') return false
    if (
      /^(MavisButton|Button|TextField|TextView|SearchBar|Switch|Slider|DatePicker|TimePicker|ListPicker|SegmentedBar|WebView)$/.test(
        view.typeName,
      ) ||
      ['button', 'link', 'checkbox', 'radio', 'switch', 'slider', 'combobox', 'tab'].includes(
        view.accessibilityRole,
      )
    ) {
      const origin = view.getLocationRelativeTo(card)
      const size = view.getActualSize()
      if (
        origin &&
        x >= origin.x &&
        y >= origin.y &&
        x <= origin.x + size.width &&
        y <= origin.y + size.height
      )
        return true
    }
    let found = false
    view.eachChildView?.((child) => {
      found = containsControl(child)
      return !found
    })
    return found
  }
  let found = false
  card.eachChildView?.((child) => {
    found = containsControl(child)
    return !found
  })
  return !found
}
