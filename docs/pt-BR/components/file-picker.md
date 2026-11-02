---
title: FilePicker
description: Seleção explícita de documentos e estados de envio controlados pelo app em Web e NativeScript.
---

# FilePicker

`MFilePicker` abre o seletor de documentos da plataforma e apresenta nomes, prévias opcionais, progresso e ações. O aplicativo fornece o transporte do envio. Selecionar um arquivo nunca inicia o envio.

::: info Não publicado
Disponível no Mavis alpha.5.
:::

<ComponentPreview component="file-picker" :height="1100" lang="pt" />

## Seleção compartilhada

```vue
<script setup lang="ts">
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'

const selection = useFileSelection({
  multiple: true,
  accept: ['image/*', '.pdf'],
  maxCount: 3,
  maxSize: 5 * 1024 * 1024,
})
</script>

<template>
  <m-file-picker :selection="selection" label="Documentos da viagem"
    chooseLabel="Escolher arquivos" removeLabel="Remover"
    emptyLabel="Nenhum arquivo selecionado" />
</template>
```

`useFileSelection` cria um controlador pertencente ao componente Vue atual. O unmount cancela operações e libera recursos. A desativação pausa operações e mantém arquivos para uma nova tentativa explícita. Mantenha o dono acima de um `MFilePicker` condicional se a seleção deve sobreviver ao ocultar o controle. Ocultar, descarregar ou desabilitar o seletor pausa o trabalho; montar novamente não retoma envios automaticamente.

`createFileSelection(options)`, de `@getcortexlabs/mavis-core`, oferece o mesmo contrato sem depender de Vue; seu dono deve chamar `dispose()`. Crie uma instância por dono/requisição, nunca um singleton de módulo no servidor.

| Opção | Padrão | Comportamento |
| --- | --- | --- |
| `multiple` | `false` | A seleção simples substitui o arquivo anterior após validar. A múltipla acrescenta. |
| `accept` | `[]` | Extensões, tipos MIME exatos ou famílias como `image/*`. |
| `maxCount` | `1`, ou `10` em múltipla | Limite de descritores. O modo simples sempre aceita no máximo um. |
| `maxSize` | ausente | Limite por arquivo, em bytes. Um tamanho desconhecido não pode ser validado localmente. |
| `initial` | `[]` | Descritores serializáveis existentes, sem criar handles ou prévias locais. |
| `upload` | ausente | Callback do app para envio e nova tentativa explícitos. Sem ele, a UI apenas seleciona. |

Cancelar preserva a seleção anterior. Um lote inválido é rejeitado por inteiro e seus novos recursos são liberados. Selecionar novamente o mesmo arquivo é permitido e gera outro ID. Seleções separadas não são deduplicadas no modo múltiplo. Os filtros e limites ajudam a interface; a validação definitiva pertence ao servidor. Quando o provedor não informa o MIME, informe uma extensão aceita para permitir esse arquivo.

## Estado e transporte

`selection.state` contém `items`, `picking` e um `error` opcional com código `picker`, `type`, `size` ou `count`. `subscribe(listener)` observa mudanças e devolve a função de limpeza. Os snapshots são imutáveis. Cada `FileItem` contém somente `id`, `name`, `size`/`type` opcionais, `status`, `progress` e `error` opcionais. Os estados são `selected`, `uploading`, `uploaded`, `failed` e `cancelled`.

O app injeta `upload({ item, handle, cancellation, progress })`, que retorna uma promise. Resolver marca sucesso; rejeitar marca falha. `progress(loaded, total?)` informa bytes, com total positivo para progresso conhecido. Sem total, o progresso é indeterminado. Chegar a 100% não resolve a promise. Conecte `cancellation.onCancel(callback)` ao mecanismo de cancelamento da requisição e remova essa inscrição quando a requisição terminar.

O controlador expõe `upload(id)`, `retry(id)`, `cancel(id)`, `remove(id)`, `clear()`, `pause()` e `dispose()`. Retry chama o mesmo callback com o handle local preservado e inicia outra tentativa; não implica retomada de transferência nem idempotência no servidor. Cancelar mantém o arquivo local; remover, limpar e descartar liberam o recurso. Resultados e progresso de tentativas canceladas, removidas ou substituídas são ignorados, mesmo quando o transporte não consegue abortar. Arquivos concluídos continuam disponíveis para prévia até a liberação pelo dono.

Na Web, o app transforma o handle opaco em um `File`:

```ts
import { getWebFile } from '@getcortexlabs/mavis-web'
import type { FileUpload } from '@getcortexlabs/mavis-core'

// uploadURL vem da configuração do app; autenticação também pertence ao app.
const upload: FileUpload = async ({ handle, cancellation }) => {
  const abort = new AbortController()
  const unsubscribe = cancellation.onCancel(() => abort.abort())
  try {
    const body = new FormData()
    body.append('file', getWebFile(handle))
    const response = await fetch(uploadURL, { method: 'POST', body, signal: abort.signal })
    if (!response.ok) throw new Error('O envio falhou. Tente novamente.')
  } finally {
    unsubscribe()
  }
}
```

O exemplo usa progresso indeterminado porque esse `fetch` não reporta bytes enviados. Endpoints, credenciais, headers, timeouts, armazenamento, retenção e política de retomada pertencem ao aplicativo. Mavis não fornece um serviço de transferências em segundo plano.

## Recursos e prévias por plataforma

Web cria um `<input type="file">` novo na ativação do botão. Imagens podem gerar uma object URL para prévia, revogada ao liberar o recurso. Uma prévia inválida mantém o nome e as ações. O botão oferece Tab, Enter e Espaço. O foco retorna ao seletor após seleção/cancelamento e antes de remover um item.

iOS usa `UIDocumentPickerViewController` em modo de cópia/importação no iOS 14+. O sistema cria uma cópia temporária privada, removida pelo Mavis ao liberar o recurso; o original permanece intacto. Quick Look solicita uma miniatura limitada. Android usa `ACTION_OPEN_DOCUMENT` e leitura transitória da content URI selecionada, sem permissões amplas de armazenamento nem grants persistentes. Miniaturas do provedor estão disponíveis no Android API 29+ quando suportadas. A pausa da Activity ao abrir o seletor do sistema mantém essa seleção ativa; sair ou desmontar seu dono Vue cancela a operação. São seletores de documentos que também aceitam imagens; não há captura de câmera nem seletor dedicado da biblioteca Fotos. Provedores de nuvem podem baixar o documento ou a miniatura selecionados. Consulte [document picker da Apple](https://developer.apple.com/documentation/uikit/uidocumentpickerviewcontroller), [miniaturas Quick Look](https://developer.apple.com/documentation/quicklookthumbnailing/qlthumbnailgenerator) e [acesso a documentos Android](https://developer.android.com/training/data-storage/shared/documents-files).

Apps nativos importam `getNativeFile(handle)` de `@getcortexlabs/mavis/vue`. Ele retorna `{ platform, native, openRead }`: `native` é uma content `Uri` Android ou `NSURL` iOS. `openRead()` retorna `{ native, close }`, contendo um `java.io.InputStream` ou `NSInputStream` já aberto. Os objetos nativos têm tipo `unknown` nessa fronteira; use os tipos de plataforma do app para refiná-los. Feche streams após o uso; remover/descartar também fecha os streams abertos por esse accessor. Handles liberados são rejeitados. Caminhos e URIs em texto não constituem uma API portátil de arquivo. Handles pertencem à seleção e ao processo atual, sem persistência para outra abertura do app.

Falhar na prévia não rejeita o arquivo. `selection.preview(id)` é estado de cliente específico do renderizador, separado dos descritores serializáveis. `hasFile(id)` distingue recursos locais de entradas com apenas metadados. SSR renderiza nomes, estados e placeholders sem ativar seletor ou object URLs. Descritores iniciais nunca recuperam o envio/retry local; o usuário precisa selecionar um arquivo novamente. Serialize somente `selection.state.items`, nunca o controlador, handles, prévias, `File`, `Blob` ou recursos nativos.

## Props do componente

| Prop | Finalidade |
| --- | --- |
| `selection` | `FileSelectionController` obrigatório. |
| `label` | Rótulo visível/acessível obrigatório e não vazio. |
| `disabled` | Bloqueia ações e pausa trabalho ativo; padrão false. |
| `chooseLabel / uploadLabel / cancelLabel / retryLabel / removeLabel` | Textos traduzíveis das ações; padrões em inglês. Os nomes acessíveis incluem o arquivo. |
| `emptyLabel / pendingLabel` | Textos dos estados vazio e indeterminado. |
| `statusLabels` | Mapa opcional dos cinco nomes de estado. |
| `errorLabels` | Mapa opcional dos erros de seleção. O transporte controla suas mensagens de falha. |

Não há eventos ou slots do componente. O controlador é dono do estado e funciona independentemente de formulários. Nomes e ações quebram em mais linhas em telas estreitas. Prévias são decorativas; o nome visível identifica o conteúdo. A demonstração compartilhada abaixo simula o envio localmente, sem transmitir arquivos.

Uma ref do componente expõe os métodos portáteis `focus()` e `blur()` de `InputHandle`. O foco vai para a ação Escolher sem abrir o seletor da plataforma; não faz nada enquanto o controle está desabilitado ou aguardando uma seleção. Blur libera o foco dessa ação sem cancelar a seleção ou o envio. Isso permite usá-lo como destino de erros de formulário e de foco após uma troca de etapa:

```ts
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const attachmentPicker = ref<InputHandle>() // vincule ref="attachmentPicker" ao MFilePicker
// Depois de montar o controle:
attachmentPicker.value?.focus()
attachmentPicker.value?.blur()
```

## Exemplo completo

<<< @/../examples/catalog/shared/demos/FilePickerDemo.vue
