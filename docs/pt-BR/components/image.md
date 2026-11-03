---
title: Image
description: Uma imagem, bem apresentada.
---

# Image

Uma imagem, bem apresentada.

::: info No próximo release
Disponível na Mavis `0.1.0-alpha.7`.
:::

<ComponentPreview component="image" />

```vue
<m-image src="https://example.com/print.png" alt="Art print" :aspectRatio="4/3" />
```

Preserva o espaço durante carregamento e falha. Resultados de fontes antigas são ignorados. Usa o carregamento da plataforma, sem cache global próprio ou promessa de cancelamento de rede.

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `src` | `string` | `required` | Imagem local, data URI ou URL conforme a plataforma. |
| `alt` | `string` | `required` | Descrição; texto vazio para imagem decorativa. |
| `aspectRatio` | `number` | `4 / 3` | Proporção positiva que reserva a altura. |
| `fit` | `cover  /  contain` | `cover` | Recorte ou encaixe da imagem. |
| `radius` | `token  /  number` | `md` | Raio do tema ou número. |
| `loadingLabel / errorLabel` | `string` | `Loading image / Image unavailable` | Textos de carregamento e falha. |

<<< @/../examples/catalog/shared/demos/ImageDemo.vue


`load` e `error` emitem a origem que terminou de carregar. Uma origem vazia mostra o fallback sem iniciar uma requisição. Se `height` estiver definido, ele tem prioridade sobre a proporção calculada; sem altura explícita, a largura e `aspectRatio` reservam o espaço.


As integrações experimentais de imagem, ícone, Sheet e Dialog estão descritas em [Imagens e física](../guide/platform-motion). Exigem Jolt RC.10 e estão incluídas no Mavis alpha.8.

## Imagens responsivas na Web

**Incluído na alpha.10.** `srcset`, `sizes`, `loading` (`eager` ou `lazy`), `decoding` (`sync`, `async` ou `auto`) e `fetchpriority` (`high`, `low` ou `auto`) são aplicados ao `<img>` interno, sem sobrescrever os padrões do navegador. IDs, classes, estilos e outros atributos do contêiner continuam no elemento externo. Mantenha um `src` de fallback e o aspectRatio reservado.

```vue
<m-image src="/photo-320.webp" srcset="/photo-320.webp 320w, /photo-960.webp 960w"
  sizes="(min-width: 800px) 50vw, 100vw" loading="lazy" decoding="async"
  fetchpriority="low" alt="Uma paisagem" :aspect-ratio="1.5" />
```

Alterações em src, srcset ou sizes invalidam resultados antigos de load/decode e preservam a geometria. O navegador escolhe a imagem e quando buscá-la; `loading` não garante o momento da requisição. Os atributos são exclusivos da Web. Ripple/distortion podem usar a imagem selecionada, mas dissolve com troca de fonte rejeita um srcset ativo, pois a aplicação controla a seleção responsiva.
