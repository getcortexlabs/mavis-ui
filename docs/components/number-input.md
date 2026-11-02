---
title: NumberInput
description: Numbers, with room to edit.
---

# NumberInput

Numbers, with room to edit.

::: info Next release
Available in Mavis `0.1.0-alpha.7`.
:::

<ComponentPreview component="number-input" />

```vue
<m-number-input v-model="quantity" label="Quantity" :min="1" :max="8" />
```

Incomplete text stays in the editor without publishing an invalid number. Grouping, exponent notation and currency are not accepted. Uses JavaScript numbers, not a financial decimal type. Public focus() and blur() methods.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue / v-model` | `number  /  null` | `null` | Valid number controlled by the app. |
| `draft / v-model:draft` | `string` | `—` | Optional draft, including incomplete text. |
| `label` | `string` | `required` | Required visible label. |
| `min / max` | `number` | `—` | Inclusive bounds. |
| `step` | `number` | `1` | Positive button and Web arrow-key increment. |
| `locale` | `en-US  /  pt-BR` | `en-US` | Decimal separator; grouping is not accepted. |
| `disabled / readonly` | `boolean` | `false` | Blocks editing and stepping. |

<<< @/../examples/catalog/shared/demos/NumberInputDemo.vue


The editor accepts `.` from decimal keyboards in both locales; `pt-BR` also accepts `,` and formats external values with it. Group separators are never inferred: `1.000` means one, not one thousand. Mixed separators are invalid.


`update:modelValue` emits valid numbers or `null`; `update:draft` follows the text. `validityChange` distinguishes `valid`, `empty`, `incomplete`, `invalid` and `range`. Use it to block submission while a draft is invalid: the numeric model still holds the last valid value. `name` names the Web form field. Public `focus()`/`blur()` forward to the editor; focus/blur events carry no platform objects.
