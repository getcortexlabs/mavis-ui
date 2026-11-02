---
title: Form Group
description: Groups related editors under a visible heading and optional description. Field values, validation rules and submission remain in the application.
---

# Form Group

Groups related editors under a visible heading and optional description. Field values, validation rules and submission remain in the application.

::: info Unreleased
Available in source; not included in alpha.4.
:::

<ComponentPreview component="form-group" :height="900" />

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `label` | `string` | required | Nonempty visible heading. |
| `description` | `string` | `''` | Optional explanation for the group. |
| `id` | `string` | generated | Stable group identity; Web connects heading and description. |

The default slot contains your fields. This component does not create an HTML `<form>`, add required validation, or intercept Enter. A Web host can wrap the recipe in a native form and choose `type="submit"` for its button. Native hosts call the same submit function from an action. Native presentation uses the same heading and controls; grouping semantics follow the native primitives.

Use [Form Errors](./form-errors) to connect an error summary to the public `focus()` handles of Input, DatePicker, DateRangePicker or Combobox.

<<< @/../examples/catalog/shared/demos/FormDemo.vue
