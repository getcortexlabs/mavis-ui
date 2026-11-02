import { computed, inject, unref, type InjectionKey, type Ref } from '@vue/runtime-core'

export const layoutDirection: InjectionKey<'row' | 'column' | Readonly<Ref<'row' | 'column'>>> =
  Symbol('mavis.layout')

/** Rows may wrap text to fit their width; columns preserve the natural height of content. */
export function useDefaultShrink(): number {
  return unref(inject(layoutDirection, 'column')) === 'row' ? 1 : 0
}

/** A responsive parent changes direction without replacing its children. */
export function useLayoutShrink() {
  const direction = inject(layoutDirection, 'column')
  return computed(() => (unref(direction) === 'row' ? 1 : 0))
}
