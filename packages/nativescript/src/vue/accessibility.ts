import {
  computed,
  defineComponent,
  inject,
  provide,
  type InjectionKey,
  type Ref,
} from 'nativescript-vue'
import { viewAttrs } from '@getcortexlabs/mavis-core/vue'
import type { EventData, Page, View } from '@nativescript/core'

const focusedViews = new WeakMap<Page, WeakRef<View>>()
export const focusedView = (page: Page) => focusedViews.get(page)?.deref()

const actionChildren: InjectionKey<Readonly<Ref<boolean>>> = Symbol('mavis.actionChildren')

/** A logical provider: it adds no native view or spacing to the card. */
export const ActionChildren = defineComponent({
  props: { hidden: Boolean },
  setup(props, { slots }) {
    const parent = inject(actionChildren, undefined)
    provide(
      actionChildren,
      computed(() => Boolean(parent?.value || props.hidden)),
    )
    return () => slots.default?.()
  },
})

export function useNativeViewAttrs(props: {
  id?: string
  accessibilityLabel?: string
  accessibilityHidden?: boolean
}) {
  const parent = inject(actionChildren, undefined)
  return () => ({
    ...viewAttrs({
      id: props.id,
      accessibilityLabel: props.accessibilityLabel,
      accessibilityHidden: props.accessibilityHidden,
    }),
    accessibilityHidden: parent
      ? Boolean(parent.value || props.accessibilityHidden)
      : props.accessibilityHidden,
    onAccessibilityFocus(event: EventData) {
      const view = event.object as View
      if (view.page) focusedViews.set(view.page, new WeakRef(view))
    },
  })
}
