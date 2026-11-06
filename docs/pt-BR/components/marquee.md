---
title: Marquee
---

# Marquee

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="marquee" :height="1100" />

```vue
<MMarquee :items="reminders" label="Small reminders" v-model:paused="paused" :speed="35" />
```

| Prop                     | Type                   | Default       | Contrato                                                       |
| ------------------------ | ---------------------- | ------------- | -------------------------------------------------------------- |
| `items`                  | readonly MarqueeItem[] | required      | Id único, label e imagem opcional; conteúdo não interativo.    |
| `autoplay / paused`      | boolean                | false / false | Início automático é opcional. paused pode usar v-model:paused. |
| `speed / direction`      | number / left \| right | 35 / left     | Pixels/DIPs por segundo, em (0,500].                           |
| `itemWidth / gap`        | number                 | 180 / 16      | Largura fixa >=80 e espaçamento não negativo.                  |
| `playLabel / pauseLabel` | string                 | English       | Rótulos do controle de movimento sempre visível.               |

Jolt controla a reprodução linear e pausa/retomada. Cópias decorativas ficam ocultas da acessibilidade. Movimento inicia somente por escolha; movimento reduzido sempre produz uma lista estática com quebra de linha. Na Web pausa ao passar o cursor, focar, ocultar a página ou sair da área visível; no nativo pausa ao suspender o app ou descarregar a view. KeepAlive/descarte liberam observadores e reprodução. Não duplica links nem slots interativos.

<<< @/../examples/catalog/shared/demos/MarqueeDemo.vue
