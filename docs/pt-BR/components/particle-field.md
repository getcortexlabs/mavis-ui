---
title: ParticleField
---

# ParticleField

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="particle-field" :height="1000" />

```vue
<MParticleField :active="playing" :density="12" :speed="28">
  <MText text="Room for wonder." />
</MParticleField>
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `active` | boolean | false | Pedido explícito para emitir partículas decorativas. |
| `colors / shape` | string[] / circle, rectangle, ring | palette / circle | 2–8 cores HEX e formato das partículas. |
| `density / lifetime` | number | 12 / 3000 | 1–60 partículas/segundo, vida de 100–5000ms: até 300 partículas vivas. |
| `speed / size / duration` | number | 28 / 3 / continuous | Velocidade 0–300px ou DIP/s, tamanho 1–24, emissão finita opcional de 100–60000ms. |
| `height / radius / backgroundColor` | number / token / string | 280 / lg / #202A32 | Tamanho, cantos e fundo estático. |

Usa o emissor Jolt, sem loop ou simulação própria do componente. Pausar descarta partículas existentes; retomar inicia um novo campo. Duration limita a emissão; partículas existentes podem durar até o fim da vida. Movimento reduzido suprime a emissão. Web pausa fora da área visível/em segundo plano; nativo interrompe ao descarregar, desativar ou suspender o app. O slot permanece montado e utilizável. Ofereça controle visível para pausar emissão contínua.

<<< @/../examples/catalog/shared/demos/ParticleFieldDemo.vue
