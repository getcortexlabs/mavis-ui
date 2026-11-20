import type { InjectionKey } from 'nativescript-vue'

/** Text directly in a layered box starts at its top, like text in a CSS grid cell. */
export const boxLayer: InjectionKey<boolean> = Symbol('mavis.boxLayer')
