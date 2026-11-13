import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useMotionContext } from '../motion-context.js'
import { useConnectedMotion } from '../connected-motion.js'
import type { ListChanges } from '@rafaelaugusto/jolt/web'
import type { VirtualListComponent } from '@getcortexlabs/mavis-core/vue'
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  mergeProps,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { virtualListProps } from '@getcortexlabs/mavis-core/vue'
import {
  choiceKey,
  componentMotion,
  virtualAnchor,
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
    const instance = getCurrentInstance()!
    const { theme } = useMavisTheme()
    const rendered = shallowRef<readonly unknown[]>([...props.items])
    const keys = computed(() => virtualKeys(rendered.value, props.itemKey))
    const root = ref<HTMLElement>()
    let controller: ListChanges<unknown> | undefined
    let notifyRecycling: ((target: HTMLElement) => void) | undefined
    const rowElements = new Map<string, HTMLElement>()
    const offset = ref(props.initialIndex * props.rowHeight)
    const focusedKey = ref<string>()
    const window = computed(() =>
      virtualWindow(
        rendered.value.length,
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
    function commit(items: readonly unknown[]) {
      const next = virtualKeys(items, props.itemKey)
      const anchored = virtualAnchor(keys.value, next, props.rowHeight, props.height, offset.value)
      // Reconcile the window and its anchor together. A shorter spacer can make
      // the browser clamp scrollTop and dispatch scroll before Jolt's deferred
      // layout pass; that event would cancel the pending anchor restoration.
      rendered.value = [...items]
      offset.value = anchored
      instance.update()
      syncOffset()
    }
    useConnectedMotion(root, useMotionContext(), (runtime, target) => {
      const owned = runtime.listChanges(target, {
        key: (item) => choiceKey(virtualKeys([item], props.itemKey)[0]!),
        move: componentMotion(theme.value, 'layout'),
        enter: true,
        exit: 'fadeOut',
        adapter: {
          virtualized: true,
          items: () => rendered.value,
          render: commit,
          rows: () => [...rowElements].map(([key, target]) => ({ key, target })),
          anchor: (previous) => {
            const before = offset.value
            return (next) => {
              offset.value = virtualAnchor(previous, next, props.rowHeight, props.height, before)
              instance.update()
              syncOffset()
            }
          },
          observeRecycling: (notify) => {
            notifyRecycling = notify
            return () => {
              notifyRecycling = undefined
            }
          },
        },
      })
      controller = owned
      if (!props.animated) owned.pause()
      return () => {
        owned.dispose()
        if (controller === owned) controller = undefined
      }
    })
    watch(
      () => props.items.map((item) => ({ item, key: virtualKeys([item], props.itemKey)[0]! })),
      () => {
        const next = virtualKeys(props.items, props.itemKey)
        if (focusedKey.value && !next.some((key) => choiceKey(key) === focusedKey.value)) {
          if (root.value?.contains(document.activeElement))
            root.value.focus({ preventScroll: true })
          focusedKey.value = undefined
        }
        if (controller && !controller.disposed) controller.update([...props.items])
        else commit(props.items)
      },
      { flush: 'pre' },
    )
    watch(
      () => props.animated,
      (enabled) => (enabled ? controller?.play() : controller?.pause()),
    )
    watch(
      () => [props.rowHeight, props.height],
      () => {
        controller?.stop()
        void nextTick(syncOffset)
      },
    )
    onMounted(syncOffset)
    expose({
      scrollToIndex(index: number) {
        if (!Number.isInteger(index) || index < 0 || index >= props.items.length)
          throw new RangeError('List index is out of range.')
        controller?.stop()
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
            const next = root.value?.scrollTop ?? 0
            if (next !== offset.value) controller?.stop()
            offset.value = next
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
        rendered.value.length
          ? [
              h(
                'div',
                {
                  role: 'list',
                  style: { height: `${state.totalHeight}px`, position: 'relative' },
                },
                [...indices]
                  .sort((a, b) => a - b)
                  .map((index) => {
                    const itemKey = keys.value[index]!
                    const key = choiceKey(itemKey)
                    return h(
                      'div',
                      {
                        key,
                        ref: (element: unknown) => {
                          if (element instanceof HTMLElement) rowElements.set(key, element)
                          else rowElements.delete(key)
                        },
                        onVnodeBeforeUnmount: (node: { el?: unknown }) => {
                          if (node.el instanceof HTMLElement) notifyRecycling?.(node.el)
                        },
                        role: 'listitem',
                        'data-m-list-key': key,
                        'aria-posinset': index + 1,
                        'aria-setsize': rendered.value.length,
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
                        item: rendered.value[index],
                        index,
                        itemKey,
                      }),
                    )
                  }),
              ),
            ]
          : (slots.empty?.() ?? [h(MText, { text: props.emptyLabel, tone: 'muted' })]),
      )
    }
  },
})

export const MVirtualList = VirtualList as unknown as VirtualListComponent
