import { inject, type InjectionKey } from 'nativescript-vue'

/** Only the screen's decorative slot inherits this; modal and toast hosts do not. */
export const screenOverlay: InjectionKey<boolean> = Symbol('mavis.screenOverlay')

export function useOverlayLayout() {
  const overlay = inject(screenOverlay, false)
  return (attrs: Record<string, unknown>) => {
    if (!overlay) return {}
    const style = attrs.style as { pointerEvents?: string } | undefined
    // Explicit native gestures and the Web's pointer opt-in keep interactive
    // layers usable. Plain nested layouts let their empty area pass through.
    const interactive =
      style?.pointerEvents === 'auto' ||
      ['onTap', 'onTouch', 'onPan', 'onLongPress', 'onDoubleTap', 'onSwipe'].some(
        (name) => attrs[name],
      )
    return { isPassThroughParentEnabled: !interactive }
  }
}
