---
title: Modular installation
description: Application services, local components and selective Web icons.
---

# Modular installation

**Included in alpha.10.** `createMavisServices` installs application-scoped theme/appearance and Toast services without registering any global components. Import the components used by each Vue screen locally.

```ts
import { createApp } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import '@getcortexlabs/mavis-web/style.css'
import App from './App.vue'

createApp(App).use(createMavisServices()).mount('#app')
```

```vue
<script setup lang="ts">
import { MButton, MColumn, MText } from '@getcortexlabs/mavis-web'
</script>
<template>
  <MColumn gap="md"><MText>A local component</MText><MButton>Continue</MButton></MColumn>
</template>
```

On NativeScript, use `@getcortexlabs/mavis/vue/services` for services and import components from `@getcortexlabs/mavis/vue`. `claimSystemBack`, appearance, themes and Toast options retain their existing meanings. Each app/request owns its context and cleans it up on unmount. Use MScreen where native layers need a host.

The existing `createMavis()` still registers the complete catalog. `createMavis({ components: false })` skips registration, and `createMavis({ components: { MButton, MText } })` registers only that map. To let a bundler omit the full component registry, import `createMavisServices` from the services entry. Individual components may still include their own dependencies, such as icons or Jolt. This does not make Jolt an optional peer.

## Selective Web icons

Pass a map of SVG Vue components keyed by Mavis icon names. Import only the icons your application needs; Mavis does not depend on a second icon package.

```ts
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import SearchIcon from './icons/SearchIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'
import '@getcortexlabs/mavis-web/base.css'

const services = createMavisServices({
  icons: { search: SearchIcon, x: CloseIcon },
  iconFallback: 'none',
})
```

MIcon and Button adornments use the same app-scoped map. SVG components receive width/height and decorative accessibility attributes; MIcon retains the label on its wrapper. Prefer currentColor in custom SVGs. Missing map entries use the existing font by default; `iconFallback: 'none'` renders no glyph for missing entries. Include icons used internally by controls, such as Sheet's `x`, or keep the font fallback.

`style.css` includes all existing styles and the Lucide font definition. `base.css` contains the same component styles without a font URL. Add `icons.css` if you want the font separately. Using base.css with a complete SVG map and no font fallback avoids bundling/downloading the full icon font. The optional fallback JavaScript can remain in bundles; supplying a map alone is not a promise to eliminate its lookup table. NativeScript keeps the bundled font; SVG selection is Web-only.
