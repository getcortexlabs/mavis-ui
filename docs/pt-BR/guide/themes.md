---
title: Temas
description: Personalize cores, tipografia, espaçamentos e controles Mavis. Troque entre Mavis e Midnight ou crie um tema compartilhado por NativeScript e Web.
---

# Temas

Um tema reúne as decisões visuais dos componentes. **Mavis** combina superfícies claras com rosa e azul; **Midnight** leva as mesmas cores para superfícies em violeta profundo. Troque o tema da prévia para comparar a mesma composição.

<ComponentPreview component="card" :height="320" />

## Defina o tema inicial

O registro recebe o mesmo objeto de tema nas duas plataformas. Use `createMavis` de `@getcortexlabs/mavis/vue` no nativo ou de `@getcortexlabs/mavis-web` na Web.

```ts
import { midnight } from '@getcortexlabs/mavis-core'

app.use(createMavis({ theme: midnight }))
```

## Troque durante o uso

```ts
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

// Dentro de setup():
const { theme, setTheme } = useMavisTheme()
setTheme(theme.value.appearance === 'dark' ? mavis : midnight)
```

O contexto pertence à aplicação. Trocar o tema atualiza os componentes montados.

## Siga a aparência do sistema

Informe um tema escuro correspondente e o contexto passa a seguir o aparelho por padrão:

```ts
import { mavis, midnight } from '@getcortexlabs/mavis-core'

app.use(createMavis({ theme: mavis, darkTheme: midnight }))
```

`appearance` escolhe o modo. `system`, o padrão, resolve `theme` ou `darkTheme` a partir do aparelho e continua acompanhando enquanto o app roda; `light` e `dark` ignoram o aparelho. Com um único tema nada muda. Durante o uso:

```ts
const { theme, appearance, setAppearance } = useMavisTheme()

setAppearance('dark') // escolha explícita
setAppearance('system') // voltar a seguir o aparelho
```

`appearance` é a seleção; `theme.value.appearance` é o resultado. `setTheme(custom)` registra `custom` para a própria aparência e fixa essa aparência, então uma escolha explícita sobrevive a mudanças do aparelho até `setAppearance('system')`. No iOS, o NativeScript ouve o evento `systemAppearanceChanged` do Core; no Android ele lê `uiMode` da configuração da aplicação e registra component callbacks, porque o cache de janela do Core pode atrasar em aparelhos antigos. A Web ouve `prefers-color-scheme`. Todo listener pertence à aplicação e é removido quando ela desmonta. As telas de abertura nativas continuam na base clara, e os apps do catálogo usam essa configuração.

### Renderização no servidor

O servidor não conhece a preferência do visitante, então `system` renderiza `theme` lá enquanto o cliente resolve o aparelho na primeira renderização, que pode divergir do HTML do servidor. Para manter a hidratação consistente, informe a mesma `appearance` explícita nos dois lados, por exemplo a partir de um cookie gravado quando o visitante escolhe, e mude para `system` depois de montar:

```ts
app.use(createMavis({ theme: mavis, darkTheme: midnight, appearance: 'light' }))

// No componente raiz, só no cliente:
onMounted(() => setAppearance('system'))
```

O Core nunca acessa `window` no import; o adaptador Web só consulta `matchMedia` quando o plugin é instalado em um navegador.

## Crie sua identidade

```ts
import { defineTheme, mavis } from '@getcortexlabs/mavis-core'

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
| `colors` | background, surface, elevated, text, muted, primary, onPrimary, primarySoft, accent, onAccent, accentSoft, border, success, danger |
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
