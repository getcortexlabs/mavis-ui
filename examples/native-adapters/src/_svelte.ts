import { svelteNative, svelteNativeNoFrame } from '@nativescript-community/svelte-native'
import Catalog from './Catalog.svelte'
import { bridge } from './_model'
declare const __SVELTE_NO_FRAME__: boolean
export function start() {
  const boot = __SVELTE_NO_FRAME__ ? svelteNativeNoFrame : svelteNative
  void boot(Catalog, {}).then((component) => {
    bridge.bootstrapped = !!component && typeof component.$destroy === 'function'
    bridge.dispose = () => component.$destroy()
  })
}
