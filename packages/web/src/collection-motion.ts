import type { WebRuntime } from '@rafaelaugusto/jolt/web'
import {
  mapMotionItems,
  type MotionRegionAdapter,
  type MotionSurfaceAdapter,
} from '@getcortexlabs/mavis-core/experimental'
import { webScrollElement } from './scroll-motion.js'

export function webCollectionMotion(
  runtime: WebRuntime,
  target: HTMLElement,
  resolve: (surface: MotionSurfaceAdapter) => HTMLElement,
): Pick<MotionRegionAdapter, 'scrollHeader' | 'reorder'> {
  return {
    scrollHeader(source, options) {
      const scroll = webScrollElement(source)
      if (!target.contains(scroll))
        throw new TypeError('Declare MScreen inside the header motion region.')
      const { header, artwork, title, toolbar, toolbarTitle, section, items, ...rest } = options
      const headerElement = resolve(header),
        sectionElement = resolve(section)
      const originalMargin = sectionElement.style.marginTop
      let writtenMargin: string | undefined
      const restoreSection = () => {
        if (sectionElement.style.marginTop === writtenMargin)
          sectionElement.style.marginTop = originalMargin
      }
      let control
      try {
        control = runtime.scrollHeader(scroll, {
          ...rest,
          header: headerElement,
          artwork: resolve(artwork),
          title: resolve(title),
          toolbarTitle: resolve(toolbarTitle),
          section: sectionElement,
          // Native owns the section's absolute offset; Web translates its resting layout.
          // Reuse Jolt's geometry reads so resizing never needs another observer or clock.
          expanded: () => {
            const height = options.expanded ?? headerElement.offsetHeight
            if (writtenMargin === undefined || sectionElement.style.marginTop === writtenMargin) {
              writtenMargin = `${height}px`
              sectionElement.style.marginTop = writtenMargin
            }
            return height
          },
          minimum: options.minimum ?? (() => resolve(toolbar).getBoundingClientRect().height),
          items: () => mapMotionItems(items(), resolve),
        })
      } catch (error) {
        restoreSection()
        throw error
      }
      return {
        ready: true,
        get state() {
          return { offset: control.state.offset, refreshing: control.state.refreshing }
        },
        refresh: () => control.refresh(),
        cancelRefresh: () => control.cancelRefresh(),
        remeasure: async () => {
          control.remeasure()
        },
        preserveAnchor: async (change) => {
          await control.preserveAnchor(change)
        },
        scrollToItem: (key, animated = true) =>
          control.scrollToItem(key, { behavior: animated ? 'smooth' : 'instant' }),
        scrollToTop: (animated = true) =>
          control.scrollToTop({ behavior: animated ? 'smooth' : 'instant' }),
        pause: () => control.pause(),
        play: () => control.play(),
        dispose: () => {
          try {
            control.dispose()
          } finally {
            restoreSection()
          }
        },
      }
    },
    reorder(options) {
      const { container, scroll, items, accessibility, ...rest } = options
      const read = () => mapMotionItems(items(), resolve)
      const control = runtime.reorder(resolve(container), {
        ...rest,
        items: read,
        scrollContainer: webScrollElement(scroll),
        handle: (row) => read().find((item) => item.target === row)?.handle ?? row,
        accessibility: { label: accessibility?.label, announcement: accessibility?.announcement },
      })
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
