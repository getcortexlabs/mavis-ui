---
title: Profile
description: A shared Mavis profile editor with live preview, labeled text fields, validation, keyboard navigation and local save state.
---

# Profile

Edit a name, email and bio while the profile card updates above the form. The same Vue screen runs on NativeScript and Web, with Mavis and Midnight themes.

<a href="/playground/#/showcase/profile" target="_blank" rel="noopener">Open the interactive example ↗</a>

The screen owns validation and saved values. Submitting Name focuses Email; submitting Email focuses the multiline bio. Save focuses the first invalid field or closes editing and confirms the local save. Discard returns to the last saved values. Leaving the screen resets the demonstration; it does not update an account or send data anywhere.

`MInput` supplies the editor, label, help and error appearance. `MScreen` manages scrolling around the keyboard. The profile preview, form card and confirmation use existing Mavis components.

`MSwitch` adds notification and weekly digest preferences. Save and Discard include these booleans along with the text fields. [Switch reference](../components/switch).

## Source

<<< @/../examples/catalog/shared/pages/Profile.vue

Read the [Input reference](../components/input) for editing, composition, focus methods and platform differences.

`MSelect` adds the profile interest. Save and Discard include this choice; cancelling its list leaves the form untouched. [Select reference](../components/select).

`MToast` confirms a successful save without moving focus or scrolling the form. Validation stays next to the fields. [Toast reference](../components/toast).
