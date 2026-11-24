---
title: Pagination
description: Controlled page navigation for bounded or large result sets.
---

# Pagination

Controlled page navigation for bounded or large result sets.

::: info Available in alpha.5
Available in Mavis alpha.5.
:::

<ComponentPreview component="pagination" :height="900" />

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue` | `number` | `1` | One-based requested page. |
| `total` | `number` | required | Nonnegative safe-integer result count. |
| `pageSize` | `number` | `20` | Positive safe-integer page size. |
| `siblingCount` | `0 \| 1 \| 2` | `1` | Neighbor pages around the current page. |
| `loading / disabled` | `boolean` | `false` | Prevents page requests. |
| `label` | `string` | `Result pages` | Navigation name. |

`update:modelValue(page)` requests a different valid page. Previous/next disable at the boundaries. An empty collection keeps the host's page 1 and renders no fictitious numbered page. The rendered page set is bounded independently of the total, with inert ellipses. Web marks the selected page with `aria-current="page"`.

When filtering or deleting makes the parent's page invalid, the control shows `invalidPageLabel` and lets the host decide how to recover; it never mutates selection during render. Use `pagination(total, pageSize, page)` or `pageCount(total, pageSize)` for the same neutral calculations.

Localize `previousLabel`, `nextLabel`, `pageLabel`, `currentLabel`, `emptyLabel` and `invalidPageLabel`. The host owns loading, result announcements, cancellation, error/retry and router/query synchronization. Keep results and controls mounted during requests to retain focus. The recipe demonstrates filter reset to page 1 and generation checks against stale responses using a local dataset. Cursor pagination is a different service contract and is not inferred from a total.

`statusText` supplies a host-owned, polite result announcement (for example, the loaded page and result count). Loading retains action labels and keyboard focus. If accepting a page disables or removes the focused action, focus returns to the new current page only when no other control has taken focus.

<<< @/../examples/catalog/shared/demos/PaginationDemo.vue
