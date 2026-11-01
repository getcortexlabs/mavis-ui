---
title: Radio
description: Uma escolha controlada entre opções visíveis, com contrato compartilhado entre NativeScript-Vue e Vue Web.
---

# Radio

`MRadioGroup` · Escolha uma opção de uma lista visível.

::: info Próxima alpha
Radio está disponível no repositório. Ainda não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="radio" :height="860" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'

const rhythm = ref<ChoiceValue | null>(null)
const options: ChoiceOption[] = [
  { value: 'weekly', label: 'Sem pressa', helperText: 'Um resumo semanal.' },
  { value: 'daily', label: 'Um pouco por dia' },
  { value: 'live', label: 'Em tempo real', disabled: true },
]
</script>

<template>
  <MRadioGroup v-model="rhythm" :options="options" label="Ritmo de leitura" />
</template>
```

O grupo renderiza suas opções; não é preciso montar itens `MRadio` separados nem usar layouts da plataforma. Use rótulos de texto simples e mantenha links ou outros controles fora das opções.

## API

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `modelValue / v-model` | `ChoiceValue \| null` | `null` | Seleção controlada; null representa nenhuma escolha. |
| `options` | `readonly ChoiceOption[]` | obrigatório | Lista ordenada de opções com valores únicos. |
| `label` | string | obrigatório | Rótulo visível do grupo. |
| `helperText` | string | `''` | Explicação opcional abaixo do rótulo do grupo. |
| `disabled` | boolean | `false` | Desabilita todas as opções sem mudar o valor. |
| `width / grow / shrink` | dimension / number | `auto` / `0` / contexto do layout | Tamanho e distribuição de espaço do grupo. |

`id` identifica o grupo. `accessibilityHidden` segue o [contrato compartilhado](../guide/component-contract).

`update:modelValue` emite uma string ou número quando o usuário solicita uma opção habilitada diferente da atual. Ativar novamente a opção selecionada não emite. Atualizações externas nunca emitem; o controle não emite null nem limpa a própria seleção.

## Contrato compartilhado de opções

`ChoiceValue` é uma string ou número finito. `ChoiceOption` contém `value`, `label` não vazio e os campos opcionais `helperText` e `disabled`. Rótulos podem acompanhar o idioma sem mudar os valores. O número `1` e a string `'1'` são escolhas diferentes; `0` e `''` são valores válidos. Valores duplicados, rótulos vazios e valores inválidos lançam erro. Os mesmos tipos do core servirão ao Select.

| Mudança | Resultado |
| --- | --- |
| Valor inicial null ou lista vazia | Nenhuma opção selecionada. Não escolhe a primeira implicitamente. |
| Pai aceita a ativação | A opção solicitada fica selecionada. |
| Pai recusa a ativação | A seleção anterior permanece, inclusive no input do navegador. |
| Opção selecionada é desabilitada | Continua marcada e não pode ser ativada. As demais opções habilitadas continuam disponíveis. |
| Opção selecionada é removida ou o valor não existe na lista | Nenhuma marca aparece; o modelo permanece intacto. Reintroduzir esse valor restaura a marca. |
| Rótulos ou ordem mudam | A seleção acompanha o valor. |
| Pai escreve null | A seleção é limpa sem evento. |

Validação de campo obrigatório, persistência e envio pertencem ao app. O grupo não altera o array de opções nem escolhe um valor substituto.

## Interação e aparência

Indicador, rótulo e ajuda compartilham a área de toque. Rótulos quebram linha e o círculo mantém seu tamanho. As cores Mavis e Midnight acompanham o tema ativo.

Na Web, inputs radio nativos ficam dentro de um radiogroup com rótulo. Tab entra pela opção selecionada habilitada ou pela primeira habilitada quando necessário. As setas percorrem e selecionam opções habilitadas, retornando ao início/fim; Home/End vão à primeira/última. Espaço seleciona a opção focada. Tab sai do grupo em um passo. Se todas as opções estiverem desabilitadas, o grupo não recebe Tab. O feedback CSS respeita movimento reduzido.

No NativeScript, o círculo temático fica sobre a superfície de entrada de um botão nativo. Android expõe RadioButton e estado marcado, com contorno de foco de teclado. iOS usa traits de botão/selecionado. Jolt cuida da pressão; o movimento é interrompido e a marca restaurada ao desabilitar, descarregar ou desmontar. O teclado nativo segue a navegação de foco da plataforma; o comportamento de setas do grupo Web é implementado no renderizador Web. Arrastar para rolar não deve selecionar uma opção.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/RadioDemo.vue

</details>

A [sessão de foco](../showcase/focus) usa Radio para o ambiente junto de Slider, ação com loading e resumo da sessão. Use [Checkbox](./checkbox) para seleções independentes e [Switch](./switch) para preferências booleanas.
