---
title: Experimente os primeiros componentes
description: Execute o exemplo NativeScript-Vue do Mavis UI a partir do repositório. Conheça layouts m-*, temas, botões, sliders e animação com Jolt.
---

# Experimente os primeiros componentes

O repositório agora inclui uma implementação experimental para NativeScript-Vue e um pequeno app nativo, o **Garage**. A API pode mudar. Ainda não há pacote Mavis publicado.

Garage no emulador Android, com Midnight e Mavis. São telas nativas construídas com os mesmos componentes.

<div style="display: flex; gap: 16px; flex-wrap: wrap; margin: 24px 0">
  <img src="/images/garage-midnight.png" alt="Garage — Midnight" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
  <img src="/images/garage-mavis.png" alt="Garage — Mavis" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
</div>

## Execute o Garage

Use Node 20.19.4 ou mais recente e um [ambiente de desenvolvimento NativeScript](https://docs.nativescript.org/setup/) configurado.

```sh
git clone https://github.com/getcortexlabs/mavis-ui.git
cd mavis-ui
npm ci
npm run build
cd examples/garage
npm ci
npm run android
# No macOS com Xcode:
npm run ios
```

O exemplo instala o pacote local da Mavis, NativeScript-Vue, **Jolt** e vue-router-ns. O Jolt é uma dependência obrigatória da biblioteca, declarada como peer dependency; o exemplo o instala explicitamente. Depois de alterar a biblioteca, execute `npm run build` na raiz e reinicie o exemplo.

## Monte um layout

Os componentes são registrados como `MButton`, `MRow` e assim por diante. O Vue também aceita `m-button` e `m-row`. Os layouts usam `gap`, `padding`, `align` e `justify`, com as views do NativeScript tratadas internamente.

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text variant="title">Seu espaço.</m-text>
    <m-card gap="md">
      <m-text>Pronto quando você estiver.</m-text>
      <m-row gap="sm">
        <m-button :grow="1" @click="salvar">Salvar</m-button>
        <m-button variant="secondary" @click="cancelar">Cancelar</m-button>
      </m-row>
    </m-card>
  </m-column>
</m-screen>
```

O trecho ilustra o template de uma tela; `salvar` e `cancelar` são funções do seu aplicativo. Registre os componentes uma vez na inicialização:

```ts
import { createMavis } from '@mavis-ui/nativescript/vue'
import { midnight } from '@mavis-ui/nativescript'

app.use(createMavis({ theme: midnight }))
```

`app` é a aplicação NativeScript-Vue. Os componentes também são exportados para importação individual. O `MScreen` representa uma Page nativa, então precisa de um host de navegação, como o `RouterView` do vue-router-ns. O Garage inclui a inicialização e o router completos.

## Componentes atuais

| Componente | Função e API inicial |
| --- | --- |
| `m-screen` | Page nativa; `scroll` habilita rolagem vertical. |
| `m-row` | Layout horizontal; `gap`, `align`, `justify`, `wrap`. |
| `m-column` | Layout vertical com as mesmas propriedades de layout. |
| `m-box` | Conteúdo sobreposto; o último filho fica por cima. |
| `m-card` | Superfície com tema e conteúdo organizado verticalmente. |
| `m-text` | Texto no slot ou em `text`; `variant`, `tone`, `align`, `wrap`. |
| `m-button` | Texto no slot ou em `text`; `variant`, `size`, `disabled`, `loading`, `loadingText`; emite `click`. |
| `m-slider` | `v-model` numérico; `min`, `max`, `step`, `disabled`; `label` acessível obrigatório. |
| `m-reveal` | `show` insere/remove conteúdo com animação de entrada e saída pelo Jolt. |

Os espaçamentos aceitam `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` ou um número em unidades independentes de densidade. `paddingX` e `paddingY` sobrescrevem os lados correspondentes. `grow` distribui o espaço disponível entre os filhos e começa em `0`. Os filhos preservam a altura natural nas colunas. Nas linhas, podem reduzir a largura para caber; `shrink` permite ajustar esse comportamento.

`align` aceita `start`, `center`, `end`, `stretch`. O padrão é `center` nas linhas e `stretch` nas colunas. `justify` aceita `start`, `center`, `end`, `between`, `around`; o padrão é `start`. A quebra de linha fica desativada até habilitar `wrap`.

As variantes dos botões são `primary`, `secondary` e `ghost`; os tamanhos são `sm`, `md` e `lg`. Os textos oferecem `display`, `title`, `heading`, `body`, `caption` e `overline`. Os slots de texto e botão aceitam texto simples ou interpolado nesta versão. Use os layouts para compor conteúdo mais rico.

Atributos, classes, estilos e eventos nativos podem ser passados quando necessário. Estilos locais sobrescrevem os padrões do tema. Views nativas podem conviver com componentes Mavis.

## Troque ou personalize um tema

O **Mavis** é claro, com superfícies quentes e detalhes em rosa. O **Midnight** usa superfícies em verde profundo e detalhes em lima. Ambos definem cores, espaçamentos, tipografia, tamanhos dos controles e cantos.

```ts
import { defineTheme, mavis, midnight } from '@mavis-ui/nativescript'
import { useMavisTheme } from '@mavis-ui/nativescript/vue'

// Dentro de setup():
const { theme, setTheme } = useMavisTheme()
setTheme(midnight)

const studio = defineTheme({
  name: 'studio',
  colors: { primary: '#5636A8', onPrimary: '#FFFFFF' },
  radius: { md: 12 },
}, mavis)
setTheme(studio)
```

A mudança de tema atualiza os componentes montados. Cada app possui seu próprio estado de tema. `defineTheme` preserva os demais valores da base e retorna um tema imutável. Paletas personalizadas precisam de sua própria revisão de contraste.

## Movimento e limites

Os botões usam o feedback de toque do Jolt. Desabilitar, descarregar ou desmontar o controle remove o efeito e restaura a escala. O `m-reveal` anima opacidade e deslocamento vertical; a altura ocupada pelo conteúdo muda imediatamente. O Jolt segue a preferência de movimento reduzido do sistema por padrão. A Mavis não altera a configuração global do Jolt.

Esta implementação inicial cobre layouts, texto, superfícies, botões, sliders e uma transição de revelação. Inputs, sheets, ícones, seleção automática do tema do sistema e integrações além de Vue continuam como próximos trabalhos. O exemplo usa dados locais de demonstração.
