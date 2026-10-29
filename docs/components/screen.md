---
title: Screen
description: "Screen in Mavis UI. A themed screen surface with optional scrolling."
---

# Screen

`m-screen` · A themed screen surface with optional scrolling.

<ComponentPreview component="screen" :height="380" />

## Usage

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text as="h1" variant="title">Your screen</m-text>
    <m-card><m-text>Your content.</m-text></m-card>
  </m-column>
</m-screen>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `scroll` | boolean | `false` | Enables vertical scrolling. |

On NativeScript, Screen represents a Page and needs a navigation host such as RouterView. Use one Screen per page; do not nest Pages. On the Web, it renders main, takes at least the viewport height and, with `scroll`, keeps scrolling inside that area. The preview above uses a separate document.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ScreenDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).
