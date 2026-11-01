import { defineComponent, h, mergeProps, onBeforeUnmount, watch } from 'nativescript-vue'
import { Application, type EventData, type View } from '@nativescript/core'
import { animate, onReducedMotion, reducedMotion, set } from '@rafaelaugusto/jolt'
import { skeletonProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MBox } from './layout.js'

export const MSkeleton = defineComponent({
  name: 'MSkeleton',
  inheritAttrs: false,
  props: skeletonProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    let view: View | undefined
    let motion: ReturnType<typeof animate> | undefined
    let pending: ReturnType<typeof setTimeout> | undefined
    let offMotion: (() => void) | undefined
    let suspended = Application.suspended

    function stop() {
      clearTimeout(pending)
      pending = undefined
      motion?.stop()
      motion = undefined
      if (view) set(view, { opacity: 1 })
    }
    function update() {
      if (!view || suspended || !props.animated || reducedMotion()) {
        stop()
        return
      }
      if (motion || pending !== undefined) return
      // Let loaded finish syncing native styles before attaching the opacity animation.
      pending = setTimeout(() => {
        pending = undefined
        if (!view || suspended || !props.animated || reducedMotion()) return
        motion = animate(
          view,
          { opacity: [1, 0.45, 1] },
          { duration: 1600, ease: 'easeInOut', repeat: Infinity },
        )
      }, 0)
    }

    function suspend() {
      suspended = true
      stop()
    }
    function resume() {
      suspended = false
      update()
    }
    function release() {
      stop()
      offMotion?.()
      offMotion = undefined
      Application.off(Application.suspendEvent, suspend)
      Application.off(Application.resumeEvent, resume)
      view = undefined
    }
    function loaded(event: EventData) {
      release()
      view = event.object as View
      suspended = Application.suspended
      offMotion = onReducedMotion(update)
      Application.on(Application.suspendEvent, suspend)
      Application.on(Application.resumeEvent, resume)
      update()
    }
    watch(() => props.animated, update, { flush: 'post' })
    onBeforeUnmount(release)

    return () =>
      h(
        MBox,
        mergeProps({ style: { alignSelf: 'flex-start' } }, attrs, {
          id: props.id,
          width: props.width,
          height: props.height,
          radius: props.radius,
          grow: props.grow,
          shrink: props.shrink,
          backgroundColor: theme.value.colors.border,
          accessible: false,
          accessibilityHidden: true,
          isUserInteractionEnabled: false,
          onLoaded: loaded,
          onUnloaded: release,
        }),
      )
  },
})
