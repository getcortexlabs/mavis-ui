# Mavis UI for NativeScript

NativeScript components and themes for Mavis UI `0.1.0-alpha.2`, starting with Vue. Experimental prerelease for testing in real apps; the API can change between alpha versions. Licensed under MIT.

In an existing NativeScript-Vue application:

```sh
npm install @getcortexlabs/mavis@0.1.0-alpha.2 @rafaelaugusto/jolt@0.1.0-rc.1
```

```ts
import { createApp, h } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import App from './App.vue'

// App.vue has one MScreen at its root.
createApp({ render: () => h('Frame', {}, [h(App)]) })
  .use(createMavis())
  .start()
```

Use the existing navigation host when your app already has one. MScreen represents a native Page; do not nest Screens. Android keyboard avoidance requires `adjustResize` on the Activity.

The plugin registers Screen, Row, Column, Box, Card, Text, Icon, Button, Input, Slider and Reveal. Icons use the bundled Lucide font: copy `fonts/lucide.ttf` from this package into the app's `fonts` folder. Use `MButton` or `m-button` in Vue templates; with `@nativescript/vite`, use `MButton`, because that integration compiles hyphenated tags as native elements. Both `@nativescript/webpack` and `@nativescript/vite` pick up the Mavis iOS and Android files. Themes are exported from `@getcortexlabs/mavis`; components and theme context are available from `/vue`.

- `@getcortexlabs/mavis-core`: shared themes, spacing, slider step conversion and Vue context.
- `src/native/`: NativeScript behavior, including owned Jolt press effects.
- `platforms/android/java/`: the native flex measurement adapter, compiled by NativeScript.
- `src/vue/`: Vue components, reactive theme context, and optional global registration.

The root entry exports themes and their types. The `/vue` entry exports components, `createMavis`, and `useMavisTheme`. `createMavis({ theme, darkTheme })` follows the device appearance and `setAppearance` overrides it. NativeScript Core 9.1.3+, Jolt 0.1.0-rc.1+, and NativeScript-Vue 3.1.3+ are the initial baseline. The consuming Vue app installs all three; Vue is optional on the package metadata so importing theme values does not require a Vue renderer.

Tested package-consumer baseline: NativeScript Core 9.1.3, NativeScript-Vue 3.1.3, Jolt 0.1.0-rc.1, Android runtime 9.1.1 and iOS runtime 9.1.0. See [Getting started](https://mavis-ui.getcortexlabs.com/guide/foundation) for setup.

Changes to the Android adapter require a native build. If an existing checkout reports a missing `com.mavis.ui.FlexLayout` after upgrading, run `ns clean` in the app directory and rebuild to regenerate native metadata.

Other NativeScript frameworks come after the Vue implementation. No adapters for React Native, Flutter, or direct native use are implemented here.

Deep native layouts can be expensive ([#56](https://github.com/getcortexlabs/mavis-ui/issues/56)); VoiceOver can skip a newly inserted offscreen status ([#54](https://github.com/getcortexlabs/mavis-ui/issues/54)). Physical Android and full keyboard coverage remain pending. Read the [release notes](https://github.com/getcortexlabs/mavis-ui/blob/main/CHANGELOG.md) before adopting the alpha.
