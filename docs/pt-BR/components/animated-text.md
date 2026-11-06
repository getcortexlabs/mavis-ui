---
title: AnimatedText
---

# AnimatedText

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="animated-text" :height="1000" />

```vue
<MAnimatedText :text="headline" by="word" :replayKey="take" variant="display" />
```

| Prop                            | Type                                 | Default                    | Contract                                                                    |
| ------------------------------- | ------------------------------------ | -------------------------- | --------------------------------------------------------------------------- |
| `text / variant / tone`         | string / typography / palette        | required / title / default | Texto canônico e tipografia compartilhada.                                  |
| `by`                            | word or letter                       | word                       | Segmentação da animação.                                                    |
| `duration / stagger / distance` | number                               | 650 / 35 / 16              | Milissegundos e distância px/DIP; duração positiva, intervalo não negativo. |
| `animated / appear / replayKey` | boolean / boolean / string or number | true / true / 0            | Ativar animação, entrada e repetição explícita.                             |

Jolt controla a entrada por palavras/letras e a substituição da animação. O texto é explícito, sem marcação rica por slot. O servidor entrega texto canônico legível; a animação só começa quando o renderer está pronto. Alterar text ou replayKey repete o efeito; replay() faz o mesmo. animated=false interrompe a animação. Movimento reduzido segue a política do runtime. Não há temporizador automático de frases nem animação infinita.

<<< @/../examples/catalog/shared/demos/AnimatedTextDemo.vue
