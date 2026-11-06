---
title: NumberFlow
---

# NumberFlow

::: info Added in RC.11.1
Included in Mavis 0.1.0-rc.11.1 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="number-flow" :height="850" />

```vue
<MNumberFlow
  :value="revenue"
  label="Revenue"
  locale="en-US"
  :format="{ style: 'currency', currency: 'USD' }"
/>
```

| Prop                             | Type                         | Contract                                                  |
| -------------------------------- | ---------------------------- | --------------------------------------------------------- |
| `value`                          | `number`                     | Required finite canonical value.                          |
| `locale / format`                | `string / NumberFlowFormat`  | `en-US`; consistent server/client formatting.             |
| `formatValue`                    | `(value: number) => string`  | Overrides locale formatting.                              |
| `duration / animated / announce` | `number / boolean / boolean` | `650 / true / false`. Polite announcements are opt-in.    |
| `variant / tone / label`         | Text variant / tone / string | Typography and accessible label. Default variant `title`. |

Jolt rolls the changing digits while the canonical formatted value remains available to assistive technology. Currency, grouping, decimal changes and rapidly replaced values use the same presentation. The first SSR/client paint is the final value, with no entrance from zero. Reduced motion settles immediately. Disabling animation stops the active effect. Use `formatValue` for an application-specific formatter, and keep its output deterministic between server and client.

<<< @/../examples/catalog/shared/demos/NumberFlowDemo.vue

Web uses `Intl.NumberFormat`; iOS and Android use system number formatters. `format` accepts `style` (`decimal`, `currency`, `percent`), `currency`, `currencyDisplay` (`symbol`, `code`), `useGrouping`, `minimumIntegerDigits`, `minimumFractionDigits` and `maximumFractionDigits`. Symbols and spacing follow the system locale data. For compact notation, units or custom rules, supply `formatValue`.
