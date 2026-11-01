---
title: Themes
description: Customize Mavis colors, typography, spacing and controls. Switch between Mavis and Midnight or create a theme shared by NativeScript and Web.
---

# Themes

A theme brings component styling decisions together. **Mavis** pairs light surfaces with rose and blue; **Midnight** carries the same colors onto deep violet surfaces. Change the preview theme to compare the same composition.

<ComponentPreview component="card" :height="320" />

## Set the initial theme

Registration accepts the same theme object on both platforms. Import `createMavis` from `@getcortexlabs/mavis/vue` for native or `@getcortexlabs/mavis-web` for Web.

```ts
import { midnight } from '@getcortexlabs/mavis-core'

app.use(createMavis({ theme: midnight }))
```

## Switch at runtime

```ts
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

// Inside setup():
const { theme, setTheme } = useMavisTheme()
setTheme(theme.value.appearance === 'dark' ? mavis : midnight)
```

Components use their nearest `MThemeProvider`, or the application context when there is no scope. Switching themes updates mounted components.

## Follow the system appearance

Give the plugin a dark counterpart and the context follows the device by default:

```ts
import { mavis, midnight } from '@getcortexlabs/mavis-core'

app.use(createMavis({ theme: mavis, darkTheme: midnight }))
```

`appearance` selects the mode. `system`, the default, resolves `theme` or `darkTheme` from the device and keeps following it while the app runs; `light` and `dark` ignore the device. With a single theme nothing changes. At runtime:

```ts
const { theme, appearance, setAppearance } = useMavisTheme()

setAppearance('dark') // explicit override
setAppearance('system') // follow the device again
```

`appearance` is the selection, `theme.value.appearance` the resolved result. `setTheme(custom)` registers `custom` for its own appearance and pins that appearance, so an explicit choice survives device changes until `setAppearance('system')`. On iOS, NativeScript listens to Core's `systemAppearanceChanged` event; on Android it reads `uiMode` from the application configuration and registers component callbacks, because Core's window cache can lag on older devices. The Web listens to `prefers-color-scheme`. Every listener belongs to the application and is removed when it unmounts. Native launch screens keep the light base, and the catalog apps use this setup.

### Server rendering

The server cannot read the visitor's preference, so `system` renders `theme` there while the client resolves the device on its first render, which can differ from the server markup. To keep hydration consistent, pass the same explicit `appearance` on both sides, for example from a cookie written when the visitor chooses, and switch to `system` after mounting:

```ts
app.use(createMavis({ theme: mavis, darkTheme: midnight, appearance: 'light' }))

// In the root component, client only:
onMounted(() => setAppearance('system'))
```

Core never touches `window` at import time; the Web adapter reads `matchMedia` only when the plugin installs in a browser.

## Create your identity

```ts
import { defineTheme, mavis } from '@getcortexlabs/mavis-core'

const studio = defineTheme({
  name: 'studio',
  colors: { primary: '#5636A8', onPrimary: '#FFFFFF' },
  radius: { md: 12 },
  typography: { title: { fontSize: 36 } },
}, mavis)
```

`defineTheme` fills missing values from the base without changing it and returns an immutable theme. Custom palettes need their own contrast review.

| Group | Defines |
| --- | --- |
| `colors` | background, surface, elevated, text, muted, primary, onPrimary, primarySoft, accent, onAccent, accentSoft, border, success, warning, danger |
| `space` | none, xs, sm, md, lg, xl, 2xl |
| `radius` | none, sm, md, lg, full |
| `typography` | display, title, heading, body, caption, overline |
| `control` | Minimum height, horizontal padding and font size for sm, md and lg |
| `components` | Button, Input and Card: font, spacing, radius and elevation |
| `elevation` | `none`, `sm`, `md`, `lg`: offsets, blur, spread and color |
| `motion` | `pressScale`, greater than 0 and at most 1 |

## Spacing

| Token | Default value |
| --- | --- |
| none | 0 |
| xs | 4 |
| sm | 8 |
| md | 16 |
| lg | 24 |
| xl | 32 |
| 2xl | 48 |

`gap` and padding also accept nonnegative numbers. Units are density-independent on NativeScript and CSS pixels on the Web. Platform fonts and rendering can produce small differences in measurement.

## Theme a region

`MThemeProvider` adds no view. Descendants receive the local theme; siblings and ancestors keep their previous theme. Providers can nest. Import it from the renderer or use global registration.

With no props, it inherits the parent's themes and mode. `theme` replaces the profile for its own appearance and, without `appearance`, pins that appearance. `darkTheme` replaces the dark profile and must declare `appearance: 'dark'`. `appearance="system"` follows the application's appearance source; a scope adds no platform listeners. Unspecified profiles continue to inherit from the parent.

The provider is controlled: `useMavisTheme().setAppearance()` requests `update:appearance`; `setTheme()` requests `update:theme` and `update:appearance`. Use `v-model` to accept these changes. Without listeners, props keep control. Reactive updates do not remount content; unmounting a scope releases its Vue effects without changing its parent. Sheet, Dialog and Toast retain their owner's theme, including native layers.

Install `createMavis` to observe device appearance. Individually imported components without the plugin use the default theme and add no observers of their own. The explicit-appearance SSR guidance above also applies to scopes.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { mavis, midnight, MThemeProvider } from '@getcortexlabs/mavis-web'
import type { AppearanceMode } from '@getcortexlabs/mavis-core/vue'
const mode = ref<AppearanceMode>('light')
</script>

<template>
  <MThemeProvider :theme="mavis" :darkTheme="midnight" v-model:appearance="mode">
    <AccountCard />
  </MThemeProvider>
</template>
```

See [Typography and customization](./typography) for fonts, tokens and precedence.
