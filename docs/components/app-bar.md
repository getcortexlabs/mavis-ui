---
title: AppBar
---

# AppBar

::: info In development
Available in this PR; not yet published to npm. The published baseline remains alpha.9.
:::

<ComponentPreview component="app-bar" :height="800" />

```vue
<MAppBar title="Library" back><template #actions>…</template></MAppBar>
```

| Property       | Type                   | Default    | Description                                      |
| -------------- | ---------------------- | ---------- | ------------------------------------------------ |
| `title`        | `string`               | `required` | Screen heading.                                  |
| `subtitle`     | `string`               | `—`        | Optional supporting text.                        |
| `back`         | `boolean`              | `false`    | Shows a back action.                             |
| `backLabel`    | `string`               | `Back`     | Accessible action label.                         |
| `navigateBack` | `() => void / Promise` | `—`        | Overrides the installed navigation back handler. |

A screen header with `leading` and `actions` slots. The back action awaits the app navigation handler and emits `back` on completion or `error` on failure. Install navigation once with `createRouterNavigation` for Vue Router, Nuxt or vue-router-ns, or pass `navigateBack`. This component does not create a native Page, router, sticky positioning or a second safe-area inset. Native MScreen owns its safe area. Place a header outside scrollable content (or use the existing retained-header recipe) when it must remain visible. The title wraps rather than clipping enlarged text.

<<< @/../examples/catalog/shared/demos/AppBarDemo.vue
