# Mavis for Vue Web

Vue Web components and themes for Mavis UI, version `0.1.0-alpha.8`. Experimental prerelease for testing in real apps; the API can change between alpha versions. Licensed under MIT.

In an existing Vue application:

```sh
npm install @getcortexlabs/mavis-web@0.1.0-alpha.8 @rafaelaugusto/jolt@0.1.0-rc.10
```

```ts
import { createApp } from 'vue'
import { createMavis } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'
import App from './App.vue'

createApp(App).use(createMavis()).mount('#app')
```

The stylesheet supplies focus indicators, box overlays, and motion. The plugin registers the layout, typography, form, selection, feedback and overlay components, including scoped themes and inline text. Vue also accepts their `m-*` spellings. See the [component reference](https://mavis-ui.getcortexlabs.com/components/) for the full catalog.

Themes and Vue context come from `@getcortexlabs/mavis-core`. This source checkout requires Jolt 0.1.0-rc.10 as a peer for component motion and deferred DOM attachment. Browser consumers do not install NativeScript; Mavis uses only Jolt /web and /web/vue. See the [motion guide](https://mavis-ui.getcortexlabs.com/guide/motion).

Use `MText.as` for HTML heading semantics. Buttons emit a payload-free `click` and retain native HTML keyboard activation. Sliders expose semantic values to accessibility APIs, including fractional steps. Theme state belongs to each app. The package is safe to import during server rendering.

Tested with Vue 3.5.42, Vite 6.4.5, TypeScript 6.0.3 and vue-tsc 3.3.13. See the [Web guide](https://mavis-ui.getcortexlabs.com/guide/web) for setup and portability limits, and the [release notes](https://github.com/getcortexlabs/mavis-ui/blob/main/CHANGELOG.md) for the alpha boundary.

Alpha.8 requires Jolt **0.1.0-rc.10** for the experimental visual effects, retained collections, platform motion and sensor integrations. Keep the Mavis packages at the same version. Rebuild native applications after upgrading Jolt.
