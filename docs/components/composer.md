---
title: Composer
---

# Composer

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="composer" :height="1000" />

```vue
<MComposer
  v-model="draft"
  v-model:attachments="attachments"
  label="Your message"
  @attach="chooseFiles"
  @submit="send"
/>
```

| Prop                                                                | Type                          | Default               | Contract                                           |
| ------------------------------------------------------------------- | ----------------------------- | --------------------- | -------------------------------------------------- |
| `modelValue / attachments`                                          | string / ComposerAttachment[] | empty / []            | Controlled draft and unique attachment ids/names.  |
| `label / placeholder / error`                                       | string                        | —                     | Editor name, hint and validation message.          |
| `rows / maxLength`                                                  | number                        | 2 / unlimited         | Initial editor lines and optional character limit. |
| `loading / disabled / readonly`                                     | boolean                       | false                 | Explicit editing and submission states.            |
| `followKeyboard / keyboardOffset / shortcut`                        | boolean / number / boolean    | false / 0 / true      | Overlay keyboard following and Web Ctrl/Cmd+Enter. |
| `attachable / attachLabel / removeLabel / sendLabel / sendingLabel` | boolean / string              | true / English labels | Attachment affordance and translatable controls.   |

A controlled multiline editor with removable attachment names. The application chooses files, sends messages and clears the draft after success; the component never uploads or clears it automatically. The submit event receives { text, attachments }. Ctrl/Cmd+Enter submits on Web while Enter keeps its newline and IME composition is preserved. loading locks editing and actions. followKeyboard is opt-in for a dedicated overlay; leave it off inside a resizing Screen or Sheet to avoid duplicate adjustments. Web keyboard geometry is estimated; native timing is supplied by Jolt. Slots: default for supporting content. focus()/blur() target the editor.

<<< @/../examples/catalog/shared/demos/ComposerDemo.vue
