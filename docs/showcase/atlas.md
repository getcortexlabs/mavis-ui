---
title: Atlas
description: A shared travel planner with continuous gestures, keyed lists and animated data.
---

# Atlas

A travel notebook with three spaces: inspiration, itinerary and budget. One Vue screen uses the Web and NativeScript renderers. The copy is in Portuguese; the experience includes light and dark themes, local search, retained drafts and keyboard navigation.

The desktop composition uses a wide photographic spread alongside a planning notebook, followed by a three-column destination collection. `MStack.responsive` and `MGrid` reorganize those areas for narrower screens. Paper and ink themes, editorial typography and Jolt-powered photo and word entrances give this example its own visual identity.

**Local development preview — not part of the published alpha.11 packages.**

<a href="/playground/#/showcase/atlas">Open Atlas</a>

Drag a destination, rename the trip, reverse the itinerary, choose a date range and compare budget scenarios. Jolt owns gesture settlement, moving selection markers, list geometry and chart interpolation. The chart's accessible data changes immediately, while its presentation moves to the new values. Reduced motion settles chart geometry immediately.

Data is illustrative and stays in memory. Prices do not represent travel offers. The three landscape photographs come from Unsplash and are embedded in the example so the screen works offline. No booking or account service is connected.

## Implementation

- `Atlas.vue`: shared screen, controlled navigation, local drafts and data.
- `atlas/theme.ts`: scoped typography, colors and motion timing.
- `atlas/photos.ts`: embedded image assets, with their source URLs.

No component reaches into DOM nodes or native views from the shared screen. Renderer internals own those details. Web-only decorative framing is isolated with `MPlatform`; all planning controls remain shared.

<<< @/../examples/catalog/shared/atlas/theme.ts
