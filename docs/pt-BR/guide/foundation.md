---
title: Começar
description: Execute o catálogo Mavis UI na Web, no iOS ou no Android e registre os componentes em uma aplicação Vue.
---

# Começar

A versão `0.1.0-alpha.3` é um prerelease para testar a Mavis em apps reais. A API pode mudar entre versões alpha. Código e documentação usam a licença MIT.

## Instale no seu app

Em um app **NativeScript-Vue** existente, com Core 9.1.3 e NativeScript-Vue 3.1.3:

```sh
npm install @getcortexlabs/mavis@0.1.0-alpha.3 @rafaelaugusto/jolt@0.1.0-rc.1
```

O Jolt é uma dependência obrigatória. O pacote core é instalado como dependência da Mavis. Alterações no adapter Android exigem um build nativo; ao atualizar um app existente, execute `ns clean` se houver metadados de uma versão anterior.

Em um app **Vue Web** com Vue 3.5.42:

```sh
npm install @getcortexlabs/mavis-web@0.1.0-alpha.3
```

Importe `@getcortexlabs/mavis-web/style.css` na inicialização. A alpha.3 Web não precisa dos SDKs nativos nem do Jolt. O código atual do repositório exige Jolt `0.1.0-rc.5` também na Web; essa integração será publicada na próxima alpha. Veja [movimento](./motion).

Os pacotes usam a tag npm `alpha`; mantenha a versão exata enquanto testa. Layouts nativos profundos ainda podem ser lentos ([#56](https://github.com/getcortexlabs/mavis-ui/issues/56)). O VoiceOver pode pular um status recém-inserido fora da área visível ([#54](https://github.com/getcortexlabs/mavis-ui/issues/54)). A matriz de aparelhos e teclados ainda está incompleta. Consulte as [notas da versão](https://github.com/getcortexlabs/mavis-ui/blob/main/CHANGELOG.md) antes de adotar a alpha.

O catálogo abre nos componentes individuais; exemplos completos ficam em Showcase. Para contribuir ou executar o catálogo pelo código-fonte, siga os passos abaixo.

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
import { createMavis } from '@getcortexlabs/mavis/vue'
import { midnight } from '@getcortexlabs/mavis'

app.use(createMavis({ theme: midnight }))
```

```ts [Web]
import { createMavis } from '@getcortexlabs/mavis-web'
import { midnight } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'

app.use(createMavis({ theme: midnight }))
```

:::

`app` é a aplicação Vue criada para a plataforma escolhida. No NativeScript, uma Screen precisa de um host de navegação como RouterView. O catálogo inclui a inicialização completa de cada ambiente.

Para uma tela nativa sem router, a inicialização mínima é:

```ts
import { createApp, h } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import App from './App.vue'

// App.vue tem uma MScreen na raiz.
createApp({ render: () => h('Frame', {}, [h(App)]) })
  .use(createMavis())
  .start()
```

Os componentes são registrados como `MButton`, `MRow` e assim por diante; o Vue também aceita `m-button` e `m-row`. Eles podem ser importados individualmente. Com `@nativescript/vite`, escreva `MButton` e `MRow`: o compilador Vue dessa integração trata tags com hífen como elementos nativos, a menos que o `vite.config.mts` altere `isCustomElement`. Tanto `@nativescript/webpack` quanto `@nativescript/vite` usam os arquivos iOS e Android do Mavis.

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
