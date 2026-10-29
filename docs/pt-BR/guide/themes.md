---
title: Temas
description: Personalize cores, tipografia, espaçamentos e controles Mavis. Troque entre Mavis e Midnight ou crie um tema compartilhado por NativeScript e Web.
---

# Temas

Um tema reúne as decisões visuais dos componentes. **Mavis** combina superfícies claras e rosa; **Midnight** usa verde profundo e lima. Troque o tema da prévia para comparar a mesma composição.

<ComponentPreview component="card" :height="320" />

## Defina o tema inicial

O registro recebe o mesmo objeto de tema nas duas plataformas. Use `createMavis` de `@mavis-ui/nativescript/vue` no nativo ou de `@mavis-ui/web` na Web.

```ts
import { midnight } from '@mavis-ui/core'

app.use(createMavis({ theme: midnight }))
```

## Troque durante o uso

```ts
import { mavis, midnight } from '@mavis-ui/core'
import { useMavisTheme } from '@mavis-ui/core/vue'

// Dentro de setup():
const { theme, setTheme } = useMavisTheme()
setTheme(theme.value.appearance === 'dark' ? mavis : midnight)
```

O contexto pertence à aplicação. Trocar o tema atualiza os componentes montados. A seleção automática pelo tema do sistema ainda não está implementada.

## Crie sua identidade

```ts
import { defineTheme, mavis } from '@mavis-ui/core'

const studio = defineTheme({
  name: 'studio',
  colors: { primary: '#5636A8', onPrimary: '#FFFFFF' },
  radius: { md: 12 },
  typography: { title: { fontSize: 36 } },
}, mavis)
```

`defineTheme` completa os valores a partir da base, sem modificá-la, e devolve um tema imutável. Paletas personalizadas precisam de sua própria revisão de contraste.

| Grupo | Define |
| --- | --- |
| `colors` | background, surface, elevated, text, muted, primary, onPrimary, border, success, danger |
| `space` | none, xs, sm, md, lg, xl, 2xl |
| `radius` | none, sm, md, lg, full |
| `typography` | display, title, heading, body, caption, overline |
| `control` | Altura mínima, padding horizontal e fonte dos tamanhos sm, md e lg |
| `motion` | `pressScale`, entre 0 e 1, sem incluir 0 |

## Espaçamento

| Token | Valor padrão |
| --- | --- |
| none | 0 |
| xs | 4 |
| sm | 8 |
| md | 16 |
| lg | 24 |
| xl | 32 |
| 2xl | 48 |

`gap` e padding também aceitam números não negativos. As unidades são independentes de densidade no NativeScript e pixels CSS na Web. A fonte e a renderização de cada plataforma podem produzir pequenas diferenças de medida.
