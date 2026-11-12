---
title: Steps
description: Controlled step navigation with a complete registration recipe that preserves visited editors.
---

# Steps

Controlled step navigation with a complete registration recipe that preserves visited editors.

::: info Available in alpha.5
Available in Mavis alpha.5.
:::

<ComponentPreview component="steps" :height="900" />

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `steps` | `readonly StepOption[]` | required | Nonempty ordered steps. |
| `modelValue` | `ChoiceValue \| null` | `null` | Current step; no automatic selection. |
| `label` | `string` | required | Navigation name. |
| `loading / disabled` | `boolean` | `false` | Prevents step requests. |
| `currentLabel / completeLabel / errorLabel` | `string` | `Current / Complete / Needs attention` | Localized state labels. |

`StepOption` is `{ value, label, disabled?, status?: 'pending' | 'complete' | 'error' }`. Typed string/number IDs remain distinct. `update:modelValue(value)` requests an enabled, different step. Focus alone does not change the step; Tab and each platform's button activation remain normal navigation. Web marks the current action with `aria-current="step"`.

The host owns panels, routing, backward navigation and permission to advance. The recipe uses Vue `KeepAlive` with stable step keys, so partial date input and file selection survive returning to a visited panel. It validates before forward navigation, allows going back, registers fields in the parent and reveals the appropriate step before focusing an error. Nothing is saved to a server; finishing is a cancellable local demonstration.

Use an explicit initial step and identical server/client draft for SSR. Do not serialize focus handles, controllers, upload transports or component instances. Router changes and page reload persistence are separate host decisions. The component does not impose a linear wizard or import a router.

## Mac

In a shared screen for the [experimental Mac target](../guide/macos-experimental), `MSteps` draws the same numbered buttons with the state of each step under it, and asks the source for another step in the same way. Step values are strings there.

<<< @/../examples/catalog/shared/demos/StepsDemo.vue
