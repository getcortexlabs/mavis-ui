import { svelteNative } from '@nativescript-community/svelte-native'
import Catalog from './Catalog.svelte'
import { bridge } from './_model'
class OwnedCatalog extends Catalog {
  constructor(options: ConstructorParameters<typeof Catalog>[0]) {
    super(options)
    // Core 9 can emit launch before Svelte Native resolves its page instance.
    // Take disposal ownership from the actual public component constructor.
    bridge.dispose = () => this.$destroy()
  }
}
export function start() {
  void svelteNative(OwnedCatalog, {})
}
