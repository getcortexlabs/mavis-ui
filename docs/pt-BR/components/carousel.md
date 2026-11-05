---
title: Carousel
---

# Carousel

::: info Unreleased
Disponível no código em desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="carousel" :height="850" />

```vue
<MCarousel v-model="current" :items="slides" itemKey="id" label="Stories"><template #default="{ item }">…</template></MCarousel>
```

| Prop | Type | Default | Descrição |
| --- | --- | --- | --- |
| `items / itemKey` | `readonly T[] / string or function` | `required / id` | Slides com chaves únicas e estáveis. |
| `modelValue / v-model` | `ChoiceValue or null` | `null` | Chave do slide ativo. Ausente ou removida mostra o primeiro. |
| `loop / disabled` | `boolean` | `false` | Permite retornar ao começo; bloqueia a interação. |
| `previousLabel / nextLabel / slideLabel / emptyLabel` | `string` | `Previous slide / Next slide / Slide / No slides` | Rótulos traduzíveis. |

Botões, indicadores, setas do teclado Web e swipe horizontal mudam o slide. Jolt anima a entrada e respeita movimento reduzido. Não há autoplay. Somente o slide ativo é montado; mantenha drafts no app por chave. O slot recebe item, index e itemKey. Interações Web em controles dentro do slide não iniciam swipe; a rolagem vertical continua disponível. Uma largura e conteúdo com altura estável evitam saltos. Os indicadores são destinados a coleções pequenas, como onboarding e destaques.

<<< @/../examples/catalog/shared/demos/CarouselDemo.vue
