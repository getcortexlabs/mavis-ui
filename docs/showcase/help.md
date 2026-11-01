---
title: Help center
description: A shared help center with segmented topics, expandable answers and per-question feedback.
---

# Help center

Choose a topic, open an answer and mark it helpful. `MSegmentedControl` selects the category; `MAccordion` holds its expandable questions. Expanded values and feedback live in the parent, so returning to a topic preserves both. Theme changes preserve the same state.

<a href="/playground/#/showcase/help" target="_blank" rel="noopener">Open the interactive example ↗</a>

The screen uses local demonstration content in Portuguese. It does not send messages, manage subscriptions or save preferences. **Quero conversar** displays an inline notice explaining this boundary. Unmounting the screen resets its state. Native routers may retain the page when visiting Profile and returning.

[Accordion](../components/accordion) · [SegmentedControl](../components/segmented-control) · [Themes](../guide/themes)

## Source

<<< @/../examples/catalog/shared/pages/Help.vue
