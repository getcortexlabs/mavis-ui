---
title: Select
description: Campo compacto de seleção controlada, com Sheet nativa e lista operada por teclado na Web.
---

# Select

`MSelect` · Um campo compacto que abre uma lista local de escolhas.

::: info Próxima alpha
Select está disponível no repositório. Não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="select" :height="920" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'

const interest = ref<ChoiceValue | null>(null)
const options: ChoiceOption[] = [
  { value: 'design', label: 'Design', helperText: 'Ideias que ganham forma.' },
  { value: 'photo', label: 'Fotografia' },
  { value: 'film', label: 'Cinema', disabled: true },
]
</script>

<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="md">
      <MSelect v-model="interest" :options="options" label="Seu universo"
        placeholder="Escolha um interesse" closeLabel="Fechar"
        emptyText="Nenhum interesse disponível" />
      <MButton variant="ghost" @click="interest = null">Limpar escolha</MButton>
    </MColumn>
  </MScreen>
</template>
```

## API

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `modelValue / v-model` | `ChoiceValue \| null` | `null` | Valor controlado. Null significa nenhuma escolha. |
| `options` | `readonly ChoiceOption[]` | obrigatório | O [contrato de opções do Radio](./radio): valores estáveis string/número finito, rótulos e helperText/disabled opcionais. |
| `label` | string | obrigatório | Rótulo visível do campo e título da lista. |
| `placeholder` | string | `Select an option` | Texto quando nenhuma opção corresponde ao valor. |
| `helperText` | string | `''` | Explicação abaixo do campo. |
| `error` | string | `''` | Substitui a ajuda e aplica a borda de erro. |
| `disabled` | boolean | `false` | Impede abertura; fecha uma lista aberta sem mudar o valor. |
| `closeLabel` | string | `Close` | Nome acessível do botão de fechar. |
| `emptyText` | string | `No options available` | Mensagem na lista vazia. |
| `width / grow / shrink` | dimension / number | `auto` / `0` / contexto | Dimensão e distribuição do campo. |

`id` identifica o botão que abre a lista. `accessibilityHidden` segue o [contrato compartilhado](../guide/component-contract). Traduza placeholder, closeLabel e emptyText junto com os rótulos e a ajuda.

`update:modelValue` emite uma string ou número quando uma opção habilitada diferente da atual é ativada. Escolher fecha a lista imediatamente; não há etapa de Aplicar. Repetir a seleção apenas fecha. Abrir, cancelar, fechar e alterações externas não emitem. O pai pode recusar uma proposta: o campo continua mostrando o valor do pai após fechar.

Para limpar, atribua `null` externamente; Select não emite null nem adiciona uma opção vazia artificial. String vazia e zero continuam sendo valores válidos. Validação obrigatória, persistência e envio pertencem ao app. `error` exibe uma mensagem; não valida o valor.

## Mudanças com a lista aberta

Opções, rótulos, ajuda e estados disabled atualizam ao vivo. Reordenar preserva a identidade. Remover a opção selecionada exibe o placeholder sem alterar o modelo; adicionar o valor novamente restaura seu rótulo. Uma opção selecionada desabilitada mantém rótulo e marca. Um evento anterior não pode escolher uma opção removida ou desabilitada. Nenhum substituto é gravado automaticamente.

Na Web, o cursor do teclado permanece numa opção habilitada; se ela desaparecer, vai à seleção habilitada ou à primeira disponível. Uma alteração externa do modelo move o cursor para a nova seleção. Uma lista vazia mostra emptyText; uma lista só com opções desabilitadas continua podendo ser fechada.

## Apresentação por plataforma

**NativeScript:** declare Select dentro de `MScreen`, que fornece a camada da Sheet. Usa a Sheet existente do Jolt, opções roláveis com quebra de rótulo/ajuda e estados nativos de botão/radio. Fechar permanece no cabeçalho. Abrir encerra a edição de texto antes de apresentar a lista, para que fechar não reabra o teclado do editor anterior. A página continua montada. Com vue-router-ns, forneça `claimSystemBack` ao `createMavis`, como em [Sheet](./sheet); o voltar do Android fecha a lista antes de navegar. Navegação/unload fecha a lista; unmount remove a camada e os listeners de pressão. O teclado nativo segue a navegação de foco da plataforma.

**Web:** um botão abre um diálogo modal com listbox de seleção única. Tab chega ao campo; Enter, Espaço ou seta acima/abaixo abre a lista. O foco começa na seleção habilitada ou na primeira disponível. Acima/abaixo percorrem circularmente, pulando disabled; Home/End alcançam primeira/última; digitar letras move para um rótulo correspondente. Esses movimentos não alteram o valor. Enter/Espaço ou clique confirma. Escape, fechar e o fundo cancelam. Tab fica no diálogo enquanto aberto; fechar devolve foco ao campo. Seleção e cursor de teclado têm marcas visuais distintas.

Os dois temas usam os mesmos tokens do Input. Rótulos longos quebram e a seta mantém seu lugar. O movimento nativo vem do Jolt; a Web usa CSS e respeita movimento reduzido. Não depende de Jolt Web.

O primeiro escopo é uma lista local, sem virtualização. A validação cobre listas vazias, com quatro e com 50 opções; 50 é um tamanho testado, não uma garantia de desempenho. Busca, carregamento remoto, seleção múltipla e templates de opção ficam para depois. Prefira [Radio](./radio) para poucas opções que devam ficar visíveis.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/SelectDemo.vue

</details>

[Perfil](../showcase/profile) combina Select, Input e Switch. Salvar e Descartar incluem o interesse escolhido junto com os textos e preferências booleanas.
