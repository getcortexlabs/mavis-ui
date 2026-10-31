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

The context belongs to the application. Switching themes updates mounted components.

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
| `colors` | background, surface, elevated, text, muted, primary, onPrimary, primarySoft, accent, onAccent, accentSoft, border, success, danger |
| `space` | none, xs, sm, md, lg, xl, 2xl |
| `radius` | none, sm, md, lg, full |
| `typography` | display, title, heading, body, caption, overline |
| `control` | Minimum height, horizontal padding and font size for sm, md and lg |
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
