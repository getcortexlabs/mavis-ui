import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from '../motion-region.js'
import type { VirtualListComponent } from '@getcortexlabs/mavis-core/vue'
import { computed, defineComponent, h, mergeProps, nextTick, onMounted, ref, watch } from 'vue'
import { virtualListProps } from '@getcortexlabs/mavis-core/vue'
import {
  choiceKey,
  virtualKeys,
  virtualWindow,
  type VirtualListHandle,
} from '@getcortexlabs/mavis-core'
import { MText } from './MText.js'

const VirtualList = defineComponent({
  name: 'MVirtualList',
  inheritAttrs: false,
  props: virtualListProps,
  setup(props, { attrs, slots, expose }) {
    const keys = computed(() => virtualKeys(props.items, props.itemKey))
    // Only data mutations animate the realized window. Scrolling never starts motion.
    const layout = useComponentLayout(() => keys.value, false)
    const motion = useMotionRegion(() => layout)
    const root = ref<HTMLElement>()
    const offset = ref(props.initialIndex * props.rowHeight)
    const focusedKey = ref<string>()
    const window = computed(() =>
      virtualWindow(
        props.items.length,
        props.rowHeight,
        props.height,
        offset.value,
        props.overscan,
      ),
    )
    function syncOffset() {
      offset.value = window.value.scrollTop
      if (root.value) root.value.scrollTop = offset.value
    }
    watch(
      keys,
      (next, previous) => {
        const index = Math.floor(offset.value / props.rowHeight)
        const anchor = previous[index]
        const newIndex = anchor === undefined ? -1 : next.indexOf(anchor)
        if (newIndex >= 0)
          offset.value = newIndex * props.rowHeight + (offset.value % props.rowHeight)
        if (focusedKey.value && !next.some((key) => choiceKey(key) === focusedKey.value)) {
          if (root.value?.contains(document.activeElement))
            root.value.focus({ preventScroll: true })
          focusedKey.value = undefined
        }
        void nextTick(syncOffset)
      },
      { flush: 'pre' },
    )
    watch(
      () => [props.rowHeight, props.height],
      () => void nextTick(syncOffset),
    )
    onMounted(syncOffset)
    expose({
      scrollToIndex(index: number) {
        if (!Number.isInteger(index) || index < 0 || index >= props.items.length)
          throw new RangeError('List index is out of range.')
        offset.value = index * props.rowHeight
        syncOffset()
      },
    } satisfies VirtualListHandle)
    return () => {
      if (!props.label.trim()) throw new TypeError('Virtual lists require a label.')
      if (!Number.isInteger(props.initialIndex) || props.initialIndex < 0)
        throw new RangeError('initialIndex must be a nonnegative integer.')
      const state = window.value
      const indices = new Set(
        Array.from({ length: state.end - state.start }, (_, i) => state.start + i),
      )
      if (focusedKey.value) {
        const focused = keys.value.findIndex((key) => choiceKey(key) === focusedKey.value)
        if (focused >= 0) indices.add(focused)
      }
      return h(
        'div',
        mergeProps(attrs, {
          ref: root,
          id: props.id,
          role: 'region',
          'aria-label': props.label,
          tabindex: 0,
          class: 'm-virtual-list',
          style: {
            height: `${props.height}px`,
            overflow: 'auto',
            position: 'relative',
            overflowAnchor: 'none',
            flexShrink: 0,
          },
          onScroll: () => {
            offset.value = root.value?.scrollTop ?? 0
          },
          onFocusin: (event: FocusEvent) => {
            focusedKey.value = (event.target as HTMLElement).closest<HTMLElement>(
              '[data-m-list-key]',
            )?.dataset.mListKey
          },
          onFocusout: () =>
            void nextTick(() => {
              if (!root.value?.contains(document.activeElement)) focusedKey.value = undefined
            }),
        }),
        props.items.length
          ? [
              h(
                'div',
                {
                  ...motion,
                  role: 'list',
                  style: { height: `${state.totalHeight}px`, position: 'relative' },
                },
                [...indices]
                  .sort((a, b) => a - b)
                  .map((index) =>
                    h(
                      'div',
                      {
                        key: choiceKey(keys.value[index]!),
                        role: 'listitem',
                        'data-m-list-key': choiceKey(keys.value[index]!),
                        'aria-posinset': index + 1,
                        'aria-setsize': props.items.length,
                        style: {
                          position: 'absolute',
                          top: `${index * props.rowHeight}px`,
                          left: 0,
                          right: 0,
                          height: `${props.rowHeight}px`,
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                        },
                      },
                      slots.default?.({
                        item: props.items[index],
                        index,
                        itemKey: keys.value[index]!,
                      }),
                    ),
                  ),
              ),
            ]
          : (slots.empty?.() ?? [h(MText, { text: props.emptyLabel, tone: 'muted' })]),
      )
    }
  },
})

export const MVirtualList = VirtualList as unknown as VirtualListComponent
