import type { InjectionKey } from 'nativescript-vue'

/** The nearest box's projection distance. A box without one clears it, as CSS does. */
export const perspectiveKey: InjectionKey<() => number | undefined> = Symbol('mavis.perspective')
