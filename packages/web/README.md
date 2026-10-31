# Mavis for Vue Web

Vue Web implementation of the eleven Mavis components, version `0.1.0-alpha.2`. Experimental prerelease for testing in real apps; the API can change between alpha versions. Licensed under MIT.

In an existing Vue application:

```sh
npm install @getcortexlabs/mavis-web@0.1.0-alpha.2
```

```ts
import { createApp } from 'vue'
import { createMavis } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'
import App from './App.vue'

createApp(App).use(createMavis()).mount('#app')
```

The stylesheet supplies focus indicators, box overlays, and motion. The plugin registers Screen, Row, Column, Box, Card, Text, Icon, Button, Input, Slider, Sheet and Reveal; Vue also accepts their `m-*` spellings.

Themes and Vue context come from `@getcortexlabs/mavis-core`. NativeScript and Jolt are not dependencies of this package. Browser motion currently uses CSS; [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236) tracks its Web backend.

Use `MText.as` for HTML heading semantics. Buttons emit a payload-free `click` and retain native HTML keyboard activation. Sliders expose semantic values to accessibility APIs, including fractional steps. Theme state belongs to each app. The package is safe to import during server rendering.

Tested with Vue 3.5.42, Vite 6.4.5, TypeScript 6.0.3 and vue-tsc 3.3.13. See the [Web guide](https://mavis-ui.getcortexlabs.com/guide/web) for setup and portability limits, and the [release notes](https://github.com/getcortexlabs/mavis-ui/blob/main/CHANGELOG.md) for the alpha boundary.
