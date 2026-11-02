import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { animate, animateSize } from '@rafaelaugusto/jolt'
import { motionRecipe } from '@getcortexlabs/mavis-core'
import { revealProps, useMavisTheme, useRevealState } from '@getcortexlabs/mavis-core/vue'
import { MColumn, MBox } from './layout.js'
import { isAndroid, type EventData, type View } from '@nativescript/core'
import { focusedView } from '../accessibility.js'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: revealProps,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    const state = useRevealState(() => props.show)
    let trigger: WeakRef<View> | undefined
    function activeView(root: View): View | undefined {
      if (
        isAndroid
          ? root.android?.hasFocus?.() && !root.android?.getFocusedChild?.()
          : root.ios?.isFirstResponder
      )
        return root
      let found: View | undefined
      root.eachChildView((child) => {
        found = activeView(child)
        return !found
      })
      return found
    }
    function currentFocus(view: View) {
      return view.page && (activeView(view.page) ?? focusedView(view.page))
    }
    function attach(view: View) {
      const focusability = isAndroid ? view.android.getDescendantFocusability() : undefined
      return state.attach({
        animate(open, fromClosed) {
          if (fromClosed) {
            view.height = 0
            view.opacity = 0
          }
          const recipe = motionRecipe(theme.value, open ? 'enter' : 'exit')
          const size = animateSize(view, { height: open ? 'auto' : 0 }, recipe.transition)
          const opacity = animate(view, { opacity: open ? 1 : 0 }, recipe.transition)
          return {
            finished: size.finished,
            stop() {
              size.stop({ restore: true })
              opacity.stop()
            },
          }
        },
        interactive(enabled) {
          view.accessibilityHidden = !enabled || Boolean(props.accessibilityHidden)
          view.isUserInteractionEnabled = enabled
          if (isAndroid) view.android.setDescendantFocusability(enabled ? focusability : 393216)
        },
        captureFocus() {
          const active = currentFocus(view)
          let ancestor = active
          while (ancestor && ancestor !== view) ancestor = ancestor.parent as View | undefined
          if (active && !ancestor) trigger = new WeakRef(active)
        },
        restoreFocus() {
          const focused = currentFocus(view)
          let active = focused
          while (active && active !== view) active = active.parent as View | undefined
          const target = trigger?.deref()
          if (active === view && target?.isLoaded) {
            ;(focused as View & { dismissSoftInput?(): void })?.dismissSoftInput?.()
            target.focus()
            if (isAndroid) target.android.performAccessibilityAction(64, null)
            else notifyAccessibilityLayout(target)
          }
        },
        release() {
          view.height = 'auto'
          view.opacity = 1
          if (isAndroid && view.android) view.android.setDescendantFocusability(focusability)
        },
      })
    }
    return () => {
      const { show, grow, shrink, width, id, ...content } = props
      return state.present.value
        ? h(MBox, mergeProps({ grow, shrink, width, id }, attrs), {
            default: () =>
              h(
                MBox,
                {
                  clipToBounds: true,
                  accessibilityHidden: !show || props.accessibilityHidden,
                  onLoaded: (event: EventData) => attach(event.object as View),
                  onUnloaded: state.detach,
                },
                { default: () => h(MColumn, content, slots) },
              ),
          })
        : null
    }
  },
})
