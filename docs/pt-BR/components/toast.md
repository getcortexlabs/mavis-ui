---
title: Toast
description: Avisos em fila local, com temas, fechamento automático ou manual e apresentação nativa e Web.
---

# Toast

`MToast` · Feedback que mantém o restante da tela disponível.

::: info Próxima alpha
Toast está disponível no repositório. Ele não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="toast" :height="940" />

## Uso

```vue
<script setup lang="ts">
import { useToast } from '@getcortexlabs/mavis-core/vue'

const toast = useToast()
function saved() {
  toast.show({
    title: 'Perfil salvo',
    message: 'Suas alterações estão prontas.',
    tone: 'success',
  })
}
</script>

<template>
  <m-screen>
    <m-button @click="saved">Salvar</m-button>
    <m-toast :controller="toast" closeLabel="Fechar aviso" />
  </m-screen>
</template>
```

Chame `useToast()` no setup Vue. Cada chamada cria sua própria fila, limpa junto com esse escopo. Conecte-a a um `MToast`; no NativeScript, ele precisa de um ancestral `MScreen`. Não há provider adicional nem singleton global. Os pontos de entrada dos dois renderizadores também exportam `useToast`.

## Props do host

| Prop | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `controller` | `ToastController` | obrigatório | Fila retornada por `useToast()`. Um host por controller. |
| `closeLabel` | `string` | `Dismiss notification` | Nome acessível do botão de fechar. Traduza no app. |

O host aparece no topo da área visível. Não recebe slots de conteúdo nem props de layout. O NativeScript o mantém dentro da área segura da Screen; a Web respeita o inset seguro do documento. Não altera o teclado nem o foco atual. Não há fundo bloqueando a tela, contenção de foco ou tratamento do botão voltar do router.

## Mensagens e controller

`ToastOptions`, `ToastTone` e `ToastController` são exportados por `@getcortexlabs/mavis-core`.

| Opção | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `message` | `string` | obrigatório | Texto simples não vazio. HTML não é interpretado. |
| `title` | `string` | omitido | Título opcional, não vazio. |
| `tone` | `success \| error \| warning \| info` | `info` | Ícone e cor semântica. A cor de aviso vem de `theme.colors.warning`. |
| `duration` | `number` | `5000` | Milissegundos após terminar a entrada; `0` mantém o aviso até fechar. Valor finito entre 0 e 2147483647. |

- `toast.show(options)` copia as opções e enfileira o aviso. Retorna um ID numérico ou `undefined` depois que o host nativo descarrega ou seu escopo termina.
- `toast.dismiss()` fecha o aviso atual. `toast.dismiss(id)` também permite remover um aviso pendente; IDs desconhecidos não fazem nada.
- `toast.clear()` descarta os avisos pendentes e fecha o atual.

Os avisos aparecem na ordem de inserção, um por vez. O próximo entra depois que o atual termina de sair; seu tempo só começa após a entrada. Chamadas repetidas criam avisos separados, mesmo com texto igual. Validação, persistência e requisições pertencem ao app.

## Tempo, interação e ciclo de vida

A pausa preserva o tempo restante. O relógio aguarda enquanto uma Sheet está aberta ou o app/documento está em segundo plano. Na Web, passar o ponteiro ou manter o foco no aviso também pausa; Escape fecha quando o foco está dentro dele. Fechar um aviso Web focado devolve o foco ao acionador, se ele ainda estiver montado. A entrada nunca toma o foco apenas para anunciar uma mensagem.

No nativo, o botão de fechar permanece acessível e textos longos podem rolar. A entrada usa Jolt e segue sua política de movimento reduzido; a Web usa CSS com suporte a movimento reduzido. Quando um leitor de tela nativo está ativo na entrada, o fechamento automático pausa para permitir leitura e fechamento manual. É comportamento básico, não uma auditoria completa de tecnologia assistiva.

Desmontar o host limpa sua fila. O unload durante a navegação nativa também limpa, inclusive quando o router retém a página; chamadas enquanto ela está fora da tela são ignoradas e o retorno aceita novos avisos. O NativeScript também descarrega views quando o app vai para segundo plano; nesse caso, a fila permanece pausada até a página carregar novamente. Um escopo Vue destruído rejeita chamadas assíncronas tardias. Trocar o controller do host libera a fila anterior. Esta versão não entrega mensagens entre rotas.

Use `duration: 0` quando a mensagem precisar continuar disponível. Mantenha validações ou orientações importantes na própria tela: o toast é feedback passageiro, não o único registro de um erro. Ações como Desfazer, helpers de promises, swipe, templates livres e serviços globais de notificações estão fora desta versão.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/ToastDemo.vue

</details>

[Profile](../showcase/profile) usa Toast depois de salvar localmente um formulário válido; erros continuam junto aos campos.
