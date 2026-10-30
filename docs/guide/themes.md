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

The context belongs to the application. Switching themes updates mounted components. Automatic selection based on system appearance is not implemented yet.

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
