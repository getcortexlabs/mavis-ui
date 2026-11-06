---
title: Confetti
---

# Confetti

::: info Em desenvolvimento
Disponível nesta branch para Vue + Vite, Nuxt e NativeScript. Ainda não incluído no npm publicado.
:::

<ComponentPreview component="confetti" :height="1000" />

```vue
<MConfetti :trigger="celebration" :count="70">
  <MButton text="Publish" @click="celebration++" />
</MConfetti>
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `trigger` | string or number | 0 | Mudar o token solicita uma emissão; render inicial/hidratação não emitem. |
| `count / colors` | number / string[] | 70 / palette | 1–180 confetes e 2–8 cores HEX de seis dígitos. |
| `disabled` | boolean | false | Descarta a emissão ativa e rejeita novas. |

O método exposto burst() solicita a celebração; stop() a descarta. Repetir substitui a emissão anterior. Jolt controla a duração finita e limpeza; o componente não promete callback de conclusão. O evento burst informa início; skipped informa disabled, reduced-motion ou unavailable. Mantenha mensagens de sucesso independentes da decoração para todos receberem confirmação. Telas compartilhadas não precisam de imports exclusivos do navegador.

`burst` → `void`; `skipped` → `disabled | reduced-motion | unavailable`.

<<< @/../examples/catalog/shared/demos/ConfettiDemo.vue
