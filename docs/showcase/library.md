---
title: Library
description: A shared Mavis reading collection with independent filters, a mixed select-all checkbox and an empty state.
---

# Library

Choose design, development and product topics to filter a small reading collection. The screen starts with two topics selected, so the parent checkbox is mixed. Select all, choose individual topics or clear the selection to see the empty state.

<a href="/playground/#/showcase/library" target="_blank" rel="noopener">Open the interactive example ↗</a>

The screen owns the array of selected IDs, derives both parent states and filters the cards. `MCheckbox` only requests changes. The collection is local demonstration content; there are no requests or saved preferences, and leaving the screen resets it.

## Source

<<< @/../examples/catalog/shared/pages/Library.vue

[Checkbox reference](../components/checkbox) · [Themes](../guide/themes)

`MTabs` separates Explore and Saved. Bookmarking a reading updates the tab count; filters and saved IDs live in the parent and survive panel switches. Leaving the screen resets the collection. [Tabs reference](../components/tabs).

**Atualizar coleção** simulates a 1.5-second wait using `MSkeleton`. Filters, the active tab and saved readings are preserved; no network request is made.
