---
title: Telas compartilhadas para Web, Nativo e Mac
description: Escreva telas compartilhadas uma vez, em TSX ou nos arquivos Vue que seus apps já executam, e gere a partir delas um app nativo SwiftUI para macOS, com Vue para a Web e o NativeScript.
---

# Telas compartilhadas para Web, Nativo e Mac

Um **experimento opcional de compilação**: telas escritas uma vez em `shared/` geram Vue na Web, Vue para o NativeScript no iOS e Android e SwiftUI no macOS. Isso não leva os 92 componentes ao macOS. Telas `.vue` compartilhadas que ficam dentro do mesmo subconjunto são [lidas para o Mac como estão](#arquivos-vue-compartilhados), sem reescrita.

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.13 first-light --target macos --yes
cd first-light
npm install
npm run macos
```

A RC.12.2 criou a primeira versão deste starter (Web + Mac, quatro primitivas, estado literal). A RC.13 traz tudo o que está abaixo, inclusive o Nativo, qualquer combinação de destinos e o Jolt no Mac. Um projeto com todos os destinos é criado assim:

```sh
npx @getcortexlabs/create-mavis first-light --targets web,native,macos
```

Escolha qualquer combinação com Mac no assistente (Web, Nativo e Mac são uma seleção múltipla) ou passe `--targets`; `--target macos` continua sendo o starter Web + Mac. Acrescente `--package-manager pnpm` ou `--package-manager yarn` para gerar os comandos e configurações correspondentes. O app do Mac exige **macOS 14+ e Xcode**, o Nativo exige a CLI do NativeScript e os SDKs; a Web e a geração também funcionam no Linux e no Windows.

## Código compartilhado

```text
shared/Welcome.lite.tsx, shared/TaskRow.lite.tsx, shared/types.ts
            │ Compilador portátil do Mavis (checado com TypeScript)
            ├── apps/web/src/generated/*.vue → Vue + Vite + Mavis Web
            ├── apps/mobile/src/generated/*.vue → NativeScript-Vue + Mavis (iOS, Android)
            └── apps/macos/Sources/MavisDesktop/Generated/*.swift → SwiftUI + JoltSwiftUI (macOS)
```

Só os destinos escolhidos são gerados. Cada `Nome.lite.tsx` exporta um componente; arquivos `.ts` em minúsculas guardam tipos de registro compartilhados. `Welcome` é a tela que todos os apps abrem; `portability.entry` no `mavis.config.json` indica outra, como faz o [exemplo Tasks](./tasks-example). Os arquivos usam o formato de componente do [Mitosis](https://mitosis.builder.io/) (`useStore`, `Show`, `For`), mas quem gera todas as saídas é o compilador do Mavis, e o Mitosis não é instalado. O app do Mac usa `@State`, `Text`, stacks e controles `Button` reais, sem WebView nem runtime JavaScript. Cada app mantém seu próprio estado: compartilhamos o código, não os dados entre apps abertos.

```tsx
import { useStore, Show, For } from '@builder.io/mitosis'
import type { Task } from './types'
import TaskRow from './TaskRow.lite'

export default function Welcome() {
  const state = useStore({
    tasks: [{ id: 'a', title: 'Escrever', done: false }] as Task[],
    get open(): number {
      return state.tasks.filter((task) => !task.done).length
    },
    toggle(id: string) {
      state.tasks = state.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      )
    },
  })
  return (
    <MColumn gap="md">
      <MText variant="title">{state.open} abertas</MText>
      <Show when={state.tasks.length > 0} else={<MText tone="muted">Nada ainda</MText>}>
        <For each={state.tasks}>
          {(task) => <TaskRow key={task.id} task={task} onToggle={(id) => state.toggle(id)} />}
        </For>
      </Show>
    </MColumn>
  )
}
```

Execute `npm run generate` depois de editar; os comandos de abertura e build também geram. Com o Vite rodando, gere de novo e ele recarrega. No macOS, recompile ou reabra o app. As pastas geradas são substituídas a cada execução; não edite seus arquivos. `tsconfig.json` e o `mavis-env.d.ts` gerado deixam o editor checar `shared/` do mesmo jeito.

| Comando                   | Resultado                                                       |
| ------------------------- | --------------------------------------------------------------- |
| `npm run dev:web`         | Gera e abre o servidor Vue/Vite                                 |
| `npm run build:web`       | Gera e compila a Web                                            |
| `npm run generate`        | Checa os tipos do código compartilhado e gera todos os destinos |
| `npm run ios` / `android` | Gera e abre o app NativeScript                                  |
| `npm run build:native`    | Gera e empacota o JavaScript do NativeScript                    |
| `npm run macos`           | Gera, compila e abre o app do Mac                               |
| `npm run build:macos`     | Compila `dist/first-light.app` sem abrir                        |
| `npm run build`           | Compila todos os destinos                                       |

Use `pnpm run` ou `yarn run` se esse foi o gerenciador escolhido. `--doctor` verifica as ferramentas do Mac e compila o código compartilhado com o compilador do próprio projeto; não substitui o build do app.

## O que o código pode usar

| Área         | Suportado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitivas   | [`MScreen`](#telas) (`scroll`, `slotOverlay`), `MColumn`/`MRow` (`gap`, `justify`, `align`, `wrap`, `label`, `onKeyDown`), [`MStack`](#stacks-responsivos) (as mesmas, `direction`, `responsive`), `MGrid` (`gap`, `columns`, `minColumnWidth`), `MCard` (`gap`, `elevation`, `tone`, `label`, `onClick`, `disabled`), `MText` (`variant`, `tone`, `weight`, `align`, `as`, `wrap`, texto, valores e trechos [`MSpan`](#camadas-trechos-e-separadores)), [`MBox`](#camadas-trechos-e-separadores) (camadas), [`MSeparator`](#camadas-trechos-e-separadores) (`orientation`, `length`, `spacing`, `inset`), [`MThemeProvider`](#escopos-de-tema-e-ramos-por-plataforma) (`theme`, `darkTheme`, `appearance`), [`MPlatform`](#escopos-de-tema-e-ramos-por-plataforma) (`only`, `slotFallback`), [`MMasonry`](#masonry-e-paineis-redimensionaveis) (`items`, `minColumnWidth`, `columns`, `gap`, `animated`, `emptyLabel`, `label`, `slotItem`), [`MResizablePanels`](#masonry-e-paineis-redimensionaveis) (`value`, `onChange`, `onResize`, `min`, `max`, `step`, `snap`, `orientation`, `direction`, `height`, `collapsible`, `disabled`, os quatro rótulos, `slotPrimary`, `slotSecondary`), [`MVirtualList`](#listas-longas-cabecalhos-que-recolhem-e-atualizacao) (`items`, `itemKey`, `rowHeight`, `height`, `overscan`, `initialIndex`, `emptyLabel`, `label`, `ref`, a linha como conteúdo, `slotEmpty`), [`MCollapsibleHeader`](#listas-longas-cabecalhos-que-recolhem-e-atualizacao) (`title`, `subtitle`, `image`, `height`, `expandedHeight`, `collapsedHeight`, `sectionHeight`, `parallax`, `back`, `backLabel`, `topLabel`, `onBack`, `slotArtwork`, `slotLeading`, `slotActions`, `slotSection`), [`MRefreshControl`](#listas-longas-cabecalhos-que-recolhem-e-atualizacao) (`label`, `refresh`, `height`, `disabled`, `threshold`, os seis rótulos, `onStateChange`), `MButton` (`text`, `variant` primary/secondary/ghost, `size`, `disabled`, `loading`, `loadingText`, `loadingIndicator`, `onClick`, `shortcut`) |
| Caixas       | Em `MColumn`, `MRow`, `MStack`, `MGrid`, `MBox` e `MCard`: `padding`, `paddingX`, `paddingY`, `radius`, `backgroundColor`, `width`, `height`, `grow`, `shrink`. `MText` e `MButton` aceitam `grow` e `shrink`. Toda primitiva aceita `id` e `accessibilityHidden`, e todas menos os campos, `accessibilityLabel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Campos       | `MInput` (`label`, `value`, `onChange`, `placeholder`, `helperText`, `error`, `type` text/email/password, `multiline`, `rows`, `maxLength`, `disabled`, `readonly`, `onSubmit`, `onEscape`, `ref`), `MCheckbox` (`label`, `checked`, `onChange`, `indeterminate`, `helperText`, `disabled`), `MSelect` (`label`, `value`, `options`, `onChange`, `placeholder`, `helperText`, `error`, `disabled`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Componentes  | Outros arquivos compartilhados, com propriedades tipadas, callbacks e [slots](#slots)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Estado       | `useStore` com strings, números, booleanos, uniões de strings, tipos de registro nomeados e arrays; valores iniciais podem vir das propriedades                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Referências  | `const titleRef = useRef<MavisFieldRef>(null)` em um `MInput` com `ref={titleRef}`; ações chamam `titleRef.focus()` e `titleRef.blur()`. `const feedRef = useRef<MavisListRef>(null)` em um `MVirtualList`; ações chamam `feedRef.scrollToIndex(index)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Getters      | `get nome(): Tipo { … }`: linhas `const` opcionais e depois `return`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Ações        | Métodos com parâmetros tipados: `=`, `+=`, `-=`, `++`, `--`, `if`/`else`, `return`, `push`, `unshift`, `splice`, chamadas a outras ações e callbacks, e `throw new Error('motivo')` numa ação que o `MRefreshControl` executa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Expressões   | Comparações entre números ou entre strings, `&&`, `\|\|`, `!`, ternários, aritmética, template literals, `?.`, `??`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Texto        | `trim`, `toLowerCase`, `toUpperCase`, `includes`, `startsWith`, `endsWith`, `length`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Arrays       | `filter`, `map`, `find`, `findIndex`, `some`, `every`, `includes`, `slice`, `join`, `toSorted`, `length`, `lista[índice]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Math         | `Math.min`, `max`, `floor`, `ceil`, `abs`, `round`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Renderização | `<Show when else>`, `<For each>` com um campo `key` de cada item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Qualquer outra coisa interrompe a geração com `arquivo:linha:coluna`, antes de mudar qualquer saída. Tipos de registro precisam de nome (`type Task = { … }`) e o `For` precisa de uma chave vinda do item, como `key={task.id}`. Para usar um valor que pode ser `undefined`, como `lista[índice]` ou `find(…)`, verifique antes: `if (task === undefined) return`, `if (task !== undefined) { … }` e `task === undefined ? … : task.title` estreitam o tipo em todas as saídas. `type` e `multiline` escolhem o controle nativo, por isso são escritos como literais.

## Layout

As primitivas aceitam as propriedades dos contratos publicados do Mavis, com os mesmos nomes, valores e padrões, então uma tela é organizada uma vez para todos os alvos:

```tsx
<MColumn gap="md" padding="lg" radius="md" backgroundColor="#F4EFFF">
  <MRow gap="sm" justify="between" align="center">
    <MText as="h2" variant="heading" grow={1}>
      Inbox
    </MText>
    <MButton text="New" size="sm" onClick={() => state.compose()} />
  </MRow>
  <MRow gap="sm" wrap>
    <MCard width={220} padding="sm">
      <MText>Today</MText>
    </MCard>
    <MCard grow={1} padding="sm">
      <MText align="right">3 open</MText>
    </MCard>
  </MRow>
</MColumn>
```

- `gap`, `padding`, `paddingX` e `paddingY` aceitam um token de espaçamento ou um número; `paddingX` e `paddingY` substituem o `padding` cada um no seu eixo. `radius` aceita um token de raio ou um número e arredonda o `backgroundColor`.
- `justify` é `start`, `center`, `end`, `between` ou `around`. `align` é `start`, `center`, `end` ou `stretch`: por padrão, uma coluna estica os filhos e uma linha os centraliza. `wrap` começa uma nova linha quando o próximo filho não cabe.
- `width` e `height` aceitam um número, uma parte do contêiner como `"50%"`, ou `"auto"`. `grow` divide o espaço livre e `shrink` cede espaço quando falta: os filhos de uma linha encolhem por padrão, os de uma coluna não.
- `MText` aceita `weight`, `align` (`left`, `center`, `right`) e `wrap`; `as="h1"` a `as="h6"` faz dele um título para tecnologias assistivas. Sem `as`, o Mac continua lendo as variantes `display`, `title` e `heading` como títulos.
- `id` nomeia um elemento para testes e ferramentas: o `id` do DOM, o `id` da view do NativeScript e o identificador de acessibilidade no Mac. `accessibilityLabel` é o que as tecnologias assistivas leem no lugar do conteúdo, e `accessibilityHidden` esconde o elemento delas.

Na Web e no NativeScript, essas propriedades chegam aos componentes do Mavis sem mudança. No Mac, `MColumn` e `MRow` são um `Layout` do SwiftUI no runtime gerado (`MavisFlex`) que segue as mesmas regras do flexbox, em vez de aproximá-las com stacks e espaçadores: um filho começa na sua `width` ou `height` ou no tamanho do conteúdo, o espaço livre vai para os filhos que crescem, a falta sai dos que encolhem, uma parte é calculada sobre o tamanho do próprio stack, e o `gap` também separa as linhas quebradas. Por isso um botão colocado direto em uma coluna tem a largura da coluna, como na Web; coloque-o em um `MRow` para manter a largura própria.

São escritos como literais, porque cada alvo os resolve quando a tela é compilada: uma parte como `"50%"`, e `as`. `backgroundColor` é uma cor hexadecimal, `#RGB` ou `#RRGGBB`, que todos os alvos leem do mesmo jeito.

No Mac, o `id` de um texto, de um botão ou de um campo é o identificador de acessibilidade dele. O `id` de um contêiner (`MColumn`, `MRow`, `MGrid`, ou um `MCard` sem `onClick`) não acrescenta nada ao app que as pessoas usam: um elemento de acessibilidade sobre o contêiner tomaria o teste de clique dos controles dentro dele, e o SwiftUI funde o elemento de um contêiner com o único contêiner dentro dele. Um teste de interface que precisa dos limites de um contêiner abre o app com a variável de ambiente `MAVIS_TEST_IDENTIFIERS=1`. O contêiner então marca os cantos superior inicial e inferior final com dois elementos transparentes de um ponto que levam o identificador, e o quadro dele é a união dos elementos com esse identificador. Compare o identificador exatamente, com um predicado como `identifier == %@`: o `matching(identifier:)` do XCUITest também encontra um elemento cujo rótulo é o mesmo texto.

## Telas

`MScreen` é a própria tela: a raiz da view de uma tela, em volta de tudo o que ela mostra.

```tsx
<MScreen
  scroll
  slotOverlay={
    <MColumn padding="md">
      <MCard padding="md">
        <MText weight="bold">Entrada</MText>
      </MCard>
    </MColumn>
  }
>
  <MColumn paddingX="lg" paddingY={96} gap="md">
    <MText as="h1" variant="title">
      Hoje
    </MText>
  </MColumn>
</MScreen>
```

Num arquivo Vue, o overlay é um `<template #overlay>` dentro de `<MScreen>` ou `<m-screen>`, ao lado do conteúdo.

- No Mac, a tela ocupa a janela por dentro da barra de título e da barra de ferramentas, sobre o fundo do tema. O conteúdo é uma coluna, como na Web e no NativeScript, e `scroll` a transforma numa área de rolagem vertical. Sem `scroll`, a coluna ocupa a janela e o que não cabe fica cortado, como no NativeScript: dê `scroll` a uma tela longa.
- O overlay fica sobre o conteúdo e não sai do lugar enquanto o conteúdo rola. Cada elemento dele cobre a tela, como na Web e no NativeScript, então ponha um cabeçalho primeiro numa coluna. O overlay só mostra conteúdo: a Web e o Mac deixam o ponteiro passar por ele até a tela de baixo, então um botão ou campo nele faz a geração falhar.
- O Mac guarda a posição da rolagem enquanto a janela mostra a tela, e uma janela nova começa do topo. As telas compartilhadas ainda não navegam, então não há tela para onde voltar; restaurar a posição na volta chega com a navegação.
- `dismissKeyboard` é aceito e não faz nada no Mac, que não tem teclado na tela. `motionRegion` e `motionScroll` precisam da API de movimento do Mavis, que o Mac ainda não tem: a geração para onde eles aparecem.
- `id` marca os limites da tela para testes de interface, como o de um contêiner; `accessibilityLabel` dá nome a ela e `accessibilityHidden` a esconde.

Na Web uma tela é o `<main>` da página, e no NativeScript é uma `Page`, que só um `Frame` pode conter. Por isso a tela tem um lugar só: a raiz da view de um componente. Dentro de outro elemento, de outra `MScreen`, de `Show`/`v-if`, de `For`/`v-for` ou de conteúdo passado a um slot, ela falha com `arquivo:linha:coluna`, assim como um componente que mostra outro componente cuja view é uma tela: quem abre uma tela é o app. A entrada, `portability.entry` em `mavis.config.json`, pode ser uma tela e então ocupa a janela de todos os apps. Uma entrada sem `MScreen` continua com a página que os apps põem em volta dela: uma coluna centralizada, com margem, que rola sobre o fundo do tema.

## Stacks responsivos

`MStack` é uma coluna, ou uma linha com `direction="row"`, que muda em breakpoints da própria largura. Aceita as propriedades do `MColumn`, e os filhos se esticam por ele, a menos que `align` diga outra coisa, também quando é uma linha.

```tsx
<MStack
  gap="sm"
  padding="lg"
  responsive={[
    { at: 640, direction: 'row', gap: 'lg' },
    { at: 1000, gap: 'xl', align: 'center' },
  ]}
>
  <MCard grow={1}>
    <MText>Detalhes</MText>
  </MCard>
  <MCard grow={1}>
    <MText>Atividade</MText>
  </MCard>
</MStack>
```

- Um breakpoint vale quando a largura do conteúdo do stack, a largura dele sem o padding, é pelo menos `at`. Os breakpoints valem em ordem crescente, seja qual for a ordem em que foram escritos, e cada um substitui o `direction`, o `gap`, o `align`, o `justify` e o `wrap` que define. É a regra dos stacks da Web e do NativeScript, e o executor de conformidade confere no Mac uma tabela de breakpoints e larguras contra ela.
- No Mac, o layout do stack lê os breakpoints na largura que recebe, na mesma passada de layout. Redimensionar a janela muda a direção sem um quadro do layout inicial e sem recriar os filhos, então os campos mantêm o texto e o foco. Um stack que não recebe largura, como um medido dentro de uma linha, usa o layout inicial. A Web e o NativeScript mostram primeiro o layout inicial e aplicam os breakpoints depois de medir o stack.
- Os breakpoints são lidos quando a tela é compilada, então são escritos no atributo: um objeto ou uma lista deles, com valores literais e cada `at` um número positivo diferente dos outros. Uma escolha entre listas escritas por `useMavisPlatform()` funciona. Breakpoints vindos do estado, de propriedades ou de uma constante no script falham com `arquivo:linha:coluna`. `direction` pode vir do estado.

## Camadas, trechos e separadores

```tsx
<MColumn gap="md">
  <MText as="h2" variant="title">
    Cada xícara <MSpan emphasis="em" tone="primary">conta uma história</MSpan>.
  </MText>
  <MBox radius="md" backgroundColor="#202C25">
    <MColumn padding="lg">
      <MText tone="onPrimary">Atrás do selo</MText>
    </MColumn>
    <MColumn justify="end" align="end" padding="md">
      <MCard padding="sm">
        <MText>Novo</MText>
      </MCard>
    </MColumn>
  </MBox>
  <MSeparator spacing="sm" inset="md" />
</MColumn>
```

- `MBox` põe os filhos numa mesma área, o último desenhado por cima. Cada filho é uma camada que ocupa a caixa inteira, como na célula da grade da Web e na célula do GridLayout do NativeScript: posicione o conteúdo dentro de uma camada com um `MColumn` ou `MRow` e os `align` e `justify` deles, como o selo acima. Sem `height`, a caixa tem a altura da camada mais alta; com `height`, ou esticada por uma linha, todas as camadas a preenchem. Uma camada com `width` ou `height` próprios faz a geração falhar, porque a Web a põe no canto superior esquerdo e o NativeScript no meio. No Mac as camadas são um layout SwiftUI (`MavisLayers`), com as propriedades de caixa dos outros contêineres. `motionSurface`, `motionRegion` e `perspective` param a geração até o Mac ter a API de movimento do Mavis.
- `MSpan` é um trecho de texto dentro de `MText` ou de outro `MSpan`, com `text` ou conteúdo, `weight`, `tone` e `emphasis`: `strong` é negrito, a menos que um `weight` diga outra coisa, e `em` é itálico. Um trecho aninhado herda dos trechos em volta e pode trocar `weight` e `tone`. São as regras que a Web e o NativeScript tiram do `inlineContent` do core, e um teste unitário confere o compilador contra ele. No Mac, `MText` vira um único `Text` do SwiftUI juntando os trechos com estilo, então o VoiceOver o lê como um texto contínuo; o SwiftUI não tem marca para `strong`, então ali ele é só negrito. `emphasis` é literal. `MSpan` em qualquer outro lugar faz a geração falhar. Num arquivo Vue, uma quebra de linha entre dois trechos remove o espaço entre eles, como o Vue faz em todo lugar: mantenha o texto e seus trechos numa linha, ou escreva o espaço como `{{ ' ' }}`.
- `MSeparator` desenha uma linha na cor `border` do tema, com um ponto de espessura, que o VoiceOver não vê. Sem `length`, ela se estica pela coluna ou pela linha; com um, fica centralizada. `spacing` é a margem de cada lado, atravessando a linha, e `inset` a margem em cada ponta, como na Web e no NativeScript.

## Escopos de tema e ramos por plataforma

```tsx
import { useStore } from '@builder.io/mitosis'
import { midnight } from '@getcortexlabs/mavis-core'

export default function Queue() {
  const state = useStore({ night: true })
  return (
    <MColumn gap="md">
      <MThemeProvider theme={midnight} appearance={state.night ? 'dark' : 'light'}>
        <MCard>
          <MText>Fila desta noite</MText>
        </MCard>
      </MThemeProvider>
      <MPlatform only="macos" slotFallback={<MText>Toque para adicionar arquivos.</MText>}>
        <MText>Solte arquivos na janela.</MText>
      </MPlatform>
    </MColumn>
  )
}
```

- `MThemeProvider` desenha o conteúdo com outro tema ou outra aparência, e o resto da janela mantém os seus. Como na Web e no NativeScript, ele não acrescenta view: os filhos são espaçados e esticados pelo stack em volta, e os providers se aninham, cada um herdando os temas em volta. No Mac as cores vêm do ambiente do SwiftUI, então um provider alcança todas as cores dos componentes dentro dele, e campos, checkboxes e selects desenham na aparência do seu tema. `theme` e `darkTheme` aceitam `mavis` ou `midnight`, importados pelo nome de `@getcortexlabs/mavis-core` (um arquivo Vue importa do mesmo jeito); `darkTheme` é um tema escuro. `appearance` é `system`, `light` ou `dark`, escrito ou vindo do estado; `system` segue a aparência escolhida nos Ajustes do Sistema, como a Web segue o aparelho. O app em si começa no tema com que o projeto foi criado, com `mavis` registrado para o claro e `midnight` para o escuro, como faz o `createMavis` do starter. No Mac o provider não aceita listeners: `v-model:theme` e `v-model:appearance` param a geração.
- Temas feitos com `defineTheme`, e temas guardados num módulo compartilhado, param a geração com uma mensagem que cita a [#342](https://github.com/getcortexlabs/mavis-ui/issues/342). Os dois temas embutidos só diferem em cores e aparência, então um provider com eles bate com a Web e o NativeScript; um tema seu também pode mudar espaçamento, raio, tipografia, tamanhos de controle e elevação, que o Mac ainda escreve a partir do tema do projeto ao gerar.
- `MPlatform` mostra o conteúdo nos destinos que `only` nomeia, um ou uma lista escritos por extenso e conferidos contra `web`, `native`, `ios`, `android` e `macos`, e o slot `fallback` em todos os outros. Ele também não acrescenta view. A Web e o NativeScript mantêm os dois ramos; o SwiftUI tem só o que o Mac mostra. Um arquivo Vue roda como está na Web e no NativeScript, então o ramo que o Mac não mostra nem é lido para o Mac e pode usar o que só esses destinos têm; o TSX é gerado para todos os destinos, então os dois ramos dele ficam no subconjunto portátil.

## Masonry e painéis redimensionáveis

```tsx
<MColumn gap="md">
  <MMasonry
    label="Fixados"
    items={state.pins}
    minColumnWidth={160}
    columns={3}
    slotItem={({ item, index }) => (
      <MCard>
        <MText>{`${index + 1}. ${item.id}`}</MText>
      </MCard>
    )}
  />
  <MResizablePanels
    label="Divisão da área de trabalho"
    value={state.split}
    onChange={(value) => (state.split = value)}
    onResize={(value) => (state.saved = value)}
    collapsible
    slotPrimary={<MText>Biblioteca</MText>}
    slotSecondary={<MText>Leitura</MText>}
  />
</MColumn>
```

- `MMasonry` põe os itens em tantas colunas de pelo menos `minColumnWidth` quantas couberem, no máximo `columns`, cada um no fim da coluna mais curta, na ordem, e com a largura da coluna: o `masonryLayout` do core, como um layout SwiftUI que mede cada item na largura da coluna. `items` são registros com um `id` string. O slot do item entrega `item` como um `MasonryItem` (`id` e `estimatedHeight`), como a Web e o NativeScript o tipam, com `index` e a `width` da coluna: busque o resto pelo `id`. Num arquivo Vue o slot é `<template #item="{ item, index }">`. Quando a lista muda, o Jolt leva os itens aos seus lugares, e Reduzir Movimento os põe lá de uma vez. O Mac mede antes de posicionar, então não usa `estimatedHeight`. Um `minColumnWidth` escrito abaixo de 40 ou `columns` fora de 1 a 12 param a geração.
- `MResizablePanels` divide os dois slots com um divisor; `value` é a fração do primeiro painel em porcentagem e pertence à fonte, `v-model` num arquivo Vue. O divisor segue o ponteiro e o teclado: as setas o movem de `step` em `step`, cinco passos com Shift, Home e End vão a `min` e `max`, Return recolhe e expande, e Escape cancela um arraste e devolve o divisor. Um arraste que termina a até 3 de um ponto de `snap` assenta nele, e `onResize` (`@resize`) informa onde terminou. Todo valor é um número inteiro de passos a partir do menor, dentro dos limites, como a Web e o NativeScript calculam; um valor que a fonte não aceita deixa o divisor onde estava. Com `collapsible` o primeiro painel pode ir a 0, e o botão abaixo dos painéis traz de volta a fração que ele tinha. O Jolt assenta o divisor depois de qualquer mudança que não seja um arraste. O NativeScript também desenha um slider e botões de passo para o toque; o Mac não. Um `min` escrito que não fique abaixo de `max` para a geração.

## Listas longas, cabeçalhos que recolhem e atualização

```tsx
import { useRef, useStore } from '@builder.io/mitosis'
import type { Stop } from './types'

export default function Line() {
  const lineRef = useRef<MavisListRef>(null)
  const state = useStore({
    stops: [{ id: 's01', name: 'Alder Gate' }] as Stop[],
    edition: 1,
    offline: false,
    reload() {
      if (state.offline) throw new Error('Offline')
      state.edition += 1
    },
  })
  return (
    <MColumn gap="md">
      <MVirtualList ref={lineRef} label="Paradas" items={state.stops} rowHeight={48} height={240}>
        {({ item, index }) => (
          <MRow height={48} paddingX="md" align="center">
            <MText>{`${index + 1}. ${item.name}`}</MText>
          </MRow>
        )}
      </MVirtualList>
      <MButton text="Última parada" onClick={() => lineRef.scrollToIndex(state.stops.length - 1)} />
      <MCollapsibleHeader
        title="Acima da rotina"
        subtitle="Uma pausa em outro ritmo"
        height={480}
        sectionHeight={40}
        slotSection={<MText variant="overline">O roteiro</MText>}
      >
        <MColumn padding="lg" gap="md">
          <MText>Primeira luz</MText>
        </MColumn>
      </MCollapsibleHeader>
      <MRefreshControl label="Edição da manhã" refresh={() => state.reload()}>
        <MText>{`Edição ${state.edition}`}</MText>
      </MRefreshControl>
    </MColumn>
  )
}
```

- `MVirtualList` mostra linhas de `rowHeight` numa área de `height`, e só existem as linhas à vista, com mais `overscan` de cada lado (3, se você não disser outro). O Mac decide quais são essas linhas como o `virtualWindow` do core decide para a Web, então os dois constroem as mesmas linhas e uma linha que sai perde o próprio estado nos dois; guarde nos itens o que precisa durar. No Mac isso é um `ScrollView` do SwiftUI cujas linhas essa janela posiciona, com o Jolt lendo a posição de rolagem, e nem um `LazyVStack`, que decide sozinho quantas linhas mantém, nem um `List`, que traz a seleção, as margens e o fundo de uma tabela. `items` são registros, e `itemKey` nomeia o campo string ou número que identifica cada um, escrito por extenso (`id`, se você não nomear outro). A linha é o conteúdo, como função de `item`, `index` e `itemKey`: `{({ item }) => …}` em TSX, `<template #default="{ item }">` ou `v-slot="{ item }"` na lista num arquivo Vue. `slotEmpty` (`#empty`) ou `emptyLabel` aparece quando não há itens, e `initialIndex` é a linha em que a lista começa. Uma referência de lista a rola a partir de uma ação: `const lineRef = useRef<MavisListRef>(null)` com `ref={lineRef}` e `lineRef.scrollToIndex(index)`, ou `ref<VirtualListHandle | null>(null)` e `lineRef.value?.scrollToIndex(index)` num arquivo Vue. Um índice fora da lista é erro na Web e no NativeScript e é ignorado no Mac. Quando os itens mudam, a primeira linha à vista fica onde estava.
- `MCollapsibleHeader` é uma região de `height` cujo conteúdo rola por baixo de um cabeçalho. O cabeçalho tem `expandedHeight` e recolhe até `collapsedHeight` conforme o conteúdo rola. Uma barra fica no topo com o botão de voltar (`back`, com `onBack` ou `@back`) ou o slot `leading`, o título quando o cabeçalho já recolheu, um botão que rola de volta ao topo e o slot `actions`. O slot `section` é uma faixa de `sectionHeight` sob o cabeçalho que termina sob a barra. Atrás do título e do `subtitle` fica o slot `artwork` ou uma `image` de uma URL, que se move mais devagar que o conteúdo conforme `parallax`. No Mac, o `JoltScrollView` do Jolt lê a posição de rolagem e o `joltScrollLinked` apaga o título do cabeçalho nos primeiros 70% do recolhimento, acende o da barra de 55% a 95% e move a arte; com Reduzir Movimento a arte fica parada, e o cabeçalho continua acompanhando o conteúdo. Os quatro slots só mostram conteúdo: a Web deixa o ponteiro atravessar o cabeçalho, então um controle ali para a geração. Os botões da barra usam SF Symbols no Mac.
- `MRefreshControl` é uma região de `height` com o `label`, um botão que atualiza e uma linha que diz como foi, sobre um conteúdo que rola. `refresh` executa uma função do componente: `refresh={() => state.reload()}` em TSX, `:refresh="reload"` num arquivo Vue. Uma função falha com `throw new Error('motivo')`: a linha mostra `errorLabel` e o botão, `retryLabel`; quando ela retorna, a linha mostra `successLabel`. `onStateChange` (`@state-change`) informa `idle`, `refreshing`, `success` e `error`. A Web e o NativeScript também atualizam ao puxar além de `threshold`; o Mac tem o botão e Command-R no lugar, que é o que um app de Mac oferece. Uma função que pode lançar erro vai para `refresh` e mais nenhum lugar: um botão que a chamasse não teria como mostrar a falha, então isso para a geração.
- Uma atualização ainda não pode esperar por nada. Telas compartilhadas não têm funções assíncronas até a [#340](https://github.com/getcortexlabs/mavis-ui/issues/340) trazer módulos e serviços compartilhados, então `refresh` não recebe o contexto da atualização e termina na hora ou falha. O controle do Mac já está pronto para o resto: executa a função numa tarefa, mostra `refreshingLabel` e o botão com `cancelLabel` enquanto ela roda, cancela a tarefa quando pedem, quando é desabilitado e quando some, e ignora uma execução que outra mais nova substituiu.

## Formulários

Os campos são controlados: o código-fonte guarda o valor e um handler de mudança o atualiza. A validação é um getter, e uma ação pode levar o foco ao primeiro campo inválido.

```tsx
import { useStore, useRef } from '@builder.io/mitosis'

export default function NovaTarefa() {
  const titleRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    title: '',
    priority: undefined as string | undefined,
    submitted: false,
    priorities: [
      { value: 'low', label: 'Baixa' },
      { value: 'high', label: 'Alta' },
    ] as SelectOption[],
    get titleError(): string {
      return state.submitted && state.title.trim() === '' ? 'Informe um título' : ''
    },
    save() {
      state.submitted = true
      if (state.titleError !== '') {
        titleRef.focus()
        return
      }
      state.submitted = false
    },
  })
  return (
    <MColumn gap="md">
      <MInput
        label="Título"
        ref={titleRef}
        value={state.title}
        onChange={(value) => (state.title = value)}
        error={state.titleError}
        onSubmit={() => state.save()}
      />
      <MSelect
        label="Prioridade"
        value={state.priority}
        options={state.priorities}
        onChange={(value) => (state.priority = value)}
        placeholder="Escolha uma"
      />
      <MButton text="Salvar" onClick={() => state.save()} />
    </MColumn>
  )
}
```

A Web usa `MInput`, `MCheckbox` e `MSelect` do Mavis Web. O macOS usa `TextField`, `SecureField` ou `TextEditor` (com o label como nome acessível), um `Toggle` no estilo checkbox que mostra o estado misto de `indeterminate` e um `Picker` de menu cujo placeholder é uma escolha vazia explícita enquanto `value` é `undefined`. Os dois desenham label, mensagem e a borda de foco do Mavis a partir dos tokens do tema.

- **Return** num campo de uma linha executa `onSubmit`; num campo multilinha, adiciona uma linha. **Escape** executa `onEscape`.
- **Tab** e **Shift-Tab** seguem a ordem do código-fonte. No macOS, Tab dentro de um campo multilinha digita uma tabulação, como nos outros apps do Mac; Control-Tab avança.
- `maxLength` conta unidades UTF-16 em todos os destinos, e `readonly` mantém o valor e ainda permite selecionar e copiar.
- `type="email"` desliga a correção automática no macOS; o Mac não tem teclado de e-mail. Como no input da Web, o campo mostra o próprio texto até o código-fonte mudar o valor.

## Listas

Guarde a seleção no estado pela chave, assim ela sobrevive a filtros, ordenação e reordenação. Uma stack com `label` e `onKeyDown` recebe as setas enquanto ela ou uma de suas linhas tem foco: na Web é um grupo focável; no macOS entra na ordem do Tab e recebe foco com um clique. Campos de texto mantêm as próprias setas.

```tsx
<MColumn gap="sm" label="Tarefas" onKeyDown={(key) => state.step(key)}>
  <For each={state.visible}>
    {(task) => (
      <TaskRow
        key={task.id}
        task={task}
        selected={task.id === state.selected}
        onSelect={(id) => (state.selected = id)}
        onRename={(id, title) => state.rename(id, title)}
      />
    )}
  </For>
</MColumn>
```

As linhas mantêm estado, foco e seleção de texto quando outras linhas entram ou saem, quando a lista é filtrada e quando uma linha se move, inclusive a linha em edição quando a ordenação depende do texto dela. O SwiftUI mantém a linha pela chave. Na Web, o Vue move linhas com `insertBefore`, que tira o foco nos navegadores; por isso a lista gerada move a linha focada com `moveBefore` quando o navegador tem esse método e, sem ele, devolve o foco e a seleção.

No macOS, botões entram na ordem do Tab apenas com a navegação por teclado ativada nos Ajustes do Sistema, como nos outros apps do Mac. Sem ela, o Tab passa por campos e listas, e as setas movem a seleção.

## Grades, cartões e atalhos

`MGrid` organiza os filhos em colunas iguais: quantas couberem com `minColumnWidth`, até `columns`. Uma lista ao lado do detalhe em uma janela larga vira uma coluna só no celular ou em uma página estreita, sem breakpoints no código. Tecnologias assistivas leem cada célula inteira, na ordem do código.

`MCard` é a superfície de cartão do tema em volta de uma coluna de conteúdo; `tone` escolhe o fundo na paleta (`tone={selected ? 'primarySoft' : 'surface'}`), `elevation` a sombra, e as propriedades de caixa o padding, o raio e o tamanho. Com `onClick`, o cartão inteiro é um botão, como convém a uma linha selecionável: ele precisa de `label`, que é o que as tecnologias assistivas leem, e mostra só texto. Botões e campos ficam fora dele. O cartão reage ao toque pelo Jolt, como um botão, e `disabled` desliga essa reação.

```tsx
<MGrid gap="lg" columns={2} minColumnWidth={320}>
  <MColumn gap="sm">
    <For each={state.tasks} animate>
      {(task) => (
        <MCard key={task.id} label={task.title} onClick={() => state.select(task.id)}>
          <MText>{task.title}</MText>
        </MCard>
      )}
    </For>
  </MColumn>
  <MCard gap="md">
    <MButton text="New task" shortcut="mod+k" onClick={() => state.compose()} />
  </MCard>
</MGrid>
```

Um `MButton` tem os três tamanhos de controle do tema (`size="sm"`, `"md"` ou `"lg"`) e três variantes: `primary`, `secondary` e `ghost`, sem fundo. Enquanto `loading` é verdadeiro, ele mostra `loadingText` (`Loading…` se não for definido) e não aceita cliques nem o atalho. `loadingIndicator` acrescenta `dots`, `bars` ou `ring` do Jolt antes do texto: o Mavis desenha na Web e no iOS, o Mac usa o `JoltLoaderView` do JoltSwiftUI, e o Android mostra só o texto.

`shortcut` dá um atalho de teclado a um `MButton`: `mod+` e uma letra, um dígito ou `Enter`, ou uma tecla de função de `F1` a `F12`, sozinha ou com `mod+`. `mod` é Command no Mac e Control ou Command na Web, onde o atalho roda antes de o campo em foco receber a tecla, como um atalho de menu. Ele é escrito como literal, usado uma vez por arquivo, e o botão fica sempre na tela: use `disabled` em vez de escondê-lo em um `Show`, e o atalho é desativado junto. Telas de toque não têm essas teclas, então nada é gerado para o NativeScript; o botão continua lá. Os navegadores mantêm seus próprios atalhos de abas e janelas, que uma página não consegue usar.

## Movimento

O movimento é declarado no código-fonte e roda pelo Jolt em todos os destinos. Botões têm press por padrão. `<Show when={…} animate>` revela o conteúdo e mantém o conteúdo que sai até a saída terminar; `<For each={…} animate>` anima linhas que entram, saem ou trocam de lugar. Um `Show` animado fica direto dentro de um `MColumn` ou de um `MCard`, e um `For` animado direto dentro de um `MColumn` ou `MRow`, fora de outras listas.

|                         | Web e Nativo                                      | Mac                                               |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Press de botão e cartão | Receita de press do Mavis pelo Jolt               | `joltMotion` com a escala de press do tema        |
| `Show animate`          | `MReveal` (aparece subindo, sai esmaecendo)       | `JoltPresence` com `fadeInUp` e `fadeOut` do Jolt |
| `For animate`           | Região de layout do Mavis pelas chaves das linhas | `joltLayout` pelas chaves das linhas              |

Reduzir Movimento é respeitado em todos os destinos, inclusive quando muda com o app aberto, e o conteúdo que sai fica oculto para tecnologias assistivas. Clicar de novo no meio de uma animação redireciona: nenhuma linha antiga fica para trás. No Mac, esses modificadores do JoltSwiftUI usam animação do SwiftUI; não há relógio nem recurso do Jolt para liberar quando a janela fecha. O JoltSwiftUI é release candidate; o app do Mac fixa o `jolt-swift` na versão exata.

## No iOS e no Android

O app NativeScript renderiza o mesmo Vue gerado com o Mavis no NativeScript: `TextField`, `TextView` e botões reais, sem WebView. O que muda é o uso no celular:

- **Teclado.** Return executa `onSubmit` num campo de uma linha e adiciona uma linha num campo multilinha, como na Web. `onEscape`, o `onKeyDown` de uma stack e o `shortcut` de um botão são de teclado físico; ficam fora da saída NativeScript, então dê a essas ações um botão também, como nos exemplos.
- **Foco.** Referências de campo movem o foco e abrem o teclado. As linhas mantêm foco e seleção de texto quando a lista reordena: o NativeScript move uma linha removendo e adicionando a view, e a lista gerada devolve o foco.
- **Select.** O `MSelect` abre um sheet com as opções em vez de um menu; valor, placeholder e mensagens são os mesmos.

## Arquivos Vue compartilhados

Uma tela que já roda no Vue Web e no NativeScript-Vue não precisa ser reescrita em TSX para chegar ao Mac. Coloque `Nome.vue` em `shared/`, ao lado dos arquivos `.lite.tsx` ou no lugar deles. Os apps da Web e do NativeScript importam o próprio arquivo e o executam sem mudanças; só o Mac precisa de geração. O compilador lê o arquivo para o mesmo modelo que o código TSX produz, e o gerador de Swift trabalha a partir desse modelo sem saber de qual formato a tela veio.

```text
shared/Tasks.vue ───────────── importado como está ──→ apps/web, apps/mobile
       │ Front end Vue (o compilador do próprio Vue + TypeScript)
       ▼
  modelo portátil ←── front end TSX ←── shared/Welcome.lite.tsx
       ├── Gerador de Vue ──→ apps/web/src/generated, apps/mobile/src/generated (fontes TSX)
       └── Gerador de Swift ──→ apps/macos/Sources/MavisDesktop/Generated (todas as fontes)
```

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MInput, MReveal, MText, useMavisPlatform } from '#mavis'
import type { Task } from './types'
import TaskRow from './TaskRow.vue'

const props = withDefaults(defineProps<{ title: string; limit?: number }>(), { limit: 5 })
const emit = defineEmits<{ saved: [count: number] }>()
const { isMacOS } = useMavisPlatform()

const tasks = ref<Task[]>([{ id: 'a', title: 'Escrever', done: false }])
const draft = ref('')
const open = computed(() => tasks.value.filter((task) => !task.done).length)

function add() {
  if (draft.value.trim() === '' || tasks.value.length >= props.limit) return
  tasks.value.push({ id: `t${tasks.value.length}`, title: draft.value.trim(), done: false })
  draft.value = ''
  emit('saved', tasks.value.length)
}
function toggle(id: string) {
  tasks.value = tasks.value.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
}
</script>

<template>
  <MColumn gap="md" :padding="isMacOS ? 'xl' : 'md'">
    <MText variant="title">{{ title }}: {{ open }} abertas</MText>
    <MInput v-model="draft" label="Nova tarefa" @submit="add" />
    <MButton text="Adicionar" :disabled="!draft.trim()" @click="add" />
    <MText v-if="tasks.length === 0" tone="muted">Nada ainda</MText>
    <template v-else>
      <TaskRow v-for="task in tasks" :key="task.id" :task="task" @toggle="toggle" />
    </template>
    <MReveal :show="open === 0">
      <MText tone="success">Tudo feito</MText>
    </MReveal>
  </MColumn>
</template>
```

`npm run generate` escreve `Tasks.swift` para o Mac e nada para esse arquivo na Web ou no NativeScript. Quando `portability.entry` indica um arquivo Vue, o `entry.ts` gerado em cada app Vue reexporta o arquivo compartilhado, e os hosts o abrem como está. Arquivos Vue compartilhados importam o Mavis de `#mavis`, que cada host resolve para o seu renderizador (`apps/web/src/mavis.js`, `apps/mobile/src/mavis.ts`). Um arquivo Vue mostra outros arquivos Vue e um arquivo TSX outros TSX, porque os imports de um arquivo Vue precisam existir na Web e no NativeScript como estão escritos.

### O que um arquivo Vue pode usar

| Área         | Suportado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script       | `<script setup lang="ts">`. `const nome = ref(valor)` é estado, `computed(() => …)` um valor derivado (uma expressão, ou linhas `const` e um `return`), uma `function` ou arrow function entre chaves uma ação, e qualquer outro `const` uma constante                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Propriedades | `defineProps<{ … }>()` com os tipos no próprio arquivo, lidas como `props.nome` no script e pelo nome no template. `withDefaults` dá valores padrão literais; uma propriedade marcada com `?` pode ser omitida pelo pai (um booleano vira `false`, o resto fica ausente)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Eventos      | `defineEmits<{ saved: [id: string] }>()`, enviados com `emit('saved', id)` ou `$emit` no template e ouvidos com `@saved`. Um evento que ninguém ouve não vai a lugar nenhum                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Campos       | `v-model` em `MInput`, `MCheckbox`, `MSelect` e `MResizablePanels`, ou `:modelValue` com `@update:modelValue`; `@submit` no `MInput`. `const titleRef = ref<InputHandle \| null>(null)` com `ref="titleRef"` em um `MInput` permite que uma função chame `titleRef.value?.focus()` e `blur()`; `ref<VirtualListHandle \| null>(null)` em um `MVirtualList` permite chamar `scrollToIndex(index)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Template     | Os vinte e um primitivos, como `MButton` ou `m-button`, com as propriedades das tabelas acima nos nomes do Vue: `accessibilityLabel`, `@click` no `MButton`, `interactive` com `@click` no `MCard`, `<template #overlay>` no `MScreen`, `<template #fallback>` no `MPlatform`, `<template #item="{ item, index }">` no `MMasonry`, `<template #primary>` e `#secondary` com `@resize` no `MResizablePanels`, `:theme` e `:dark-theme` com `mavis` ou `midnight` importados de `@getcortexlabs/mavis-core`, `<template #default="{ item, index, itemKey }">` ou `v-slot` e `#empty` no `MVirtualList`, `#artwork`, `#leading`, `#actions` e `#section` com `@back` no `MCollapsibleHeader`, `:refresh` com o nome de uma função e `@state-change` no `MRefreshControl`, texto como conteúdo ou `text`. `v-if`, `v-else-if`, `v-else`, `v-for` com `:key` (no elemento ou em um `<template>`) |
| Listeners    | O nome de uma função (`@click="save"`), uma arrow function, ou instruções com `$event` (`@click="count++"`, `@update:modelValue="title = $event.trim()"`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Movimento    | `<MReveal :show="…">` diretamente em um `MColumn` ou `MCard`, onde o TSX escreve `<Show animate>`; com mais de um filho, recebe o mesmo `gap` do stack em volta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Componentes  | `import TaskRow from './TaskRow.vue'` com suas propriedades, eventos e [slots](#slots)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Valores      | Tudo o que está nas linhas Expressões, Texto, Arrays e Math acima. `null` é um valor ausente, como `undefined`: `ref<string \| null>(null)` e `valor === null` funcionam, e um tipo usa um dos dois, não ambos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Condições    | Onde o JavaScript lê um valor como condição, o Mac também lê: um texto é verdadeiro quando não está vazio, um registro ou uma lista ausente é falso, e `lista.length` é verdadeiro acima de zero. `a \|\| b` escolhe o primeiro texto que não está vazio. Compare os outros números (`count > 0`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Um `ref` e um `computed` são lidos com `.value` no script e pelo nome no template, como no Vue. Um valor inicial pode ler uma propriedade, mas não outro estado: no Mac, nada do componente existe ainda quando ele é calculado. Uma função muda o estado e não retorna nada; um valor derivado é um `computed`. Uma checagem não torna um `ref` ou um `computed` presente para o que vem depois, como acontece no TypeScript: depois de `last.value === null ? … : …` o valor continua opcional em todos os destinos; dê a ele um valor alternativo (`last.value ?? ''`) ou copie-o antes para um `const` e cheque esse.

### Um arquivo, três plataformas

`useMavisPlatform()` responde `{ platform, isWeb, isNative, isIOS, isAndroid, isMacOS }`. Na Web e no NativeScript quem responde é o renderizador, com o app rodando, e `isMacOS` é sempre `false`. Para o Mac quem responde é o compilador, na geração: `platform` é `'macos'`, `isMacOS` é `true` e o resto é `false`. Um ramo que depende só dessas respostas é decidido nesse momento, e os outros ramos nem chegam ao app do Mac; por isso podem ter o que só outra plataforma tem:

```vue
<script setup lang="ts">
import { MColumn, MGrid, MPlatform, MText, useMavisPlatform } from '#mavis'
const { isMacOS, isNative } = useMavisPlatform()
const columns = isMacOS ? 3 : 1
</script>

<template>
  <MGrid :columns="columns" :gap="isMacOS ? 'lg' : 'md'">
    <MText v-if="isMacOS">Uma janela só dela</MText>
    <Label v-else-if="isNative" text="Uma view do NativeScript que o Mac nunca lê" />
    <MText v-else>Uma aba do navegador</MText>
    <MPlatform only="macos">
      <MText>Só no Mac</MText>
      <template #fallback><MText>Em todo o resto</MText></template>
    </MPlatform>
  </MGrid>
</template>
```

Isso vale para cadeias de `v-if`, `<MPlatform only="…">`, instruções `if`, `a ? b : c` e `&&`, `||`, `!`, `===` sobre essas respostas. Imports não são condicionais: um módulo que só uma plataforma tem continua pertencendo ao app host.

### Slots

Um componente pode receber conteúdo do pai que o mostra: um slot padrão, slots nomeados e slots com escopo, que entregam valores ao seu conteúdo. Os dois formatos escrevem slots, e os dois são lidos para o mesmo modelo.

```vue
<!-- shared/Panel.vue -->
<script setup lang="ts">
import { MColumn, MText } from '#mavis'
defineProps<{ title: string }>()
</script>

<template>
  <MColumn gap="sm" padding="md">
    <slot name="header">
      <MText variant="heading">{{ title }}</MText>
    </slot>
    <slot />
    <slot name="footer" />
  </MColumn>
</template>
```

```vue
<!-- shared/TaskList.vue: um slot com escopo declara o que entrega ao conteúdo -->
<script setup lang="ts">
import { MColumn, MRow, MText } from '#mavis'
import type { Task } from './types'
defineProps<{ tasks: Task[] }>()
defineSlots<{ row?(props: { task: Task; position: number }): unknown }>()
</script>

<template>
  <MColumn gap="xs">
    <MRow v-for="(task, index) in tasks" :key="task.id" gap="sm">
      <slot name="row" :task="task" :position="index + 1">
        <MText>{{ task.title }}</MText>
      </slot>
    </MRow>
  </MColumn>
</template>
```

```vue
<!-- o pai preenche os slots -->
<Panel title="Sem uso">
  <template #header><MText variant="heading">Hoje</MText></template>
  <MText>O conteúdo entre as tags é o slot padrão.</MText>
</Panel>
<TaskList :tasks="tasks">
  <template #row="{ task, position }">
    <MText>{{ position }}. {{ task.title }}</MText>
    <MButton :text="`Concluir ${task.title}`" @click="finish(task.id)" />
  </template>
</TaskList>
```

O mesmo em TSX segue as convenções do Mitosis: `props.children` é o slot padrão e `props.slotHeader` o slot chamado `header`, os dois do tipo `JSX.Element`; `??` dá o conteúdo alternativo; um slot com escopo é uma função, `slotRow?: (props: { task: Task; position: number }) => JSX.Element`, mostrada como `{props.slotRow?.({ task, position: index + 1 }) ?? <MText>{task.title}</MText>}` e preenchida com `slotRow={({ task, position }) => <>…</>}`. O pai passa o slot padrão como filhos, ou uma função das propriedades do slot como único filho.

No Mac cada slot é um tipo de view do componente, como no SwiftUI, e uma closure que ele guarda; um slot omitido vira uma view vazia por padrão e mostra o conteúdo alternativo no lugar:

```swift
struct Panel<Header: View, Footer: View, Content: View>: View {
    init(
        title: String,
        @ViewBuilder header: @escaping () -> Header = { MavisNoSlot() },
        @ViewBuilder footer: @escaping () -> Footer = { MavisNoSlot() },
        @ViewBuilder content: @escaping () -> Content = { MavisNoSlot() }
    )
}

Panel(
    title: "Sem uso",
    header: { Text(verbatim: "Hoje") },
    content: { Text(verbatim: "O conteúdo entre as tags é o slot padrão.") }
)
```

- O conteúdo pertence ao pai: lê o estado do pai, seus campos compartilham o foco do pai, e ele é organizado onde o slot está, com o espaçamento do componente. Um slot que não recebe nada e não tem conteúdo alternativo não ocupa espaço nem acrescenta `gap`.
- Nomes de slot usam letras e dígitos, como `headerTitle`. Um slot com escopo entrega ao conteúdo todas as propriedades que declara, e nenhuma chamada `name` ou `key`, que o Vue lê no `<slot>` como do próprio slot.
- Quando um slot tem conteúdo alternativo, o conteúdo passado precisa sempre mostrar algo. O Vue também mostra o alternativo quando o conteúdo não renderiza nada (um `v-if` falso, uma lista vazia), e o SwiftUI só sabe se houve conteúdo; por isso esse conteúdo falha na geração.
- Conteúdo que o componente mostra mais de uma vez, numa lista ou em dois lugares, não pode ter um `MInput`: no Mac as cópias dividiriam um único foco. Um botão com `shortcut` nunca é conteúdo, e o `MReveal` não pode ser conteúdo direto: precisa do column em volta.
- No Swift o slot `header` é o tipo de view `Header`, guardado na closure `header`, e o slot padrão é `Content` e `content`. Quando o componente já usa um desses nomes, para um registro, um componente, um membro ou o próprio `Text` do SwiftUI, o Swift gerado usa outro, como `TextContent` ou `footerSlot`; o código-fonte não muda.

### O que falha, e como

Um arquivo fora desse subconjunto interrompe a geração antes de qualquer saída ser escrita, com `arquivo:linha:coluna` no arquivo `.vue` e o nome da construção:

```text
shared/Edit.vue:2:25: watch from vue is not supported in shared screens for the Mac: effects are not part of the portable model yet.
shared/Detail.vue:14:7: <div> is an HTML element, which a shared screen cannot use on the Mac; shared screens use MColumn, MRow, MGrid, MCard, MText, MButton, MInput, MCheckbox, MSelect and MReveal.
shared/Detail.vue:9:3: document is browser DOM access, which a shared screen cannot use on the Mac. Keep it in the Web app.
shared/Row.vue:21:23: Type '"huge"' is not assignable to type '"primary" | "secondary" | "ghost" | undefined'.
```

Todos os arquivos são lidos antes de a geração falhar, então uma execução lista o primeiro problema de cada arquivo; um arquivo que mostra um componente com problema espera por ele. Os erros de tipo vêm do TypeScript, checados contra o que o Mac suporta, e não contra as propriedades mais amplas da Web.

Ainda não é lido para o Mac: `watch` e hooks de ciclo de vida, funções `async`, nomes de slot dinâmicos (`#[name]`, `<slot :name>`), `$slots` e `useSlots`, o `<template>` de um slot com `v-if`, `v-model` e `ref` em componentes compartilhados, `v-show`, `v-html`, `class`, `style` e `<style>`, modificadores de tecla e de evento como `@keydown.esc` e `@click.stop` (o NativeScript-Vue não os executa, então `onEscape`, o `onKeyDown` de um stack e o `shortcut` de um botão ainda não têm forma em Vue), `defineModel` e `defineProps` desestruturado, funções que retornam valor, listas animadas (`:motionRegion`), um tipo de propriedades importado de outro arquivo, e tudo o que não é um arquivo `.vue` compartilhado ou um import de tipos: stores, serviços e outros módulos `.ts` com valores ([#340](https://github.com/getcortexlabs/mavis-ui/issues/340)), navegação pelo router ([#341](https://github.com/getcortexlabs/mavis-ui/issues/341)), `useMavisTheme` ([#342](https://github.com/getcortexlabs/mavis-ui/issues/342)) e componentes além dos vinte e um primitivos. Acesso ao DOM e ao NativeScript em um arquivo compartilhado é sempre um erro. Uma tela que usa essas coisas continua rodando na Web e no NativeScript; quem precisa esperar é o Mac.

Em qualquer projeto Mavis, `npx @getcortexlabs/create-mavis --check-portability` agora termina com essa lista para o Mac, arquivo por arquivo, usando os mesmos front ends. O comando só falha por causa dela em um projeto que tem o destino Mac:

```text
Mac target (experimental): 1 of 3 shared files are ready to compile.
  ready      shared/TaskRow.vue
  not ready  shared/Tasks.vue
             12:5 MScreen is not available on the Mac yet; shared screens use MColumn, …
  not ready  shared/tasks-store.ts
             A .ts file holds shared record types, under a lowercase name without dashes such as types.ts. …
```

### Como adicionar um formato

O compilador fica em `scripts/portable`: `frontends/` leem um formato, `model.mjs` descreve o que eles produzem, e `emit-swift.mjs` e `emit-vue.mjs` imprimem. Um front end é um módulo listado em `frontends/index.mjs`:

- `extension` indica os arquivos dele (`.lite.tsx`, `.vue`), e `direct` os destinos que os executam como estão.
- `open(reader, sourceFile, path)` devolve o componente com nome e propriedades, para que outros arquivos possam usá-lo; depois `link` confere os imports e `finish` lê estado, ações e a view para o modelo.
- Um formato que não é TypeScript acrescenta `prepare`: ele reduz cada arquivo a TypeScript que o checker consegue ler e diz de onde veio cada posição, para que toda mensagem aponte para o arquivo do autor. O front end Vue faz isso com o parser do próprio Vue (`vue/compiler-sfc`).

`frontends/typescript.mjs` é a parte que os formatos compartilham quando suas expressões são TypeScript, como as do React, do Svelte, do Solid e do Angular: tipos de registro, expressões, instruções, handlers e as propriedades dos primitivos do Mavis, lidos dos nós do checker. Um front end entrega a ele um dialeto, as poucas funções que dizem como o formato nomeia o estado do próprio componente (`state.count`, `count.value` ou `count`), e lê a sua própria sintaxe de view. O teste de um front end novo é o mesmo que o do Vue passa: a mesma tela em dois formatos produz o mesmo modelo e o mesmo Swift.

## Mesmo comportamento em todos os apps

O Vue gerado mantém o JavaScript do código-fonte. O SwiftUI gerado segue o JavaScript onde o Swift é diferente:

- Números são números do JavaScript (`Double` no Swift) e mostram os mesmos dígitos: `0.1 + 0.2` mostra `0.30000000000000004`, `1e21` mostra `1e+21`.
- `length` conta unidades UTF-16, como no JavaScript (`'👋🏽'.length` é 4).
- `trim`, `splice`, `slice` e `Math.round` seguem as regras do JavaScript, incluindo índices negativos e fora do intervalo.
- `lista[índice]` é `undefined` a menos que o índice seja um inteiro dentro da lista; `toSorted` é estável e trata `NaN` da função de comparação como igualdade.
- `<` e `>` entre strings comparam unidades UTF-16, como no JavaScript.

Cada fixture em `test/portable` executa a mesma sessão (cliques, digitação, Return, Escape, Tab, setas, checkboxes e escolhas de menu) no Vue gerado (Chromium e WebKit) e no app SwiftUI gerado (XCUITest no macOS) e compara, a cada passo, todos os textos visíveis, valores e mensagens dos campos e o campo com foco. Um passo também pode verificar o layout entre elementos indicados pelo `id`: as bordas de um elemento no seu contêiner, a ordem e o espaço entre irmãos, tamanhos iguais ou fixos, e em que linha fica um filho que quebrou, com uma unidade e meia de tolerância para as relações valerem entre renderizadores e fontes. Uma fixture cuja raiz é um `MScreen` ocupa a janela como os apps a mostram; os passos dela podem rolar o conteúdo da tela e conferir a cor que aparece num elemento contra uma cor do tema. `node scripts/check-portable-conformance.mjs --offscreen` repete no Mac, sem mostrar janela, as sessões que não precisam de teclado: organiza as views geradas em um único processo e lê a árvore de acessibilidade delas. Antes de cada clique, verifica que o teste de clique de acessibilidade no centro do controle alcança o controle, como o clique de um teste de interface exige. Os mesmos passos também rodam no app NativeScript gerado, num simulador iOS e num emulador Android, acionando as views reais; passos que precisam de teclado físico indicam o equivalente por toque (Discard em vez de Escape, o botão Select da linha em vez de uma seta). A comparação de texto ainda segue as regras de Unicode de cada plataforma: o Swift considera iguais strings canonicamente equivalentes. Várias fixtures existem duas vezes, em TSX e em arquivos Vue, e repetem um único `steps.json`, e outra cobre o que só os arquivos Vue têm: os arquivos Vue rodam como estão na Web e no NativeScript, e o Swift gerado a partir deles roda no Mac. O único passo com Escape roda ali pelo equivalente por toque, já que um arquivo Vue que também roda no NativeScript não tem como ouvir essa tecla. Um passo também pode apertar uma tecla no divisor de painéis redimensionáveis ou arrastá-lo; uma fixture feita disso (Home, End, Shift com uma seta, Return, um arraste) roda só no Chromium, no WebKit e no XCUITest, e a outra fixture de painéis ajusta o divisor um passo por vez em todos os runners, com os botões de passo no NativeScript. Um passo de rolagem rola a lista ou a região do cabeçalho que o passo nomeia, dentro da página.

Ainda não disponível: ícones, links (`href`), superfícies e regiões de movimento, itens de grade que ocupam mais de uma coluna, as demais propriedades dos campos, datas, seletores de arquivo, trabalho ou validação assíncronos, efeitos, navegação, persistência e os outros componentes do Mavis. `--add-native` e `--add-web` não migram esse projeto, e `--check-portability` informa sem alterar arquivos; Nuxt e `--example directory` são rejeitados nesse destino; `--example tasks` cria o [exemplo Tasks](./tasks-example).

Tipografia e layout seguem cada host, sem promessa de igualdade exata de pixels. O `.app` é para desenvolvimento local: assinatura, notarização, instalador e distribuição na App Store não estão configurados.

O [exemplo Tasks](./tasks-example) junta tudo isso em um app pequeno. O modelo portátil mais amplo segue na [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
