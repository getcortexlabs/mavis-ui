---
title: RefreshControl
---

# RefreshControl

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet included in the published npm version.
:::

<ComponentPreview component="refresh-control" :height="1000" />

```vue
<MRefreshControl label="Your morning edition" :refresh="refreshStories">
  <Stories :items="stories" />
</MRefreshControl>
```

| Prop                                                                                    | Type                   | Default        | Contract                                                |
| --------------------------------------------------------------------------------------- | ---------------------- | -------------- | ------------------------------------------------------- |
| `label / refresh`                                                                       | string / RefreshAction | required       | Accessible region name and application-owned operation. |
| `height / threshold`                                                                    | number                 | 480 / 80       | Viewport height and pull threshold in px/DIP.           |
| `disabled`                                                                              | boolean                | false          | Cancel pending work and pause refresh interaction.      |
| `refreshLabel / refreshingLabel / successLabel / errorLabel / retryLabel / cancelLabel` | string                 | English labels | Translate every state and action.                       |

Pull down at the top, or use the Refresh button. Supply an async refresh(context) callback. context.signal supports cancellation, and context.commit(() => updateState()) guards application updates against stale requests. Apply results inside commit; arbitrary writes performed by the application cannot be undone. Only one request runs at a time. Cancel, disabling, KeepAlive deactivation and teardown invalidate the active request. Error and success labels are configurable. Exposed methods: refresh() and cancel(). RefreshControl owns a bounded scroll region with a compact status header, not a native Page.

<<< @/../examples/catalog/shared/demos/RefreshControlDemo.vue

```ts
async function refreshStories(context: RefreshContext) {
  const response = await fetch('/api/stories', { signal: context.signal })
  if (!response.ok) throw new Error('Could not refresh')
  const items = await response.json()
  await context.commit(() => {
    stories.value = items
  })
}
```
