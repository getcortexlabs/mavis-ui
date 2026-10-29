---
title: Focus session
description: A shared Mavis screen combining selectable cards, a controlled slider, loading state and reveal content on native and Web.
---

# Focus session

Choose an environment, adjust the duration and prepare a session. All nine initial components participate in this small consumer screen. Its Vue source runs unchanged in NativeScript and on the Web.

<a href="/playground/#/showcase/focus" target="_blank" rel="noopener">Open the interactive example ↗</a>

The screen uses local demonstration data and does not play audio. Selectable cards are single actions; the slider and buttons live outside them. The app owns the values and preparation state, while the components own rendering and interaction rules. Changing the theme preserves the selection.

## Source

<<< @/../examples/catalog/shared/pages/Focus.vue

Read the [component contract](../guide/component-contract) for defaults, event payloads and platform boundaries.
