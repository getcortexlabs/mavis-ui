---
title: Compartilhe uma tela com a Web
description: Execute as mesmas telas Vue da Mavis no NativeScript e na Web. Conheça os temas compartilhados, componentes nativos e HTML e o exemplo Garage.
---

# Compartilhe uma tela com a Web

A Mavis agora tem implementações experimentais para **NativeScript-Vue e Vue Web**. O Garage usa os mesmos arquivos `Garage.vue`, `Details.vue` e estado da aplicação nos dois builds.

<a href="/garage/" target="_blank" rel="noopener">Abra o Garage no navegador ↗</a>

A versão Web renderiza controles HTML com suporte a teclado, indicação de foco e nomes acessíveis. A versão nativa mantém as views do NativeScript e o Jolt. Nenhum pacote Mavis foi publicado no npm ainda.

## Execute localmente

Em um checkout, com Node 22 ou mais recente:

```sh
npm ci
npm run build
npm run web:dev
```

Abra a URL `/garage/` indicada pelo Vite. O exemplo Web não precisa de SDK nativo. Para executar as mesmas telas em um aparelho, siga as [instruções do exemplo nativo](./foundation).

## O que é compartilhado

| Parte | Local |
| --- | --- |
| Temas, espaçamentos e regras de passos do slider | `packages/core/src` |
| Contexto de tema Vue e tipos comuns dos componentes | `packages/core/src/vue` |
| Templates das duas telas e seu comportamento | `examples/garage/shared/pages` |
| Estado do Garage e interface de navegação | `examples/garage/shared/context.ts` |
| Renderização nativa e integração com Jolt | `packages/nativescript/src` |
| Renderização HTML e estilos do navegador | `packages/web/src` |

As telas compartilhadas importam as APIs Vue de `vue`, os temas de `@mavis-ui/core` e `useMavisTheme` de `@mavis-ui/core/vue`. O build do NativeScript resolve `vue` para seu renderizador nativo. Cada aplicação registra sua implementação da Mavis uma vez.

Por exemplo, este template funciona nos dois ambientes:

```vue
<m-column gap="md" padding="lg">
  <m-text as="h1" variant="title">Sua temperatura</m-text>
  <m-slider v-model="temperature" :min="16" :max="28" :step="0.5" label="Temperatura" />
  <m-button @click="salvar">Salvar</m-button>
</m-column>
```

`temperature` e `salvar` pertencem à aplicação. O [guia de componentes](./foundation) descreve as propriedades comuns. `MText.as` fornece a semântica de título: seleciona uma tag HTML na Web e um papel acessível de cabeçalho no nativo. `click` é uma ação independente de plataforma, sem objeto de evento. Os eventos nativos continuam disponíveis separadamente quando necessários.

## Registre a implementação Web

Estes imports se referem aos pacotes locais do workspace:

```ts
import { createApp } from 'vue'
import { createMavis, midnight } from '@mavis-ui/web'
import '@mavis-ui/web/style.css'
import App from './App.vue'

createApp(App).use(createMavis({ theme: midnight })).mount('#app')
```

A folha de estilos fornece indicação de foco, sobreposição no box e movimento. Mudanças de tema ficam restritas a cada app. O pacote Web também pode ser importado durante renderização no servidor; seus imports não acessam variáveis globais do navegador. O demo Garage é uma aplicação renderizada no cliente.

## Navegação e movimento

As telas compartilhadas do Garage recebem uma pequena interface de navegação. O NativeScript usa vue-router-ns; a inicialização Web usa Vue Router. O demo usa rotas com hash para permitir hospedagem estática, incluindo acesso direto à tela de detalhes.

O Jolt continua obrigatório para o **pacote NativeScript**. O suporte ao navegador está acompanhado em [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236). Até ele estar disponível, os botões Web usam feedback de toque em CSS e o `m-reveal` usa transições Vue com CSS. Ambos respeitam `prefers-reduced-motion`. Esses efeitos são implementados pela Mavis; ainda não são o Jolt executando no navegador.

## Limites do compartilhamento

Use as propriedades Mavis e os valores de tema para compartilhar layout e estilos. Dimensões numéricas são unidades independentes de densidade no nativo e pixels CSS na Web. Atributos de plataforma, CSS direto, referências a views nativas e chamadas diretas ao Jolt são específicos de cada ambiente.

A implementação Web tem layouts responsivos e comportamento de teclado dos controles HTML. Pixels exatos, fontes, transições de navegação e controles específicos podem diferir. Câmera, arquivos, notificações e outros serviços do aparelho ainda precisam de implementações da aplicação para cada destino.

A superfície compartilhada atual cobre os nove componentes iniciais. Outros frameworks, inputs, sheets e uma coleção maior de componentes continuam como próximos trabalhos.
