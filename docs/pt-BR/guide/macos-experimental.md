---
title: Telas compartilhadas para Web, Nativo e Mac
description: Escreva telas TSX compartilhadas uma vez e gere Vue para a Web, Vue para o NativeScript no iOS e Android e um app nativo SwiftUI para macOS a partir delas.
---

# Telas compartilhadas para Web, Nativo e Mac

Um **experimento opcional de compilação**: telas escritas uma vez em `shared/` geram Vue na Web, Vue para o NativeScript no iOS e Android e SwiftUI no macOS. Isso não leva os 92 componentes ao macOS nem converte telas `.vue` existentes.

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

| Área         | Suportado                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitivas   | `MColumn`/`MRow` (`gap`, `justify`, `align`, `wrap`, `label`, `onKeyDown`), `MGrid` (`gap`, `columns`, `minColumnWidth`), `MCard` (`gap`, `elevation`, `tone`, `label`, `onClick`, `disabled`), `MText` (`variant`, `tone`, `weight`, `align`, `as`, `wrap`, texto e valores), `MButton` (`text`, `variant` primary/secondary/ghost, `size`, `disabled`, `loading`, `loadingText`, `loadingIndicator`, `onClick`, `shortcut`) |
| Caixas       | Em `MColumn`, `MRow`, `MGrid` e `MCard`: `padding`, `paddingX`, `paddingY`, `radius`, `backgroundColor`, `width`, `height`, `grow`, `shrink`. `MText` e `MButton` aceitam `grow` e `shrink`. Toda primitiva aceita `id` e `accessibilityHidden`, e todas menos os campos, `accessibilityLabel`                                                                                                                                |
| Campos       | `MInput` (`label`, `value`, `onChange`, `placeholder`, `helperText`, `error`, `type` text/email/password, `multiline`, `rows`, `maxLength`, `disabled`, `readonly`, `onSubmit`, `onEscape`, `ref`), `MCheckbox` (`label`, `checked`, `onChange`, `indeterminate`, `helperText`, `disabled`), `MSelect` (`label`, `value`, `options`, `onChange`, `placeholder`, `helperText`, `error`, `disabled`)                            |
| Componentes  | Outros arquivos compartilhados, com propriedades tipadas e callbacks                                                                                                                                                                                                                                                                                                                                                          |
| Estado       | `useStore` com strings, números, booleanos, uniões de strings, tipos de registro nomeados e arrays; valores iniciais podem vir das propriedades                                                                                                                                                                                                                                                                               |
| Referências  | `const titleRef = useRef<MavisFieldRef>(null)` em um `MInput` com `ref={titleRef}`; ações chamam `titleRef.focus()` e `titleRef.blur()`                                                                                                                                                                                                                                                                                       |
| Getters      | `get nome(): Tipo { … }`: linhas `const` opcionais e depois `return`                                                                                                                                                                                                                                                                                                                                                          |
| Ações        | Métodos com parâmetros tipados: `=`, `+=`, `-=`, `++`, `--`, `if`/`else`, `return`, `push`, `unshift`, `splice`, chamadas a outras ações e callbacks                                                                                                                                                                                                                                                                          |
| Expressões   | Comparações entre números ou entre strings, `&&`, `\|\|`, `!`, ternários, aritmética, template literals, `?.`, `??`                                                                                                                                                                                                                                                                                                           |
| Texto        | `trim`, `toLowerCase`, `toUpperCase`, `includes`, `startsWith`, `endsWith`, `length`                                                                                                                                                                                                                                                                                                                                          |
| Arrays       | `filter`, `map`, `find`, `findIndex`, `some`, `every`, `includes`, `slice`, `join`, `toSorted`, `length`, `lista[índice]`                                                                                                                                                                                                                                                                                                     |
| Math         | `Math.min`, `max`, `floor`, `ceil`, `abs`, `round`                                                                                                                                                                                                                                                                                                                                                                            |
| Renderização | `<Show when else>`, `<For each>` com um campo `key` de cada item                                                                                                                                                                                                                                                                                                                                                              |

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

## Mesmo comportamento em todos os apps

O Vue gerado mantém o JavaScript do código-fonte. O SwiftUI gerado segue o JavaScript onde o Swift é diferente:

- Números são números do JavaScript (`Double` no Swift) e mostram os mesmos dígitos: `0.1 + 0.2` mostra `0.30000000000000004`, `1e21` mostra `1e+21`.
- `length` conta unidades UTF-16, como no JavaScript (`'👋🏽'.length` é 4).
- `trim`, `splice`, `slice` e `Math.round` seguem as regras do JavaScript, incluindo índices negativos e fora do intervalo.
- `lista[índice]` é `undefined` a menos que o índice seja um inteiro dentro da lista; `toSorted` é estável e trata `NaN` da função de comparação como igualdade.
- `<` e `>` entre strings comparam unidades UTF-16, como no JavaScript.

Cada fixture em `test/portable` executa a mesma sessão (cliques, digitação, Return, Escape, Tab, setas, checkboxes e escolhas de menu) no Vue gerado (Chromium e WebKit) e no app SwiftUI gerado (XCUITest no macOS) e compara, a cada passo, todos os textos visíveis, valores e mensagens dos campos e o campo com foco. Um passo também pode verificar o layout entre elementos indicados pelo `id`: as bordas de um elemento no seu contêiner, a ordem e o espaço entre irmãos, tamanhos iguais ou fixos, e em que linha fica um filho que quebrou, com uma unidade e meia de tolerância para as relações valerem entre renderizadores e fontes. `node scripts/check-portable-conformance.mjs --offscreen` repete no Mac, sem mostrar janela, as sessões que não precisam de teclado: organiza as views geradas em um único processo e lê a árvore de acessibilidade delas. Antes de cada clique, verifica que o teste de clique de acessibilidade no centro do controle alcança o controle, como o clique de um teste de interface exige. Os mesmos passos também rodam no app NativeScript gerado, num simulador iOS e num emulador Android, acionando as views reais; passos que precisam de teclado físico indicam o equivalente por toque (Discard em vez de Escape, o botão Select da linha em vez de uma seta). A comparação de texto ainda segue as regras de Unicode de cada plataforma: o Swift considera iguais strings canonicamente equivalentes.

Ainda não disponível: ícones, links (`href`), superfícies e regiões de movimento, itens de grade que ocupam mais de uma coluna, as demais propriedades dos campos, datas, seletores de arquivo, trabalho ou validação assíncronos, efeitos, navegação, persistência e os outros componentes do Mavis. `--add-native`, `--add-web` e o auditor Vue não migram esse projeto; Nuxt e `--example directory` são rejeitados nesse destino; `--example tasks` cria o [exemplo Tasks](./tasks-example).

Tipografia e layout seguem cada host, sem promessa de igualdade exata de pixels. O `.app` é para desenvolvimento local: assinatura, notarização, instalador e distribuição na App Store não estão configurados.

O [exemplo Tasks](./tasks-example) junta tudo isso em um app pequeno. O modelo portátil mais amplo segue na [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
