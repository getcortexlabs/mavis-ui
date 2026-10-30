import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { JoltTransition } from '@rafaelaugusto/jolt/vue'
import { revealProps } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { isAndroid, type View } from '@nativescript/core'
import { focusedView } from '../accessibility.js'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout.js'

export const MReveal = defineComponent({
  name: 'MReveal',
  inheritAttrs: false,
  props: revealProps,
  setup(props, { attrs, slots }) {
    let trigger: WeakRef<View> | undefined
    let restore = false
    return () => {
      const { show, ...layout } = props
      return h(
        JoltTransition,
        {
          enter: [{ opacity: [0, 1], y: [8, 0] }, { duration: 180 }],
          leave: [{ opacity: 0 }, { duration: 120 }],
          onBeforeEnter: (element: { nativeView?: View }) => {
            if (element.nativeView)
              element.nativeView.accessibilityHidden = Boolean(props.accessibilityHidden)
          },
          onEnter: (element: { nativeView?: View }) => {
            const page = element.nativeView?.page
            const focused = page && focusedView(page)
            trigger = focused ? new WeakRef(focused) : undefined
            restore = false
          },
          onAfterEnter: (element: { nativeView?: View }) => {
            const page = element.nativeView?.page
            notifyAccessibilityLayout(page ? focusedView(page) : undefined)
          },
          onBeforeLeave: (element: { nativeView?: View }) => {
            const view = element.nativeView
            if (!view?.page) return
            let focused = focusedView(view.page)
            while (focused && focused !== view) focused = focused.parent as View | undefined
            restore = focused === view
            view.accessibilityHidden = true
          },
          onAfterLeave: () => {
            const target = trigger?.deref()
            if (restore && target?.isLoaded) {
              if (isAndroid) target.android.performAccessibilityAction(64, null)
              else notifyAccessibilityLayout(target)
            }
            trigger = undefined
            restore = false
          },
        },
        {
          default: () =>
            show ? h(MColumn, mergeProps(layout, attrs, { key: 'content' }), slots) : null,
        },
      )
    }
  },
})
