---
title: NumberInput
description: Números, com espaço para editar.
---

# NumberInput

Números, com espaço para editar.

::: info Adicionado na alpha.7
Disponível na Mavis `0.1.0-alpha.7`.
:::

<ComponentPreview component="number-input" />

```vue
<m-number-input v-model="quantity" label="Quantity" :min="1" :max="8" />
```

Texto incompleto permanece no editor sem publicar um número inválido. Não aceita agrupamento, notação exponencial nem moeda. Usa números JavaScript; não é um tipo decimal financeiro. focus() e blur() são públicos.

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `modelValue / v-model` | `number  /  null` | `null` | Valor válido controlado pelo app. |
| `draft / v-model:draft` | `string` | `—` | Rascunho opcional, inclusive texto incompleto. |
| `label` | `string` | `required` | Rótulo visível obrigatório. |
| `min / max` | `number` | `—` | Limites inclusivos. |
| `step` | `number` | `1` | Passo positivo dos botões e das setas Web. |
| `locale` | `en-US  /  pt-BR` | `en-US` | Separador decimal; agrupamento não é aceito. |
| `disabled / readonly` | `boolean` | `false` | Bloqueia edição e ações. |

<<< @/../examples/catalog/shared/demos/NumberInputDemo.vue


O editor aceita `.` dos teclados decimais nos dois idiomas; `pt-BR` também aceita `,` e usa vírgula ao formatar valores externos. Separadores de milhar não são inferidos: `1.000` significa um, não mil. Separadores misturados são inválidos.


`update:modelValue` emite somente números válidos ou `null`; `update:draft` acompanha o texto. `validityChange` distingue `valid`, `empty`, `incomplete`, `invalid` e `range`. Use esse evento para impedir o envio enquanto houver um rascunho inválido: o modelo numérico ainda guarda o último valor válido. A prop `name` nomeia o campo no formulário Web. `focus()` e `blur()` encaminham ao editor, e os eventos `focus`/`blur` não carregam objetos de plataforma.
