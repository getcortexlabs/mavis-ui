---
title: Typography and customization
description: Font families, line rhythm, component tokens and elevation shared by NativeScript and Web.
---

# Typography and customization

Each typography variant has `fontFamily`, `fontSize`, `fontWeight`, `lineHeight` and `letterSpacing`. Keep a shared theme as the source of your visual decisions; [Atelier](../showcase/studio) demonstrates two type families and locally themed Input, Button and Card components.

```ts
const brand = defineTheme({
  name: 'brand',
  typography: {
    title: {
      fontFamily: { web: 'Georgia, serif', ios: 'Georgia', android: 'serif' },
      fontSize: 36,
      fontWeight: 'normal',
      lineHeight: 1.2,
      letterSpacing: -0.02,
    },
    body: { fontFamily: 'system', lineHeight: 1.5 },
  },
  components: {
    button: { fontWeight: '600', paddingY: 14, radius: 'full' },
    input: { fontSize: 18, paddingX: 20, paddingY: 16 },
    card: { padding: 'lg', radius: 'lg', elevation: 'md' },
  },
  elevation: { md: { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(37, 30, 50, 0.14)' } },
})
```

## Font loading and units

`fontFamily: 'system'` selects the platform system font. Another string names an installed/bundled family shared by the platforms. The object form supplies a Web CSS stack, an iOS family/PostScript name and an Android family or bundled font filename without its extension. Empty `ios`/`android` names request their system font. Mavis does not download fonts. Host custom Web fonts with `@font-face` and supply fallbacks; put native font files in the app's fonts folder and check their internal names. See [NativeScript font styling](https://docs.nativescript.org/guide/styling). The example uses platform fonts and requires no font download.

Sizes are CSS pixels on Web and density-independent native units before system text scaling. Weights accept `normal`, `bold` and strings `100` through `900`; the installed font must provide or synthesize that weight. `MText weight` overrides the variant's weight without changing its size.

`lineHeight` is a unitless rhythm of at least 1. Web uses it as CSS `line-height`. Core 9.1.3 treats native `lineHeight` as **additional leading**, so Mavis passes `fontSize × (lineHeight − 1)` as extra space between native lines. Font metrics and system scaling still determine their actual height; this does not promise matching pixel geometry. `letterSpacing` is an em fraction in both renderers: Web adds `em`, while NativeScript receives the number. Never pass a CSS unit string as a shared numeric token.

SSR emits the configured font stack without loading or measuring a font. Reserve suitable layout space for font loading. Use the same theme/appearance on server and client, as described in [Themes](./themes#server-rendering).

## Component defaults

| Group | Tokens |
| --- | --- |
| `components.button` | Optional `fontFamily` (otherwise body), `fontWeight`, `lineHeight`, `paddingY`, `radius`, `elevation` |
| `components.input` | Optional `fontFamily`/`fontSize` (otherwise body), `fontWeight`, `lineHeight`, `paddingX`, `paddingY`, `radius` |
| `components.card` | `padding`, `radius`, `elevation` |

Button size still uses `control.sm/md/lg` for minimum height, font size and horizontal padding. Input tokens target its editor; its label and message remain separate. Icon/action space is reserved in addition to the configured padding. A scoped [MThemeProvider](./themes#theme-a-region) applies these defaults locally.

Elevation levels `none`, `sm`, `md`, `lg` contain `x`, `y`, `blur`, `spread` and `color`. Web renders a CSS shadow; NativeScript Core renders the equivalent box shadow in density-independent units. Elevation is decorative and does not change stacking or reserve layout space. Leave room around shadows and avoid clipping ancestors. Card's `elevation` prop selects a level; the default is `components.card.elevation` (`none` in Mavis/Midnight).

## Overrides on Web

Public custom properties allow local CSS without `!important`:

| Component | Custom properties |
| --- | --- |
| Text | `--m-text-font-family`, `--m-text-font-size`, `--m-text-font-weight`, `--m-text-line-height`, `--m-text-letter-spacing` |
| Button | `--m-button-font-family`, `--m-button-font-size`, `--m-button-font-weight`, `--m-button-line-height`, `--m-button-padding-x`, `--m-button-padding-y`, `--m-button-radius`, `--m-button-shadow` |
| Input editor | `--m-input-font-family`, `--m-input-font-size`, `--m-input-font-weight`, `--m-input-line-height`, `--m-input-padding-x`, `--m-input-padding-y`, `--m-input-radius` |
| Card | `--m-card-padding`, `--m-card-radius`, `--m-card-shadow` |

Theme values are the fallback. Web custom properties override that fallback; explicit semantic props such as Text `weight` and Card `padding`/`paddingX`/`paddingY`/`radius` take precedence for their corresponding properties. Explicit root `:style` is applied last. Input's root style belongs to its container; use the editor variables or theme tokens for the editor. State colors, focus, disabled and loading behavior remain component-owned unless the application deliberately overrides them through root styles. Ordinary CSS properties cannot override an inline fallback; use the documented variables instead.

Custom properties are Web-only and use CSS units (`18px`, `0.02em`) where appropriate. Shared themes use the numeric/native contract. Neither mechanism is a utility-class system.
