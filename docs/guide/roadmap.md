---
description: "Follow the Mavis UI roadmap: selection/form controls and queued Toast feedback, the component inventory, and future NativeScript integrations."
---

# Roadmap

Mavis has experimental packages on npm for NativeScript-Vue and Vue Web. The API can change between alpha versions; there is no stable release date. [Install the current alpha](./foundation).

## Now: validating the foundation

The current collection has twenty-six components: Screen, Row, Column, Box, Card, Text, Icon, Button, Input, Switch, Checkbox, Radio, Select, Slider, Sheet, Dialog, Toast, Tabs, Skeleton, Progress, Alert, Avatar, Badge, ListItem, Separator and Reveal. Mavis and Midnight themes work in the native catalog and the shared Vue Web screens. Native uses Jolt and vue-router-ns; Web uses CSS motion and Vue Router. [See how sharing works](./web).

Real app feedback, physical-device testing and layout, keyboard and performance checks continue alongside component development. The [delivery index](https://github.com/getcortexlabs/mavis-ui/issues/1) records the remaining limits and completed fixes.

## First expansion: selection and forms

The first selection/forms batch, Switch → Checkbox → Radio → Select, is implemented for NativeScript-Vue and Vue Web in the repository. All four ship with the next alpha after `0.1.0-alpha.3`. Select reuses the choice contract from Radio.

| Control | Kind and purpose | Work item |
| --- | --- | --- |
| Switch | Primitive for an immediate on/off preference, such as notifications. | [#76](https://github.com/getcortexlabs/mavis-ui/issues/76) |
| Checkbox | Primitive for independent choices, including an explicit indeterminate state. | [#77](https://github.com/getcortexlabs/mavis-ui/issues/77) |
| Radio | Group primitive for one choice among visible options, with a controlled value and disabled options. | [#78](https://github.com/getcortexlabs/mavis-ui/issues/78) |
| Select | Composed field for one choice from a local list. Reuses the Radio choice contract and presents a Sheet on NativeScript. | [#79](https://github.com/getcortexlabs/mavis-ui/issues/79) |

The order keeps the first controls small and gives Select an established choice contract. Switch and Checkbox do not depend on each other at runtime. Search, remote loading, multiple selection and virtualized option lists are outside the first Select scope.

Each delivery includes:

- A shared value contract and types, with platform behavior handled inside the renderer.
- Mavis and Midnight designs for active, pressed, focused and disabled states, reviewed with long labels, narrow screens and system text scaling.
- Clear labels and selected states, an easy-to-activate surface and the expected keyboard interaction. Native motion uses Jolt; Web keeps CSS motion while its backend is pending. Both respect reduced motion.
- A shared component demo, an example in a complete screen, EN/PT documentation, and tests of value changes, interaction and cleanup on both renderers.

The app continues to own validation, persistence and submission. This batch does not introduce a form engine. None of these four work items depends on Jolt Web.

## Feedback: Toast

[Toast](../components/toast) adds local queues, timed or manual dismissal and four feedback tones on NativeScript-Vue and Web. It follows the selection/forms batch and ships with the next alpha after `0.1.0-alpha.3`. Delivery and validation: [#85](https://github.com/getcortexlabs/mavis-ui/issues/85).


## Confirmations: Dialog

[Dialog](../components/dialog) adds controlled decisions, destructive tone and processing in both renderers. Available for the next alpha; [#87](https://github.com/getcortexlabs/mavis-ui/issues/87).

## Content navigation: Tabs

[Tabs](../components/tabs) organizes local panels with controlled selection, a scrollable strip and an animated indicator. Library includes Explore and Saved panels. Next alpha after `0.1.0-alpha.3`; [#89](https://github.com/getcortexlabs/mavis-ui/issues/89).

## Loading: Skeleton

[Skeleton](../components/skeleton) composes placeholders with an optional pulse and adds simulated loading to Library. Next alpha after `0.1.0-alpha.3`; [#91](https://github.com/getcortexlabs/mavis-ui/issues/91).

## Inventory for later batches

The following candidates remain in the [inventory issue #31](https://github.com/getcortexlabs/mavis-ui/issues/31). They have no implementation date; a concrete app need and a defined contract will determine the next batch.

| Area | Candidates and kind | What needs to be settled first |
| --- | --- | --- |
| Forms | Date/time pickers: platform integrations. | Locale, time-zone and native/browser picker behavior. |
| Selection | Segmented control: composed selection pattern. | Reuse the Radio contract and establish where a compact segment works better. |
| Feedback | Progress and Alert are available in the repository (#107/#108), alongside Toast and Skeleton. | Further patterns depend on real app workflows; announcements and tasks remain app-owned. |
| Overlays | Popover: anchored presentation integration. | Focus, dismissal, anchor positioning, keyboard and window-edge behavior. |
| Navigation | Tab bar: navigation integration. | Separate local panel selection from router state, back behavior and deep links. |
| Content | Avatar, Badge, ListItem and Separator are available in the repository (#94/#95/#97/#98); virtualized collections: platform integration. | Image fallback, status semantics and reusable row needs; large collections also need a measured virtualization contract. |

Primitives provide a small visual and interaction contract. Composed patterns combine those building blocks. Platform integrations coordinate services such as pickers, navigation or collection virtualization and need their own platform-specific validation.

## Next: the other NativeScript frameworks

Vue is the first entry point, not the limit of the library. We plan to extend support to the other frameworks in the NativeScript ecosystem.

The aim is to preserve component names, properties, and composition rules, with syntax appropriate to each framework. Theme definitions already live outside the Vue integration.

## Later: explore other platforms

React Native, Flutter, and direct native integrations are possible future directions. None is currently in development as part of Mavis, and there is no committed release order.

| Platform | Direction |
| --- | --- |
| NativeScript-Vue | Experimental implementation in the repository |
| Vue Web | Experimental implementation with shared screens |
| Other NativeScript frameworks | Planned expansion |
| React Native | Future possibility |
| Flutter | Future possibility |
| Direct native integrations | Future possibility |

## Follow progress

Follow the [delivery index](https://github.com/getcortexlabs/mavis-ui/issues/1), [component inventory](https://github.com/getcortexlabs/mavis-ui/issues/31) and [releases](https://github.com/getcortexlabs/mavis-ui/releases). The component references describe the implemented API; this roadmap separates the next approved batch from later candidates.

## Identity and context

[Avatar](../components/avatar) and [Badge](../components/badge) compose identities, categories and status in Profile. Next alpha after `0.1.0-alpha.3`; [#94](https://github.com/getcortexlabs/mavis-ui/issues/94) and [#95](https://github.com/getcortexlabs/mavis-ui/issues/95).

## Rows and divisions

[ListItem](../components/list-item) and [Separator](../components/separator) compose the new [Team](../showcase/team) screen. Next alpha after `0.1.0-alpha.3`; issues [#97](https://github.com/getcortexlabs/mavis-ui/issues/97) and [#98](https://github.com/getcortexlabs/mavis-ui/issues/98).

## Progress and inline notices

[Progress](../components/progress) and [Alert](../components/alert) compose the simulated [Library](../showcase/library) download: preparation, progress, cancellation, failure and retry. Next alpha after `0.1.0-alpha.3`; issues [#107](https://github.com/getcortexlabs/mavis-ui/issues/107) and [#108](https://github.com/getcortexlabs/mavis-ui/issues/108).
