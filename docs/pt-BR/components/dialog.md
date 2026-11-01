---
title: Dialog
description: Confirmações controladas, ações destrutivas e processamento em NativeScript e Web.
---

# Dialog

`MDialog` · Uma pausa para decidir.

::: info Próxima alpha
Dialog está no repositório; não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="dialog" :height="700" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
const loading = ref(false)
const error = ref('')
async function confirm() {
  loading.value = true
  error.value = ''
  try {
    await saveChanges() // Your application's operation.
    open.value = false
  } catch {
    error.value = 'Could not save. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <m-screen>
    <m-button @click="open = true">Save changes</m-button>
    <m-dialog v-model:open="open" title="Save changes?"
      :description="error || 'Your profile will be updated.'"
      :loading="loading" confirmLabel="Save" cancelLabel="Keep editing"
      loadingLabel="Saving…" @confirm="confirm" />
  </m-screen>
</template>
```

`saveChanges` representa a operação do seu app. `confirm` não fecha o Dialog: o pai controla `open`, pode apresentar erro em `description` e permitir outra tentativa. No NativeScript, declare o componente dentro de `MScreen` e use a integração de voltar do router descrita em [Sheet](./sheet).

## Props

| Prop | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | `v-model:open`. |
| `title` | `string` | obrigatório | Título não vazio e nome acessível. |
| `description` | `string` | `''` | Texto simples opcional. HTML não é interpretado. |
| `tone` | `default \| danger` | `default` | Ícone e ênfase da confirmação. |
| `confirmLabel` | `string` | `Continue` | Ação principal; não vazio. |
| `cancelLabel` | `string` | `Cancel` | Cancelamento explícito; não vazio. |
| `loading` | `boolean` | `false` | Bloqueia ações, fundo, Escape e voltar. |
| `loadingLabel` | `string` | `Working…` | Rótulo da confirmação enquanto processa; não vazio. |
| `dismissible` | `boolean` | `true` | Permite fundo, Escape e voltar. Cancelar continua disponível. |
| `id` | `string` | — | Identificador da superfície modal. |

## Eventos e ciclo de vida

- `confirm()` solicita a ação e mantém o diálogo aberto.
- `update:open(false)` solicita fechamento; o pai pode aceitar ou rejeitar.
- `close(reason)` identifica `cancel`, `backdrop`, `escape`, `back`, `program` ou `navigation`. É emitido ao solicitar/iniciar o fechamento, antes de a animação terminar. Uma recusa do pai ainda emite o motivo, sem deixar o diálogo inerte.

`DialogCloseReason` é exportado pelo core. Alterar `open` para `false` fecha mesmo durante `loading` e emite `program`. No nativo, unload por navegação libera a camada e solicita `navigation`, inclusive em páginas retidas; unload por segundo plano preserva o estado para o retorno. Na Web, desmontar a rota remove o diálogo e libera foco/rolagem; não emite um evento de navegação.

O fundo bloqueia a tela. Na Web, o botão de cancelar recebe foco inicial; Tab fica entre as ações e fechar devolve foco ao acionador ainda montado. Durante processamento, o foco fica no painel. Android trata voltar e teclado Tab/Escape; iOS isola o conteúdo modal para tecnologia assistiva. Isso não representa auditoria completa com leitores de tela ou hardware físico.

Textos longos rolam dentro do painel e as ações permanecem em área separada. No nativo, abrir dispensa o teclado; a superfície respeita os insets e acompanha a rotação. A entrada usa Jolt; na Web usa CSS. Ambos seguem movimento reduzido. Toast aguarda enquanto o modal está apresentado.

Use um modal por vez. Não abra Dialog dentro de Sheet ou Select. Slots livres, formulários, empilhamento, serviço global e helpers de promises ficam fora deste primeiro contrato. Para conteúdo personalizado, use Sheet.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/DialogDemo.vue

</details>

[Profile](../showcase/profile) pede confirmação antes de descartar alterações.
