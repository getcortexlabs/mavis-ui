---
title: Try the first components
description: Run the Mavis UI NativeScript-Vue example from a checkout. Explore m-* layouts, themes, buttons, sliders, and Jolt animation.
---

# Try the first components

The repository now includes an experimental NativeScript-Vue implementation and a small native app, **Garage**. The API can change. There is no published Mavis package yet.

Garage on the Android emulator, using Midnight and Mavis. These are native screens built from the same components.

<div style="display: flex; gap: 16px; flex-wrap: wrap; margin: 24px 0">
  <img src="/images/garage-midnight.png" alt="Garage — Midnight" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
  <img src="/images/garage-mavis.png" alt="Garage — Mavis" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
</div>

## Run Garage

Use Node 20.19.4 or newer and a configured [NativeScript development environment](https://docs.nativescript.org/setup/).

```sh
git clone https://github.com/getcortexlabs/mavis-ui.git
cd mavis-ui
npm ci
npm run build
cd examples/garage
npm ci
npm run android
# On macOS with Xcode:
npm run ios
```

The example installs the local Mavis package, NativeScript-Vue, **Jolt**, and vue-router-ns. Jolt is a required peer dependency of the library; the example declares it explicitly. After changing library code, run `npm run build` at the repository root and restart the example.

## Build a layout

Components register as `MButton`, `MRow`, and so on. Vue also accepts their `m-button` and `m-row` spellings. Layouts use `gap`, `padding`, `align`, and `justify`, with NativeScript's views handled internally.

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text variant="title">Your space.</m-text>
    <m-card gap="md">
      <m-text>Ready when you are.</m-text>
      <m-row gap="sm">
        <m-button :grow="1" @click="save">Save</m-button>
        <m-button variant="secondary" @click="cancel">Cancel</m-button>
      </m-row>
    </m-card>
  </m-column>
</m-screen>
```

The snippet illustrates a screen template; `save` and `cancel` are your application handlers. Register the components once at startup:

```ts
import { createMavis } from '@mavis-ui/nativescript/vue'
import { midnight } from '@mavis-ui/nativescript'

app.use(createMavis({ theme: midnight }))
```

`app` is your NativeScript-Vue application. Individual components are also exported for local imports. `MScreen` owns a native Page, so render it inside a navigation host such as vue-router-ns's `RouterView`. Garage includes the full startup and router setup.

## Current components

| Component | Purpose and initial API |
| --- | --- |
| `m-screen` | Native Page; `scroll` enables vertical scrolling. |
| `m-row` | Horizontal layout; `gap`, `align`, `justify`, `wrap`. |
| `m-column` | Vertical layout with the same layout properties. |
| `m-box` | Overlapping content; the last child is drawn on top. |
| `m-card` | Themed surface with a vertical content layout. |
| `m-text` | Text slot or `text`; `variant`, `tone`, `align`, `wrap`. |
| `m-button` | Text slot or `text`; `variant`, `size`, `disabled`, `loading`, `loadingText`; emits `click`. |
| `m-slider` | Numeric `v-model`; `min`, `max`, `step`, `disabled`; required accessible `label`. |
| `m-reveal` | `show` inserts/removes content with Jolt entry and exit motion. |

Layout spacing accepts `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, or an explicit number in device-independent units. `paddingX` and `paddingY` override the corresponding sides. `grow` distributes available space among children; it defaults to `0`. Children preserve their natural height in columns. In rows, they may shrink horizontally to fit; `shrink` overrides this behavior.

`align` accepts `start`, `center`, `end`, `stretch`. Rows default to `center`; columns to `stretch`. `justify` accepts `start`, `center`, `end`, `between`, `around`. It defaults to `start`. Wrapping is off by default.

Button variants are `primary`, `secondary`, and `ghost`; sizes are `sm`, `md`, and `lg`. Text variants are `display`, `title`, `heading`, `body`, `caption`, and `overline`. Text and button slots currently accept plain or interpolated text. Compose richer content using layout components.

Native attributes, classes, styles, and events can pass through when needed. Local styles override theme defaults. Native views can coexist with Mavis components.

## Switch or extend a theme

**Mavis** is light, with warm surfaces and rose accents. **Midnight** uses deep green surfaces and lime accents. Both define colours, spacing, typography, control sizes, and corners.

```ts
import { defineTheme, mavis, midnight } from '@mavis-ui/nativescript'
import { useMavisTheme } from '@mavis-ui/nativescript/vue'

// Inside setup():
const { theme, setTheme } = useMavisTheme()
setTheme(midnight)

const studio = defineTheme({
  name: 'studio',
  colors: { primary: '#5636A8', onPrimary: '#FFFFFF' },
  radius: { md: 12 },
}, mavis)
setTheme(studio)
```

Theme changes update mounted components. Each app owns its own theme state. `defineTheme` preserves the remaining tokens from its base and returns an immutable theme. Custom palettes need their own contrast review.

## Motion and limits

Buttons use Jolt press feedback. Disabling, unloading, or unmounting the control removes the effect and restores its scale. `m-reveal` animates content opacity and vertical offset; its layout height changes immediately. Jolt follows the system's reduced-motion preference by default. Mavis does not change Jolt's global configuration.

This first implementation covers layouts, text, surfaces, buttons, sliders, and a reveal transition. Inputs, sheets, icons, automatic system-theme selection, and framework integrations beyond Vue are still future work. The example uses local demonstration data.
