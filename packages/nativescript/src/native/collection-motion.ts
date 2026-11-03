import { LayoutBase, type View } from '@nativescript/core'
import { scrollHeader, type MotionScope } from '@rafaelaugusto/jolt'
import { reorder } from '@rafaelaugusto/jolt/reorder'
import {
  mapMotionItems,
  type MotionRegionAdapter,
  type MotionSurfaceAdapter,
} from '@getcortexlabs/mavis-core/experimental'
import { nativeScrollElement } from './scroll-motion.js'

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
        ...rest
      } = options
      const headerView = resolve(header)
      if (!(headerView instanceof LayoutBase))
        throw new TypeError('Use a layout surface for the header.')
      const control = scope.add(
        scrollHeader(nativeScrollElement(source), {
          ...rest,
          header: headerView,
          artwork: resolve(artwork),
          title: resolve(title),
          toolbar: resolve(toolbar),
          toolbarTitle: resolve(toolbarTitle),
          section: resolve(section),
          expandedHeight: expanded,
          minimumHeight: minimum,
          items: () => mapMotionItems(items(), resolve),
        }),
      )
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
        preserveAnchor: (change) => control.preserveAnchor(change),
        scrollToItem(key, animated = true) {
          const index = items().findIndex((item) => item.key === key)
          if (index < 0) return false
          control.scrollToItem(index, animated)
          return true
        },
        scrollToTop: (animated = true) => control.scrollToTop(animated),
        pause: () => control.pause(),
        play: () => control.play(),
        dispose: () => control.dispose(),
      }
    },
    reorder(options) {
      const { container, items, scroll, accessibility, ...rest } = options
      const layout = resolve(container)
      if (!(layout instanceof LayoutBase))
        throw new TypeError('Use a layout motion surface for retained rows.')
      const control = scope.add(
        reorder(layout, {
          ...rest,
          scroll: nativeScrollElement(scroll),
          items: () => mapMotionItems(items(), resolve),
          accessibility: { moveUp: accessibility?.moveUp, moveDown: accessibility?.moveDown },
        }),
      )
      return {
        get activeKey() {
          return control.activeKey
        },
        move: (key, before) => control.move(key, before),
        moveUp: (key) => control.moveUp(key),
        moveDown: (key) => control.moveDown(key),
        refresh: () => control.refresh(),
        cancel: () => control.cancel(),
        pause: () => control.pause(),
        play: () => control.play(),
        dispose: () => control.dispose(),
      }
    },
  }
}
