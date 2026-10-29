---
title: Slider
description: "Slider no Mavis UI. Seleção numérica com limites e passos inteiros ou decimais."
---

# Slider

`m-slider` · Seleção numérica com limites e passos inteiros ou decimais.

<ComponentPreview component="slider" :height="330" />

## Uso

```vue
<m-slider v-model="temperature" :min="16" :max="28" :step="0.5" label="Temperatura" />
```

Os valores e as funções do trecho pertencem ao seu componente. O exemplo completo abaixo mostra sua inicialização.

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `modelValue / v-model` | number | `0` | Valor selecionado. |
| `min` | number | `0` | Limite inferior. |
| `max` | number | `100` | Limite superior. |
| `step` | number | `1` | Passo maior que zero. |
| `label` | string | `obrigatório` | Nome acessível do controle. |
| `disabled` | boolean | `false` | Bloqueia a interação. |

`update:modelValue` emite o valor numérico ajustado ao passo. `min` deve ser menor que `max`; todos os valores devem ser finitos. Valores externos são limitados e ajustados para exibição, sem alterar o estado do app automaticamente. Quando o intervalo não é divisível pelo passo, o último passo chega a `max`. Na Web, setas, Home e End operam o controle.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/SliderDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).
