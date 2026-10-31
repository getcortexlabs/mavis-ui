---
title: Checkbox
description: Escolhas independentes com estados marcado, desmarcado e indeterminado, compartilhadas entre NativeScript-Vue e Vue Web.
---

# Checkbox

`MCheckbox` · Selecione itens, filtros ou opções independentes.

::: info Próxima alpha
Checkbox está disponível no repositório. Ainda não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="checkbox" :height="760" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
const selected = ref(false)
const mixed = ref(true)
</script>

<template>
  <MCheckbox
    v-model="selected"
    v-model:indeterminate="mixed"
    label="Todos os assuntos"
    helperText="Escolha o que aparece na sua coleção."
    indeterminateLabel="Seleção parcial"
  />
</template>
```

## API

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `modelValue / v-model` | boolean | `false` | Valor marcado, controlado pelo app. |
| `indeterminate` | boolean | `false` | Exibição parcial controlada; tem precedência sobre marcado. |
| `label` | string | obrigatório | Rótulo visível e nome acessível. |
| `helperText` | string | `''` | Texto de apoio opcional. |
| `indeterminateLabel` | string | `Partially selected` | Descrição acessível do estado parcial. Traduza junto com o rótulo. |
| `disabled` | boolean | `false` | Impede ativação pela linha inteira e pelo teclado. |
| `width` | número, percentual ou `auto` | `auto` | Largura da linha completa. |
| `grow / shrink` | number | `0` / contexto do layout | Distribuição de espaço no pai. |

`id` identifica o controle. `accessibilityHidden` segue o [contrato compartilhado](../guide/component-contract).

Cada ativação emite um booleano em `update:modelValue`. Com `indeterminate=true`, primeiro emite `update:indeterminate(false)` e depois `update:modelValue(true)`, mesmo se o valor marcado anterior já era true. Nos demais casos, alterna o valor marcado. Atualizações externas nunca emitem.

Os dois valores pertencem ao pai. Use os dois `v-model` para estado armazenado, ou derive o checkbox pai de um array de seleção e atualize esse array por `update:modelValue`, como no exemplo completo. Mudanças ignoradas mantêm a aparência anterior; o componente não limpa o indeterminado internamente. Arrays, validação, envio e grupos de checkboxes pertencem ao app.

## Interação e aparência

Caixa, rótulo e ajuda ativam um único controle. Use texto simples; links e outros controles ficam fora do Checkbox. Rótulos longos quebram linha sem encolher a marca.

A Web usa um input checkbox nativo sob a aparência do tema. Tab foca o controle e Espaço o ativa; Enter mantém o comportamento do formulário no navegador. O input expõe o estado parcial e o movimento CSS respeita movimento reduzido. No NativeScript, um botão nativo cobre a linha inteira, com semântica de checkbox e marca Mavis. O foco de teclado Android recebe contorno na cor do tema; iOS usa o tratamento de foco do sistema. Jolt anima a marca na pressão e libera o movimento ao desabilitar, descarregar ou desmontar. Gestos de rolagem não devem selecionar um item.

Use [Switch](./switch) para uma preferência imediata de ligar e desligar.

## Exemplo completo

O arquivo roda nos dois catálogos e na prévia. O app deriva selecionar todos e estado parcial dos IDs selecionados.

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/CheckboxDemo.vue

</details>

## Em contexto

[Biblioteca](../showcase/library) combina filtros independentes, selecionar todos, cartões de resultados e estado vazio em uma tela completa.
