import { useComponentContent } from '@getcortexlabs/mavis-core/vue'
import { useMotionSurface } from '../use-motion-surface.js'
import type { VirtualListComponent } from '@getcortexlabs/mavis-core/vue'
import {
  computed,
  defineComponent,
  h,
  ListView,
  mergeProps,
  nextTick,
  shallowRef,
  ref,
  watch,
} from 'nativescript-vue'
import { isAndroid, type EventData, type ListView as NativeList } from '@nativescript/core'
import { virtualListProps } from '@getcortexlabs/mavis-core/vue'
import {
  choiceKey,
  virtualKeys,
  virtualWindow,
  type VirtualItemSlot,
  type VirtualListHandle,
} from '@getcortexlabs/mavis-core'
import { MText } from './MText.js'

// A recycled cell never inherits the previous item's presentation. Only a data
// revision on an already loaded logical item plays; ordinary scrolling stays still.
const RealizedContent = defineComponent({
  props: { revision: Number, height: Number },
  setup(props, { slots }) {
    const feedback = useComponentContent(() => props.revision, false)
    const motion = useMotionSurface(() => feedback)
    return () => h('GridLayout', { ...motion, height: props.height }, slots.default?.())
  },
})

const VirtualList = defineComponent({
  name: 'MVirtualList',
  inheritAttrs: false,
  props: virtualListProps,
  setup(props, { attrs, slots, expose }) {
    const keys = computed(() => virtualKeys(props.items, props.itemKey))
    const list = shallowRef<NativeList>()
    const revision = ref(0)
    let requested = props.initialIndex
    function scrollToIndex(index: number) {
      if (!Number.isInteger(index) || index < 0 || index >= props.items.length)
        throw new RangeError('List index is out of range.')
      requested = index
      list.value?.scrollToIndex(index)
    }
    expose({ scrollToIndex } satisfies VirtualListHandle)
    watch(
      keys,
      (next, previous) => {
        revision.value++
        const view = list.value
        const first = view
          ? isAndroid
            ? view.android?.getFirstVisiblePosition()
            : view.ios?.indexPathsForVisibleRows?.firstObject?.row
          : requested
        const key = previous[Math.max(0, first ?? requested)]
        const index = key === undefined ? -1 : next.indexOf(key)
        requested = Math.max(0, Math.min(index < 0 ? requested : index, next.length - 1))
        void nextTick(() => {
          if (next.length && view?.isLoaded) view.scrollToIndex(requested)
        })
      },
      { flush: 'pre' },
    )
    return () => {
      virtualWindow(props.items.length, props.rowHeight, props.height, 0, props.overscan)
      void keys.value
      if (!props.label.trim()) throw new TypeError('Virtual lists require a label.')
      if (!Number.isInteger(props.initialIndex) || props.initialIndex < 0)
        throw new RangeError('initialIndex must be a nonnegative integer.')
      if (!props.items.length)
        return h(
          'GridLayout',
          mergeProps(attrs, {
            id: props.id,
            height: props.height,
            accessibilityLabel: props.label,
          }),
          slots.empty?.() ?? [h(MText, { text: props.emptyLabel, tone: 'muted' })],
        )
      const content = h(
        ListView,
        mergeProps(attrs, {
          id: props.id,
          items: props.items,
          rowHeight: props.rowHeight,
          height: props.height,
          separatorColor: 'transparent',
          accessibilityLabel: props.label,
          onLoaded: (event: EventData) => {
            list.value = event.object as NativeList
            // Core iOS coerces a pre-mount rowHeight to auto. Reapply it once the
            // UITableView exists so its delegate and scroll geometry use fixed rows.
            if (!isAndroid) {
              list.value.rowHeight = 'auto'
              list.value.rowHeight = props.rowHeight
            }
            void nextTick(() => {
              if (list.value?.isLoaded)
                list.value.scrollToIndex(Math.min(requested, props.items.length - 1))
            })
          },
          onUnloaded: () => {
            list.value = undefined
          },
        }),
        {
          default: ({ item, index }: VirtualItemSlot) =>
            h('GridLayout', { height: props.rowHeight }, [
              // NativeScript owns cell reuse. A keyed child remounts local state when its logical item changes.
              h(
                RealizedContent,
                {
                  key: choiceKey(keys.value[index]!),
                  height: props.rowHeight,
                  revision: revision.value,
                },
                () => slots.default?.({ item, index, itemKey: keys.value[index]! }),
              ),
            ]),
        },
      )
      // A flex parent's intrinsic/exact passes alternate width measure modes.
      // Core iOS reloads UITableView when that spec changes, losing its scroll
      // offset during cell reuse. The bounded grid gives the list one exact width.
      return isAndroid
        ? content
        : h('GridLayout', { rows: '*', columns: '*', height: props.height }, [content])
    }
  },
})

export const MVirtualList = VirtualList as unknown as VirtualListComponent
