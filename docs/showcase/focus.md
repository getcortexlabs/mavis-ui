---
title: Focus session
description: A shared Mavis screen combining a Radio group, a controlled slider, loading state and reveal content on native and Web.
---

# Focus session

Choose an environment, adjust the duration and prepare a session. A Radio group owns the ambience choice, while a Slider and Button control duration and preparation. Its Vue source runs unchanged in NativeScript and on the Web.

<a href="/playground/#/showcase/focus" target="_blank" rel="noopener">Open the interactive example ↗</a>

The screen uses local demonstration data and does not play audio. Radio option values stay independent of their translated labels; the summary displays the label. Options are disabled while the session is being prepared. The app owns the values and preparation state, while the components own rendering and interaction rules. Changing the theme preserves the selection.

## Source

<<< @/../examples/catalog/shared/pages/Focus.vue

Read the [component contract](../guide/component-contract) for defaults, event payloads and platform boundaries.
