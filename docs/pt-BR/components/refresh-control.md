---
title: RefreshControl
---

# RefreshControl

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="refresh-control" :height="1000" />

```vue
<MRefreshControl label="Your morning edition" :refresh="refreshStories">
  <Stories :items="stories" />
</MRefreshControl>
```

| Prop                                                                                    | Type                   | Default        | Contract                                       |
| --------------------------------------------------------------------------------------- | ---------------------- | -------------- | ---------------------------------------------- |
| `label / refresh`                                                                       | string / RefreshAction | required       | Nome acessível e operação da aplicação.        |
| `height / threshold`                                                                    | number                 | 480 / 80       | Altura e distância do gesto em px/DIP.         |
| `disabled`                                                                              | boolean                | false          | Cancela trabalho pendente e pausa a interação. |
| `refreshLabel / refreshingLabel / successLabel / errorLabel / retryLabel / cancelLabel` | string                 | English labels | Traduza cada estado e ação.                    |

Puxe no topo ou use o botão Atualizar. Forneça refresh(context) assíncrono. context.signal permite cancelamento e context.commit(() => atualizarEstado()) protege a atualização contra respostas antigas. Aplique resultados dentro de commit; escritas arbitrárias da aplicação não podem ser desfeitas. Uma solicitação por vez. Cancelamento, desabilitação, desativação por KeepAlive e desmontagem invalidam a solicitação atual. Rótulos de erro e sucesso são configuráveis. Métodos expostos: refresh() e cancel(). O componente possui região rolável com altura definida e cabeçalho de estado; não cria uma Page nativa.

Numa tela compartilhada para o destino experimental Mac, o controle tem o botão de atualizar e Command-R no lugar do gesto de puxar, com os mesmos estados e rótulos. Uma tela compartilhada ainda não pode esperar por nada, então ali `refresh` é uma função que termina na hora ou lança um erro. Veja [Listas longas, cabeçalhos que recolhem e atualização](../guide/macos-experimental#listas-longas-cabecalhos-que-recolhem-e-atualizacao) no guia do Mac.

<<< @/../examples/catalog/shared/demos/RefreshControlDemo.vue

```ts
async function refreshStories(context: RefreshContext) {
  const response = await fetch('/api/stories', { signal: context.signal })
  if (!response.ok) throw new Error('Could not refresh')
  const items = await response.json()
  await context.commit(() => {
    stories.value = items
  })
}
```
