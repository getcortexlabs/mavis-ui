---
title: Image
description: An image, thoughtfully presented.
---

# Image

An image, thoughtfully presented.

::: info Next release
Available in Mavis `0.1.0-alpha.7`.
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


Experimental image, icon, Sheet and Dialog integrations are described in [Images and physics](../guide/platform-motion). They require Jolt RC.10 and are included in Mavis alpha.8.

## Responsive Web images

**Source development; not in alpha.8.** `srcset`, `sizes`, `loading` (`eager` or `lazy`), `decoding` (`sync`, `async` or `auto`) and `fetchpriority` (`high`, `low` or `auto`) go to the inner `<img>`, with no default override. IDs, classes, styles and other wrapper attributes stay on the outer container. Keep a fallback `src` and the reserved aspectRatio.

```vue
<m-image src="/photo-320.webp" srcset="/photo-320.webp 320w, /photo-960.webp 960w"
  sizes="(min-width: 800px) 50vw, 100vw" loading="lazy" decoding="async"
  fetchpriority="low" alt="A landscape" :aspect-ratio="1.5" />
```

Changes to src, srcset or sizes invalidate pending load/decode results while preserving geometry. The browser chooses the candidate and scheduling; `loading` does not guarantee request timing. These attributes are Web-only. Ripple/distortion may use the selected image, but dissolve source replacement rejects an active srcset because the application owns responsive source selection.
