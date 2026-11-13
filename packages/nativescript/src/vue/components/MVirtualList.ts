import type { VirtualListComponent } from '@getcortexlabs/mavis-core/vue'
import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  registerElement,
  shallowRef,
  useItemTemplates,
  watch,
} from 'nativescript-vue'
import {
  isAndroid,
  ListView as NativeList,
  type EventData,
  type ItemEventData,
} from '@nativescript/core'
import { listChanges, type ListChanges } from '@rafaelaugusto/jolt'
import { useMavisTheme, virtualListProps } from '@getcortexlabs/mavis-core/vue'
import {
  choiceKey,
  componentMotion,
  virtualKeys,
  virtualWindow,
  type VirtualListHandle,
} from '@getcortexlabs/mavis-core'
import { MText } from './MText.js'

// Core owns placement/recycling. Vue owns the contents, with no independent items watcher.
registerElement('MavisVirtualList', () => NativeList, { viewFlags: 8 })

const VirtualList = defineComponent({
  name: 'MVirtualList',
  inheritAttrs: false,
  props: virtualListProps,
  setup(props, { attrs, slots, expose }) {
    const { theme } = useMavisTheme()
    const list = shallowRef<NativeList>()
    let rendered: readonly unknown[] = [...props.items]
    let controller: ListChanges<unknown> | undefined
    let requested = props.initialIndex
    const key = (item: unknown) => virtualKeys([item], props.itemKey)[0]!
    const templates = useItemTemplates({
      componentName: 'MVirtualList',
      slots: {
        default: ({ item, index }) => [
          h('GridLayout', { height: props.rowHeight, bindingContext: item }, [
            h(
              'GridLayout',
              { key: choiceKey(key(item)), height: props.rowHeight },
              slots.default?.({ item, index, itemKey: key(item) }),
            ),
          ]),
        ],
      },
    })
    function renderItem(data: EventData) {
      const event = data as ItemEventData
      const item = rendered[event.index]
      if (item === undefined) return
      event.view = templates.renderCell(
        { item, index: event.index, even: event.index % 2 === 0, odd: event.index % 2 !== 0 },
        event.view,
      )
    }
    function clear() {
      list.value?.off(NativeList.itemLoadingEvent, renderItem)
      controller?.dispose()
      controller = undefined
    }
    function attach() {
      clear()
      const view = list.value
      if (!view?.isLoaded) return
      controller = listChanges(view, {
        key: (item) => choiceKey(key(item)),
        rowHeight: props.rowHeight,
        move: componentMotion(theme.value, 'layout'),
        enter: true,
        exit: 'fadeOut',
      })
      if (!props.animated) controller.pause()
      // Jolt subscribed first: recycle notification clears the old key's motion
      // before Vue patches the reused cell with another item.
      view.on(NativeList.itemLoadingEvent, renderItem)
    }
    function scrollToIndex(index: number) {
      if (!Number.isInteger(index) || index < 0 || index >= props.items.length)
        throw new RangeError('List index is out of range.')
      requested = index
      controller?.stop()
      list.value?.scrollToIndex(index)
    }
    expose({ scrollToIndex } satisfies VirtualListHandle)
    watch(
      () => props.items.map((item) => ({ item, key: key(item) })),
      () => {
        virtualKeys(props.items, props.itemKey)
        rendered = [...props.items]
        if (controller && !controller.disposed) controller.update(rendered)
        else if (list.value) list.value.items = [...rendered]
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
        attach()
      },
      { flush: 'post' },
    )
    onBeforeUnmount(clear)
    return () => {
      virtualWindow(props.items.length, props.rowHeight, props.height, 0, props.overscan)
      virtualKeys(props.items, props.itemKey)
      if (!props.label.trim()) throw new TypeError('Virtual lists require a label.')
      if (!Number.isInteger(props.initialIndex) || props.initialIndex < 0)
        throw new RangeError('initialIndex must be a nonnegative integer.')
      const content = h(
        'MavisVirtualList',
        mergeProps(attrs, {
          id: props.id,
          rowHeight: props.rowHeight,
          height: props.height,
          separatorColor: 'transparent',
          accessibilityLabel: props.label,
          itemTemplates: templates.itemTemplates,
          itemTemplateSelector: () => 'default',
          onLoaded: (event: EventData) => {
            const view = (list.value = event.object as NativeList)
            if (!isAndroid) view.rowHeight = 'auto'
            view.rowHeight = props.rowHeight
            rendered = [...props.items]
            view.on(NativeList.itemLoadingEvent, renderItem)
            view.items = [...rendered]
            attach()
            void nextTick(() => {
              if (view.isLoaded && rendered.length)
                view.scrollToIndex(Math.min(requested, rendered.length - 1))
            })
          },
          onUnloaded: () => {
            clear()
            list.value = undefined
          },
        }),
        templates.cellVNodes(),
      )
      // The stable exact-size parent avoids iOS width-mode reloads and keeps the
      // native list alive when the data becomes empty.
      return h('GridLayout', { rows: '*', columns: '*', height: props.height }, [
        content,
        ...(!props.items.length
          ? (slots.empty?.() ?? [h(MText, { text: props.emptyLabel, tone: 'muted' })])
          : []),
      ])
    }
  },
})

export const MVirtualList = VirtualList as unknown as VirtualListComponent
