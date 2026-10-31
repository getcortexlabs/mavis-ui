---
title: Icon
description: Mavis icons from the bundled Lucide font. One consistent set on NativeScript and Vue Web, with sizes, theme tones and accessible labels.
---

# Icon

`m-icon` · A symbol from the Lucide set that follows the theme. Renders the bundled icon font on iOS, Android and the Web.

<ComponentPreview component="icon" :height="460" />

## Usage

```vue
<m-row gap="sm" align="center">
  <m-icon name="search" tone="muted" />
  <m-text>Search</m-text>
</m-row>
<m-icon name="circle-check" tone="success" label="Done" />
```

Register the components through the [alpha installation guide](../guide/foundation). The API remains experimental.

## Install the font

NativeScript loads custom fonts from the app's `fonts` folder. Copy the bundled file once (use `src/fonts/` when `appPath` is `src`):

```sh
cp node_modules/@getcortexlabs/mavis/fonts/lucide.ttf app/fonts/
```

Webpack apps can copy it at build time instead, as the catalog does:

```js
webpack.Utils.addCopyRule({
  from: 'lucide.ttf',
  to: 'fonts',
  context: 'node_modules/@getcortexlabs/mavis/fonts',
})
```

The Web stylesheet declares the `@font-face` and loads `lucide.woff2` from the package; importing `@getcortexlabs/mavis-web/style.css` is enough.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `IconName` | required | Lucide icon name, such as `search` or `circle-check`. Unknown names throw `RangeError`. |
| `size` | sm \| md \| lg \| number | `md` | 16, 20 or 24 points, or any positive number. |
| `tone` | palette color | `text` | Theme color, such as `primary`, `muted` or `danger`. |
| `label` | string | none | Accessible name. Without it the icon is decorative and hidden from assistive technology. |
| `id` | string | none | Identifies the rendered icon. |

`class`, `style` and undeclared attributes apply to the rendered glyph. No default slot is consumed. The `IconName` type from `@getcortexlabs/mavis-core` lists the 1998 canonical names of Lucide 1.65.0; aliases are not included. Browse the set at [lucide.dev/icons](https://lucide.dev/icons/).

## Accessibility and alignment

Icons are decorative by default: screen readers skip them, so pair them with text that carries the meaning. Give `label` only to icons that stand alone, such as a status mark; it becomes the image name on both platforms. Icons keep their size in rows (`shrink` is 0) and center vertically next to text. Button and Input do not accept icons yet; compose a Row with an icon and a Text, or a Card with `interactive`, for icon-led actions.

## Bundle and license

The native package ships `fonts/lucide.ttf` (0.97 MB) and the Web package `src/fonts/lucide.woff2` (309 KB), both with the full set and the ISC license next to them. Subsetting to the icons an app uses is future work.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/IconDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).
