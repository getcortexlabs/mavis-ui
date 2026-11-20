/// <reference types="@nativescript/types" />
/// <reference types="@nativescript/types-ios" />
/// <reference types="@nativescript/types-android" />

declare module '*.svelte' {
  import type { SvelteComponentTyped } from 'svelte'
  export default class Component extends SvelteComponentTyped {}
}
