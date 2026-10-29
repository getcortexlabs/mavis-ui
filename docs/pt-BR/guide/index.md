---
description: "Conheça o Mavis UI, biblioteca de componentes para NativeScript começando por Vue. Veja o escopo, as plataformas e o estágio de desenvolvimento."
---

# O que é o Mavis UI?

Mavis UI é uma biblioteca de componentes em desenvolvimento para **NativeScript**, começando por **NativeScript-Vue**. Queremos reunir componentes, temas e padrões de tela que façam sentido no iOS e no Android.

A ideia é simples: gastar menos tempo reconstruindo a mesma UI, com controle suficiente para deixar o resultado com a cara do seu app.

::: info Estado do projeto
O repositório inclui uma biblioteca experimental para NativeScript-Vue e o app Garage. Ainda não há pacote publicado nem API estável. [Experimente os primeiros componentes](./foundation) a partir do código-fonte.
:::

## Uma biblioteca de UI

A Mavis oferece componentes e convenções de aparência, comportamento e layout. Use `m-row`, `m-column`, `gap` e `padding` para compor telas sem precisar escolher classes de layout do NativeScript na UI do dia a dia.

A direção inicial inclui:

- Componentes do dia a dia: botões, inputs, cards e sheets.
- Valores de tema para cor, tipografia, espaçamento e formato.
- Estados de interação e animação pensados junto com o design.
- Padrões de tela que funcionem com navegação nativa.

Esse é o escopo mais amplo. O [guia dos primeiros componentes](./foundation) distingue a base implementada dos próximos trabalhos. Os [princípios de design](./design) explicam as decisões por trás dele.

## NativeScript primeiro, Vue primeiro

Vue é a primeira integração. O próximo passo será levar a biblioteca aos demais frameworks do NativeScript.

React Native, Flutter e integrações nativas diretas podem vir depois. São possibilidades para explorar, não lançamentos anunciados. O [roadmap](./roadmap) descreve a direção atual.

## Animação e navegação

O [Jolt](https://jolt.rafaelaugusto.dev/) é a base de animação dos componentes NativeScript. O [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) é a base de navegação da primeira integração com Vue.

Veja como essas peças se conectam no [guia do ecossistema](./ecosystem).

## Por que Mavis?

O nome vem da **Mavis Vermillion, de Fairy Tail**. A personagem também inspira as cores do site: o laço rosa, os detalhes em azul-claro e o vestido marfim.

Essa referência dá personalidade ao projeto. Os componentes, por sua vez, devem se adaptar à identidade visual do seu app.

## Acompanhe o projeto

O desenvolvimento acontece em [getcortexlabs/mavis-ui](https://github.com/getcortexlabs/mavis-ui). O [guia dos primeiros componentes](./foundation) explica a API experimental e como executar o exemplo nativo.
