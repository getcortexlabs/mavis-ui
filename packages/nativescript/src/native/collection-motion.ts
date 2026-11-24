import { LayoutBase, isIOS, type View } from '@nativescript/core'
import { scrollHeader, type MotionScope } from '@rafaelaugusto/jolt'
import { reorder, type Reorder } from '@rafaelaugusto/jolt/reorder'
import {
  mapMotionItems,
  type MotionRegionAdapter,
  type MotionSurfaceAdapter,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeScrollElement } from './scroll-motion.js'

const headerInsets = new WeakMap<LayoutBase, { previous: boolean; owners: number }>()
function retainHeaderLayout(header: LayoutBase) {
  if (!isIOS) return () => {}
  const state = headerInsets.get(header) ?? { previous: header.iosIgnoreSafeArea, owners: 0 }
  state.owners++
  headerInsets.set(header, state)
  header.iosIgnoreSafeArea = true
  let released = false
  return () => {
    if (released) return
    released = true
    if (--state.owners) return
    headerInsets.delete(header)
    if (header.iosIgnoreSafeArea === true) header.iosIgnoreSafeArea = state.previous
  }
}

export function nativeCollectionMotion(
  target: View,
  resolve: (surface: MotionSurfaceAdapter) => View,
  scope: MotionScope,
): Pick<MotionRegionAdapter, 'scrollHeader' | 'reorder'> {
  return {
    scrollHeader(source, options) {
      const {
        header,
        artwork,
        title,
        toolbar,
        toolbarTitle,
        section,
        items,
        expanded,
        minimum,
        onRefresh,
        ...rest
      } = options
      const scrollView = nativeScrollElement(source)
      const headerView = resolve(header)
      if (!(headerView instanceof LayoutBase))
        throw new TypeError('Use a layout surface for the header.')
      const artworkView = resolve(artwork)
      // The moving header already sits inside MScreen's safe area. Reapplying
      // UIKit's changing insets to its children would shift them during reflow.
      const restoreHeader = retainHeaderLayout(headerView)
      let headerControl: ReturnType<typeof scrollHeader>
      const syncAnchor = () => {
        // Android publishes programmatic scrolling to Jolt on the next draw.
        if (
          !isIOS &&
          !headerControl.disposed &&
          Math.abs(headerControl.state.offset - scrollView.verticalOffset) > 0.5
        )
          return headerControl.remeasure()
      }
      try {
        headerControl = scrollHeader(scrollView, {
          ...rest,
          onRefresh:
            onRefresh &&
            ((context) =>
              onRefresh({
                get cancelled() {
                  return context.cancelled
                },
                async commit(change) {
                  if (context.cancelled) return false
                  await syncAnchor()
                  return context.commit(change)
                },
              })),
          header: headerView,
          artwork: artworkView,
          title: resolve(title),
          toolbar: resolve(toolbar),
          toolbarTitle: resolve(toolbarTitle),
          section: resolve(section),
          expandedHeight: expanded,
          minimumHeight: minimum,
          items: () => mapMotionItems(items(), resolve),
        })
      } catch (error) {
        restoreHeader()
        throw error
      }
      const control = headerControl
      let released = false
      const lifetime = scope.add({
        dispose() {
          if (released) return
          released = true
          try {
            control.dispose()
          } finally {
            restoreHeader()
          }
        },
      })
      return {
        get ready() {
          return control.ready
        },
        get state() {
          return {
            offset: control.state.offset,
            refreshing: control.state.refresh === 'refreshing',
          }
        },
        refresh: () => control.refresh(),
        cancelRefresh: () => control.cancelRefresh(),
        remeasure: () => control.remeasure(),
        async preserveAnchor(change) {
          await syncAnchor()
          if (!control.disposed) await control.preserveAnchor(change)
        },
        scrollToItem(key, animated = true) {
          const index = items().findIndex((item) => item.key === key)
          if (index < 0) return false
          control.scrollToItem(index, animated)
          return true
        },
        scrollToTop: (animated = true) => control.scrollToTop(animated),
        pause: () => control.pause(),
        play: () => control.play(),
        dispose: () => lifetime.dispose(),
      }
    },
    reorder(options) {
      const { container, items, scroll, accessibility, ...rest } = options
      const layout = resolve(container)
      if (!(layout instanceof LayoutBase))
        throw new TypeError('Use a layout motion surface for retained rows.')
      let control: Reorder<string> | undefined
      let disposed = false,
        paused = false,
        queued = false
      const attach = () => {
        if (disposed || control) return
        layout.off('layoutChanged', laidOut)
        control = reorder(layout, {
          ...rest,
          scroll: nativeScrollElement(scroll),
          items: () => mapMotionItems(items(), resolve),
          accessibility: { moveUp: accessibility?.moveUp, moveDown: accessibility?.moveDown },
        })
        if (paused) control.pause()
      }
      // `loaded` precedes native layout. Wait for that lifecycle boundary once;
      // Jolt owns subsequent geometry updates, gestures and animation scheduling.
      const laidOut = () => {
        if (queued) return
        queued = true
        void Promise.resolve().then(attach)
      }
      if (layout.isLayoutValid && layout.getActualSize().height > 0) attach()
      else layout.on('layoutChanged', laidOut)
      return scope.add({
        get activeKey() {
          return control?.activeKey
        },
        move: (key: string, before: string | null) => control?.move(key, before) ?? false,
        moveUp: (key: string) => control?.moveUp(key) ?? false,
        moveDown: (key: string) => control?.moveDown(key) ?? false,
        refresh: () => control?.refresh(),
        cancel: () => control?.cancel(),
        pause() {
          paused = true
          control?.pause()
        },
        play() {
          paused = false
          control?.play()
        },
        dispose() {
          disposed = true
          layout.off('layoutChanged', laidOut)
          control?.dispose()
          control = undefined
        },
      })
    },
  }
}
