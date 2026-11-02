---
title: Form Errors
description: An actionable error summary that reveals the owning section before focusing its editor.
---

# Form Errors

An actionable error summary that reveals the owning section before focusing its editor.

::: info Unreleased
Available in source; not included in alpha.4.
:::

<ComponentPreview component="form-errors" :height="900" />

Create one `useFormController()` per form. Register fields with `useFormField(form, { name, label, target, enabled?, reveal? })`, where `target` returns an `InputHandle`. The controller never queries a DOM ID or owns the draft. `reveal` can activate a cached step and await Vue `nextTick()` before resolving the mounted handle.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `form` | `FormController` | required | Request/component-owned controller. |
| `title` | `string` | `Review these fields` | Visible summary heading. |
| `announce` | `boolean` | `false` | Opt-in Web alert role; otherwise a named region. |

`form.setErrors([{ field, message }])` replaces the summary without focusing automatically. `await form.focusFirstError()` is an explicit host action, normally after an unsuccessful submission. Unregistered or disabled fields are skipped; their messages remain visible. Clicking an available error invokes `focusError(field)` and emits `focus(field, focused)`. Only one outstanding focus operation owns the result, preventing a late section reveal from stealing a later focus request.

`await form.validate(async ({ current, onCancel }) => errors)` returns `valid`, `invalid`, `cancelled` or `busy`. Concurrent submissions return `busy`. Call `form.invalidate()` when the host draft changes; obsolete success and failure cannot overwrite newer errors. Register transport cancellation through `onCancel`. Current transport errors are rethrown for the host to present; they are not field errors. No network transport, schema library or validation rule is built in.

Vue composables release field registrations and dispose controllers on scope disposal. Cached fields only expose their handle while active; supply `reveal` when errors can point into another step. Register all step fields in the owning form if a summary must reach an unvisited step. Keep draft values and the retained panel lifecycle in the host. SSR renders only the provided errors; it does not focus or validate automatically.

<<< @/../examples/catalog/shared/demos/FormDemo.vue
