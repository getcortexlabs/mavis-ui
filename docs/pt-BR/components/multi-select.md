---
title: MultiSelect
description: Várias escolhas. Um só lugar.
---

# MultiSelect

Várias escolhas. Um só lugar.

::: info No próximo release
Disponível no código-fonte após este PR. Não está na alpha.6 publicada.
:::

<ComponentPreview component="multi-select" />

```vue
<m-multi-select v-model="extras" :options="options" label="Extras" :maxSelected="2" />
```

Busca local em uma Sheet nos dois renderizadores. Cada seleção deve existir em options; filtro não apaga seleções. Não inclui paginação remota ou virtualização. O app atualiza opções e seleção de forma consistente.

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `modelValue / v-model` | `readonly ChoiceValue[]` | `[]` | Valores únicos controlados pelo app. |
| `options` | `readonly ChoiceOption[]` | `required` | Opções locais com valor, rótulo e disabled opcional. |
| `label` | `string` | `required` | Rótulo e título da Sheet. |
| `maxSelected` | `number` | `—` | Limite positivo de escolhas. |
| `searchLabel / closeLabel / removeLabel` | `string` | `Search options / Done / Remove` | Textos das ações, definidos pelo app. |

<<< @/../examples/catalog/shared/demos/MultiSelectDemo.vue
