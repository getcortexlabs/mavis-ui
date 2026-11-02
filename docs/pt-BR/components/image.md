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
