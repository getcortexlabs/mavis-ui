import { svelteNative } from '@nativescript-community/svelte-native'
import Catalog from './Catalog.svelte'
import { bridge } from './_model'
export function start() {
  void svelteNative(Catalog, {}).then((component) => {
    bridge.dispose = () => component.$destroy()
  })
}
