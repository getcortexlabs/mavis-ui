---
title: Image
description: An image, thoughtfully presented.
---

# Image

An image, thoughtfully presented.

::: info Next release
Available from source after this PR. Not included in the published alpha.6.
:::

<ComponentPreview component="image" />

```vue
<m-image src="https://example.com/print.png" alt="Art print" :aspectRatio="4/3" />
```

Reserves space during loading and failure. Obsolete source results are ignored. Uses platform loading, without its own global cache or a network cancellation guarantee.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `required` | Local image, data URI or URL according to the platform. |
| `alt` | `string` | `required` | Description; empty text for a decorative image. |
| `aspectRatio` | `number` | `4 / 3` | Positive ratio that reserves height. |
| `fit` | `cover  /  contain` | `cover` | Crop or fit the image. |
| `radius` | `token  /  number` | `md` | Theme radius or number. |
| `loadingLabel / errorLabel` | `string` | `Loading image / Image unavailable` | Loading and error copy. |

<<< @/../examples/catalog/shared/demos/ImageDemo.vue


`load` and `error` emit the source that completed. An empty source displays the fallback without starting a request. Explicit `height` takes precedence over the computed ratio; otherwise width and `aspectRatio` reserve the image space.
