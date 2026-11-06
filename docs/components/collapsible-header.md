---
title: CollapsibleHeader
---

# CollapsibleHeader

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet included in the published npm version.
:::

<ComponentPreview component="collapsible-header" :height="1000" />

```vue
<MCollapsibleHeader title="Field notes" :image="cover" :height="540">
  <MColumn padding="lg"><Stories /></MColumn>
</MCollapsibleHeader>
```

| Prop                                        | Type             | Default                       | Contract                                                                      |
| ------------------------------------------- | ---------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `title / subtitle / image`                  | string           | —                             | Heading, supporting text and optional decorative artwork.                     |
| `height / expandedHeight / collapsedHeight` | number           | 540 / 240 / 64                | Finite region height; expanded must exceed collapsed, which must be positive. |
| `parallax / sectionHeight`                  | number           | 0.35 / 0                      | Parallax fraction 0–1 and pinned section height.                              |
| `back / backLabel / topLabel`               | boolean / string | false / Go back / Back to top | Opt-in back action and translatable controls.                                 |

A retained scroll header with artwork and two title presentations. The content scrolls inside a bounded region; this component does not create a native Page. Use inside MScreen, and avoid giving this region and its parent the same scrolling responsibility. Jolt owns collapse, parallax and cleanup. Slots: default, artwork, leading, actions and section. When using section, set sectionHeight to its measured design height. The back event belongs to the application; the top button returns this region to its beginning.

<<< @/../examples/catalog/shared/demos/CollapsibleHeaderDemo.vue
