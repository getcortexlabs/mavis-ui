import { inject, type InjectionKey } from 'nativescript-vue'

export const layoutDirection: InjectionKey<'row' | 'column'> = Symbol('mavis.layout')

/** Rows may wrap text to fit their width; columns preserve the natural height of content. */
export function useDefaultShrink(): number {
  return inject(layoutDirection, 'column') === 'row' ? 1 : 0
}
