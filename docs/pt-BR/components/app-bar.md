---
title: AppBar
---

# AppBar

::: info Alpha.10
Disponível no Mavis alpha.11 para Vue Web e NativeScript. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="app-bar" :height="800" />

```vue
<MAppBar title="Library" back><template #actions>…</template></MAppBar>
```

| Propriedade    | Tipo                   | Padrão     | Descrição                                  |
| -------------- | ---------------------- | ---------- | ------------------------------------------ |
| `title`        | `string`               | `required` | Título da tela.                            |
| `subtitle`     | `string`               | `—`        | Texto complementar.                        |
| `back`         | `boolean`              | `false`    | Mostra ação de voltar.                     |
| `backLabel`    | `string`               | `Back`     | Nome acessível da ação.                    |
| `navigateBack` | `() => void / Promise` | `—`        | Substitui o voltar do adaptador instalado. |

Cabeçalho com slots `leading` e `actions`. A ação de voltar aguarda a navegação do app e emite `back` ao concluir ou `error` se falhar. Configure `createRouterNavigation` uma vez para Vue Router, Nuxt ou vue-router-ns, ou passe `navigateBack`. O componente não cria Page, roteador, posição fixa nem duplica a área segura; no nativo ela pertence ao MScreen. Posicione o cabeçalho fora da área de rolagem, ou use a receita existente de cabeçalho retido, quando precisar mantê-lo visível. O título quebra linha para acomodar texto ampliado.

## Mac

Numa tela compartilhada para o [destino experimental Mac](../guide/macos-experimental), o `MAppBar` é desenhado no conteúdo, onde a tela o coloca, com os mesmos slots e o mesmo layout da Web. Ele não é a barra de ferramentas da janela: a tela pode colocá-lo em qualquer lugar, mais de uma vez, como nos outros destinos. Lá `back` precisa de `navigateBack` até o destino Mac ter a navegação do app.

<<< @/../examples/catalog/shared/demos/AppBarDemo.vue
