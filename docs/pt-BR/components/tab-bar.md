---
title: TabBar
---

# TabBar

::: info Alpha.10
Disponível no Mavis alpha.11 para Vue Web e NativeScript. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="tab-bar" :height="800" />

```vue
<MTabBar :modelValue="currentRoute" :items="destinations" label="Main navigation" />
```

| Propriedade  | Tipo                     | Padrão     | Descrição                                                               |
| ------------ | ------------------------ | ---------- | ----------------------------------------------------------------------- |
| `items`      | `NavigationItem[]`       | `required` | value estável, label, href e opcionais icon, badge, disabled, navigate. |
| `modelValue` | `string / number / null` | `null`     | Identidade da rota atual fornecida pelo app.                            |
| `label`      | `string`                 | `required` | Nome da região de navegação.                                            |
| `disabled`   | `boolean`                | `false`    | Desabilita todos os destinos.                                           |
| `safeArea`   | `boolean`                | `false`    | Inset inferior opcional na Web; nativo já usa MScreen.                  |

Navegação por rotas com links reais na Web e ações nativas usando o serviço instalado. Derive `modelValue` da rota confirmada; não há seleção otimista nem evento `update:modelValue` que contorne guards. Cliques modificados na Web preservam o comportamento do link. `error` encaminha falhas de navegação. O link atual tem `aria-current="page"`; no nativo o nome inclui `currentLabel`. Badges entram no nome acessível. Use MTabs para painéis locais. A barra participa do layout normal; o app decide a posição. Use poucos destinos e nomes curtos; não há menu de overflow. No nativo mantenha a área segura do MScreen; ative o inset Web somente quando posicionar a barra no limite inferior da viewport.

## Mac

Numa tela compartilhada para o [destino experimental Mac](../guide/macos-experimental), o `MTabBar` desenha a mesma fileira de destinos e marca o que a fonte indica como atual; o Jolt move a marca. Um destino em outro site abre no navegador. Um destino dentro do app precisa da navegação do app, que o destino Mac ainda não tem: até lá, segui-lo emite `error`. Lá os itens são dados: a função `navigate` do próprio item não é aceita, os valores são strings e `badge` é texto. `safeArea` não muda nada no Mac.

<<< @/../examples/catalog/shared/demos/TabBarDemo.vue
