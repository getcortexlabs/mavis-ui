import type { InjectionKey } from 'nativescript-vue'

/** Something other than a page that the Android system back should reach first. */
export interface SystemBackClaimant {
  /** Whether it wants the next back press or gesture. */
  owns(): boolean
  /** Takes the press. */
  back(): void
}
export type ClaimSystemBack = (claimant: SystemBackClaimant) => () => void

export const systemBackKey: InjectionKey<ClaimSystemBack | undefined> = Symbol('mavis.systemBack')
