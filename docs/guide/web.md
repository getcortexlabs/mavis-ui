---
title: Share a screen with the Web
description: Run the same Mavis Vue screens on NativeScript and the Web. Explore shared themes, native and HTML components, and the component catalog.
---

# Share a screen with the Web

Mavis now has experimental implementations for **NativeScript-Vue and Vue Web**. The catalog uses the same example files and application state in both builds. Larger compositions live in the Showcase section.

<a href="/playground/" target="_blank" rel="noopener">Open the catalog in your browser ↗</a>

The Web version renders HTML controls with keyboard support, focus indicators, and accessible names. The native version keeps NativeScript views and Jolt. The alpha is available for testing in real apps.

## Run it locally

From a checkout, with Node 22 or later:

```sh
npm ci
npm run build
npm run web:dev
```

Open the `/playground/` URL printed by Vite. The Web example needs no native SDK. To run the same screens on a device, follow the [native example instructions](./foundation).

## What is shared

| Part | Location |
| --- | --- |
| Theme values, spacing and slider step rules | `packages/core/src` |
| Vue theme context and common component types | `packages/core/src/vue` |
| Both screen templates and their behavior | `examples/catalog/shared/pages` |
| Catalog state and navigation interface | `examples/catalog/shared/context.ts` |
| Native rendering and Jolt integration | `packages/nativescript/src` |
| HTML rendering and browser styles | `packages/web/src` |

Shared screens import Vue APIs from `vue`, themes from `@getcortexlabs/mavis-core`, and `useMavisTheme` from `@getcortexlabs/mavis-core/vue`. NativeScript's build resolves `vue` to its native renderer. Each app registers its own Mavis implementation once. If shared code imports core directly, declare `@getcortexlabs/mavis-core@0.1.0-alpha.2` as a dependency of each app.

For example, this template works in both:

```vue
<m-column gap="md" padding="lg">
  <m-text as="h1" variant="title">Your temperature</m-text>
  <m-slider v-model="temperature" :min="16" :max="28" :step="0.5" label="Temperature" />
  <m-button @click="save">Save</m-button>
</m-column>
```

`temperature` and `save` belong to the application. The [component guide](./foundation) describes the common props. `MText.as` supplies heading semantics; it selects an HTML tag on the Web and a heading accessibility role on native. `click` is a platform-independent action with no event payload. Native events remain available separately when needed.

## Register the Web implementation

In an existing Vue app, install the alpha:

```sh
npm install @getcortexlabs/mavis-web@0.1.0-alpha.2
```

Then register the components and load the CSS:

```ts
import { createApp } from 'vue'
import { createMavis, midnight } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'
import App from './App.vue'

createApp(App).use(createMavis({ theme: midnight })).mount('#app')
```

The stylesheet supplies focus indicators, box overlays, and motion. Theme changes remain scoped to each app. The Web package can also be imported during server rendering; it does not access browser globals when imported. The interactive catalog itself is a client-rendered app.

## Navigation and motion

The shared catalog screens receive a small navigation interface. NativeScript uses vue-router-ns; the Web entry uses Vue Router. The demo uses hash routes so it can be hosted as static files, including direct access to its details screen.

Jolt remains required for the **NativeScript package**. Browser support is tracked in [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236). Until that is available, Web buttons use CSS press feedback and `m-reveal` uses Vue transitions with CSS. Both respect `prefers-reduced-motion`. These effects are implemented by Mavis; they are not Jolt running in the browser.

## Portability limits

Use Mavis props and theme values for shared layout and styling. Numeric dimensions are density-independent units on native and CSS pixels on the Web. Platform attributes, raw CSS, native view references, and direct Jolt calls are specific to their environment.

The Web implementation has responsive layouts and native HTML keyboard behavior. Exact pixels, fonts, navigation transitions, and platform-specific controls can differ. Camera, files, notifications, and other device services still need application-level implementations for each target.

The current shared surface covers ten components, including [Input](../components/input). Other frameworks, sheets and a larger component collection remain future work.
