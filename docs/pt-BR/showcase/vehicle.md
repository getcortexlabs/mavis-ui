---
title: Controles de veículo
description: Um showcase Mavis com clima, bateria, carregamento e navegação. Entenda como os componentes se combinam em uma tela compartilhada entre NativeScript e Web.
---

# Controles de veículo

Uma composição com autonomia, clima, preferências de carregamento e acesso aos detalhes. As mesmas telas Vue e o mesmo estado são usados no app nativo e no navegador.

<a href="/playground/#/showcase/vehicle" target="_blank" rel="noopener">Explorar o showcase ↗</a>

## Os dois temas

Capturas do exemplo nativo no Android, em Midnight e Mavis.

<div style="display: flex; gap: 16px; flex-wrap: wrap; margin: 24px 0">
  <img src="/images/vehicle-midnight.png" alt="Controles de veículo com tema Midnight" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
  <img src="/images/vehicle-mavis.png" alt="Controles de veículo com tema Mavis" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
</div>

## Como foi composto

| Parte da tela | Componentes |
| --- | --- |
| Estrutura e rolagem | [Screen](../components/screen), [Column](../components/column), [Row](../components/row) |
| Autonomia e bateria | [Text](../components/text), [Box](../components/box) |
| Clima e limite de carga | [Card](../components/card), [Slider](../components/slider) |
| Ações e estados | [Button](../components/button) |
| Preferências adicionais | [Reveal](../components/reveal) |

`shared/context.ts` mantém os valores locais e recebe uma interface de navegação. O app nativo fornece vue-router-ns; a Web fornece Vue Router. Os componentes usam o mesmo tema, mas renderizam controles próprios de cada plataforma.

## Código da tela

<details>
<summary>Ver Vehicle.vue</summary>

<<< @/../examples/catalog/shared/pages/Vehicle.vue

</details>

O exemplo demonstra composição, sem integração com veículos reais. Para estudar uma API isolada, volte ao [catálogo de componentes](../components/).
