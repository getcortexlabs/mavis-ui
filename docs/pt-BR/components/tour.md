---
title: Tour
---

# Tour

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído na versão npm publicada.
:::

<ComponentPreview component="tour" :height="1100" />

```vue
<MTour v-model="step" :steps="steps" label="Getting started">
  <MTourTarget name="editor"><MInput v-model="name" label="Name" /></MTourTarget>
</MTour>
```

| Prop                                              | Type                | Default  | Contrato                                                         |
| ------------------------------------------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `steps`                                           | readonly TourStep[] | required | Id único, título e descrição. id corresponde a MTourTarget.name. |
| `modelValue`                                      | string \| null      | null     | Id do passo atual; null encerra o tour.                          |
| `animated`                                        | boolean             | true     | Feedback opcional das instruções, junto ao movimento do Popover. |
| `nextLabel / backLabel / skipLabel / finishLabel` | string              | English  | Ações de navegação traduzíveis.                                  |
| `MTourTarget.name`                                | string              | required | Alvo único dentro do tour que o contém.                          |

Envolva conteúdo existente em MTourTarget; ele permanece montado durante todo o tour. Os alvos são componentes compartilhados explícitos, sem seletores do document. O alvo ativo recebe contorno, é revelado na rolagem e ancora um Popover. Alvos ausentes emitem missing(id) e propõem o próximo passo registrado. finish(reason) distingue complete, skip, missing e o fechamento do Popover. Ao encerrar, restaura o foco anterior quando a plataforma permite. Na Web não é modal; o Popover nativo usa sua camada nativa. Não inclui máscara escura com recorte.

<<< @/../examples/catalog/shared/demos/TourDemo.vue
