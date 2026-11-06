---
title: GradientBackground
---

# GradientBackground

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="gradient-background" :height="1000" />

```vue
<MGradientBackground :colors="colors" :active="playing">
  <MText text="Make room for something good." />
</MGradientBackground>
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `colors` | readonly string[] | #9C5270, #51847B, #D5AD6C | 2–8 cores HEX de seis dígitos. |
| `angle` | number | 130 | Ângulo do gradiente linear em graus. |
| `active / animated` | boolean | false / true | Rotação contínua opcional e transições de paleta. |
| `duration` | number | 12000 | 1000–120000ms por meia volta. |
| `height / radius` | number / token | 280 / lg | 40–1600px/DIP e token de arredondamento compartilhado. |

Estático por padrão, inclusive no SSR. Active inicia o movimento de ângulo do Jolt. Trocar a paleta anima sem remontar o conteúdo do slot. Ofereça controle visível de ativar/pausar ao habilitar movimento contínuo. Movimento reduzido, documento Web oculto e views nativas descarregadas/desativadas interrompem a decoração. A Web também pausa fora da área visível. O conteúdo permanece interativo; escolha cores de texto com contraste adequado em todas as paletas.

<<< @/../examples/catalog/shared/demos/GradientBackgroundDemo.vue
