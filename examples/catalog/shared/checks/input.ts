import type { Component, InjectionKey } from 'vue'

// A platform input exercises Screen before the Mavis input API is introduced (#28).
export const checkInputKey: InjectionKey<Component> = Symbol('screen-check-input')
export interface CheckInputHandle {
  focus(): void
  blur(): void
}
