---
title: Começar
description: Execute o catálogo Mavis UI na Web, no iOS ou no Android e registre os componentes em uma aplicação Vue.
---

# Começar

A API é experimental e os pacotes ainda não foram publicados no npm. Para experimentar, use o checkout do repositório. O catálogo abre nos componentes individuais; exemplos completos ficam em Showcase.

## Execute na Web

Com Node 22 ou mais recente:

```sh
git clone https://github.com/getcortexlabs/mavis-ui.git
cd mavis-ui
npm ci
npm run build
npm run web:dev
```

Abra `/playground/` na URL indicada pelo Vite. <a href="/playground/" target="_blank" rel="noopener">Você também pode abrir o catálogo publicado ↗</a>

## Execute no NativeScript

Com o [ambiente NativeScript](https://docs.nativescript.org/setup/) configurado, após instalar e compilar os pacotes na raiz:

```sh
cd examples/catalog
npm ci
npm run android
# No macOS com Xcode:
npm run ios
```

O app instala NativeScript-Vue, Jolt e vue-router-ns explicitamente. O Jolt é obrigatório no pacote NativeScript. Depois de alterar os pacotes da biblioteca, rode `npm run build` na raiz e reinicie o app.

## Registre os componentes

::: code-group

```ts [NativeScript]
import { createMavis } from '@mavis-ui/nativescript/vue'
import { midnight } from '@mavis-ui/core'

app.use(createMavis({ theme: midnight }))
```

```ts [Web]
import { createMavis } from '@mavis-ui/web'
import { midnight } from '@mavis-ui/core'
import '@mavis-ui/web/style.css'

app.use(createMavis({ theme: midnight }))
```

:::

`app` é a aplicação Vue criada para a plataforma escolhida. No NativeScript, uma Screen precisa de um host de navegação como RouterView. O catálogo inclui a inicialização completa de cada ambiente.

Os componentes são registrados como `MButton`, `MRow` e assim por diante; o Vue também aceita `m-button` e `m-row`. Eles podem ser importados individualmente.

## Monte sua primeira composição

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text as="h1" variant="title">Seu espaço.</m-text>
    <m-card gap="md">
      <m-text>Pronto quando você estiver.</m-text>
      <m-button @click="salvar">Salvar</m-button>
    </m-card>
  </m-column>
</m-screen>
```

`salvar` é uma função da sua aplicação. Continue pelo [catálogo de componentes](../components/), personalize os [temas](./themes) ou veja os componentes em [Showcase](../showcase/).
