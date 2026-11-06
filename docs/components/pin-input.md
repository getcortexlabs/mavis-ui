---
title: PinInput
---

# PinInput

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="pin-input" :height="1000" />

```vue
<MPinInput
  v-model="code"
  label="Verification code"
  :length="6"
  autocomplete="one-time-code"
  @complete="checkCode"
/>
```

| Prop                             | Type    | Default          | Contract                                           |
| -------------------------------- | ------- | ---------------- | -------------------------------------------------- |
| `modelValue / label`             | string  | empty / required | Canonical numeric code and accessible editor name. |
| `length`                         | number  | 6                | Integer between 2 and 12.                          |
| `disabled / readonly / required` | boolean | false            | Input availability and Web form validation.        |
| `id / name / form`               | string  | —                | Editor id and Web form association.                |
| `error / helperText`             | string  | —                | Associated validation/help message.                |

One real editor beneath decorative cells preserves selection, paste and autofill. Numeric strings retain leading zeros; full-width digits and pasted separators are normalized. complete(value) fires after a user edit fills the code, not after a programmatic model update. It does not verify the code or perform authentication. Native autofill availability depends on the operating system and application setup. Web uses one-time-code, a single named form field and native pattern validation; focus()/blur() target that editor.

<<< @/../examples/catalog/shared/demos/PinInputDemo.vue
