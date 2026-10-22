---
description: "Conheça o Mavis UI, biblioteca de componentes para NativeScript começando por Vue. Veja o escopo, as plataformas e o estágio de desenvolvimento."
---

# O que é o Mavis UI?

Mavis UI é uma biblioteca de componentes em desenvolvimento para **NativeScript**, começando por **NativeScript-Vue**. Queremos reunir componentes, temas e padrões de tela que façam sentido no iOS e no Android.

A ideia é simples: gastar menos tempo reconstruindo a mesma UI, com controle suficiente para deixar o resultado com a cara do seu app.

::: info Estado do projeto
Este repositório contém o README e o site de documentação. Ainda não há pacote publicado, comando de instalação ou API estável de componentes.
:::

## Uma biblioteca de UI

Mavis é uma biblioteca de UI. Vai trabalhar junto com o NativeScript e o framework do seu app, oferecendo componentes e convenções de aparência e comportamento.

A direção inicial inclui:

- Componentes do dia a dia: botões, inputs, cards e sheets.
- Valores de tema para cor, tipografia, espaçamento e formato.
- Estados de interação e animação pensados junto com o design.
- Padrões de tela que funcionem com navegação nativa.

Isso descreve o escopo pretendido, não funcionalidades disponíveis hoje. Os [princípios de design](./design) explicam as decisões por trás dele.

## NativeScript primeiro, Vue primeiro

Vue é a primeira integração. O próximo passo será levar a biblioteca aos demais frameworks do NativeScript.

React Native, Flutter e integrações nativas diretas podem vir depois. São possibilidades para explorar, não lançamentos anunciados. O [roadmap](./roadmap) descreve a direção atual.

## Animação e navegação

O [Jolt](https://jolt.rafaelaugusto.dev/) será a base de animação dos componentes NativeScript. O [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) será a base de navegação da primeira integração com Vue.

Veja como essas peças se conectam no [guia do ecossistema](./ecosystem).

## Por que Mavis?

O nome vem da **Mavis Vermillion, de Fairy Tail**. A personagem também inspira as cores do site: o laço rosa, os detalhes em azul-claro e o vestido marfim.

Essa referência dá personalidade ao projeto. Os componentes, por sua vez, devem se adaptar à identidade visual do seu app.

## Acompanhe o projeto

O desenvolvimento será feito em [getcortexlabs/mavis-ui](https://github.com/getcortexlabs/mavis-ui). Quando os primeiros componentes estiverem prontos, a documentação terá instruções de instalação, exemplos executáveis e referência de API.
