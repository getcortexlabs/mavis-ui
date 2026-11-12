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

| Área         | Suportado                                                                                                                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Script       | `<script setup lang="ts">`. `const nome = ref(valor)` é estado, `computed(() => …)` um valor derivado (uma expressão, ou linhas `const` e um `return`), uma `function` ou arrow function entre chaves uma ação, e qualquer outro `const` uma constante                                                             |
| Propriedades | `defineProps<{ … }>()` com os tipos no próprio arquivo, lidas como `props.nome` no script e pelo nome no template. `withDefaults` dá valores padrão literais; uma propriedade marcada com `?` pode ser omitida pelo pai (um booleano vira `false`, o resto fica ausente)                                           |
| Eventos      | `defineEmits<{ saved: [id: string] }>()`, enviados com `emit('saved', id)` ou `$emit` no template e ouvidos com `@saved`. Um evento que ninguém ouve não vai a lugar nenhum                                                                                                                                        |
| Campos       | `v-model` em `MInput`, `MCheckbox` e `MSelect`, ou `:modelValue` com `@update:modelValue`; `@submit` no `MInput`. `const titleRef = ref<InputHandle \| null>(null)` com `ref="titleRef"` em um `MInput` permite que uma função chame `titleRef.value?.focus()` e `blur()`                         |
| Template     | Os nove primitivos, como `MButton` ou `m-button`, com as propriedades das tabelas acima nos nomes do Vue: `accessibilityLabel`, `@click` no `MButton`, `interactive` com `@click` no `MCard`, texto como conteúdo ou `text`. `v-if`, `v-else-if`, `v-else`, `v-for` com `:key` (no elemento ou em um `<template>`) |
| Listeners    | O nome de uma função (`@click="save"`), uma arrow function, ou instruções com `$event` (`@click="count++"`, `@update:modelValue="title = $event.trim()"`)                                                                                                                                                          |
| Movimento    | `<MReveal :show="…">` diretamente em um `MColumn` ou `MCard`, onde o TSX escreve `<Show animate>`; com mais de um filho, recebe o mesmo `gap` do stack em volta                                                                                                                                                    |
| Componentes  | `import TaskRow from './TaskRow.vue'` com suas propriedades e eventos                                                                                                                                                                                                                                              |
| Valores      | Tudo o que está nas linhas Expressões, Texto, Arrays e Math acima. `null` é um valor ausente, como `undefined`: `ref<string \| null>(null)` e `valor === null` funcionam, e um tipo usa um dos dois, não ambos                                                                                                     |
| Condições    | Onde o JavaScript lê um valor como condição, o Mac também lê: um texto é verdadeiro quando não está vazio, um registro ou uma lista ausente é falso, e `lista.length` é verdadeiro acima de zero. `a \|\| b` escolhe o primeiro texto que não está vazio. Compare os outros números (`count > 0`)                  |

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

### O que falha, e como

Um arquivo fora desse subconjunto interrompe a geração antes de qualquer saída ser escrita, com `arquivo:linha:coluna` no arquivo `.vue` e o nome da construção:

```text
shared/Edit.vue:2:25: watch from vue is not supported in shared screens for the Mac: effects are not part of the portable model yet.
shared/Detail.vue:14:7: <div> is an HTML element, which a shared screen cannot use on the Mac; shared screens use MColumn, MRow, MGrid, MCard, MText, MButton, MInput, MCheckbox, MSelect and MReveal.
shared/Detail.vue:9:3: document is browser DOM access, which a shared screen cannot use on the Mac. Keep it in the Web app.
shared/Row.vue:21:23: Type '"huge"' is not assignable to type '"primary" | "secondary" | "ghost" | undefined'.
```

Todos os arquivos são lidos antes de a geração falhar, então uma execução lista o primeiro problema de cada arquivo; um arquivo que mostra um componente com problema espera por ele. Os erros de tipo vêm do TypeScript, checados contra o que o Mac suporta, e não contra as propriedades mais amplas da Web.

Ainda não é lido para o Mac: `watch` e hooks de ciclo de vida, funções `async`, slots, `v-model` e `ref` em componentes compartilhados, `v-show`, `v-html`, `class`, `style` e `<style>`, modificadores de tecla e de evento como `@keydown.esc` e `@click.stop` (o NativeScript-Vue não os executa, então `onEscape`, o `onKeyDown` de um stack e o `shortcut` de um botão ainda não têm forma em Vue), `defineModel` e `defineProps` desestruturado, funções que retornam valor, listas animadas (`:motionRegion`), um tipo de propriedades importado de outro arquivo, e tudo o que não é um arquivo `.vue` compartilhado ou um import de tipos: stores, serviços e outros módulos `.ts` com valores ([#340](https://github.com/getcortexlabs/mavis-ui/issues/340)), navegação pelo router ([#341](https://github.com/getcortexlabs/mavis-ui/issues/341)), `useMavisTheme` ([#342](https://github.com/getcortexlabs/mavis-ui/issues/342)) e componentes além dos nove primitivos, incluindo o `MScreen`. Acesso ao DOM e ao NativeScript em um arquivo compartilhado é sempre um erro. Uma tela que usa essas coisas continua rodando na Web e no NativeScript; quem precisa esperar é o Mac.

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

Cada fixture em `test/portable` executa a mesma sessão (cliques, digitação, Return, Escape, Tab, setas, checkboxes e escolhas de menu) no Vue gerado (Chromium e WebKit) e no app SwiftUI gerado (XCUITest no macOS) e compara, a cada passo, todos os textos visíveis, valores e mensagens dos campos e o campo com foco. Um passo também pode verificar o layout entre elementos indicados pelo `id`: as bordas de um elemento no seu contêiner, a ordem e o espaço entre irmãos, tamanhos iguais ou fixos, e em que linha fica um filho que quebrou, com uma unidade e meia de tolerância para as relações valerem entre renderizadores e fontes. `node scripts/check-portable-conformance.mjs --offscreen` repete no Mac, sem mostrar janela, as sessões que não precisam de teclado: organiza as views geradas em um único processo e lê a árvore de acessibilidade delas. Antes de cada clique, verifica que o teste de clique de acessibilidade no centro do controle alcança o controle, como o clique de um teste de interface exige. Os mesmos passos também rodam no app NativeScript gerado, num simulador iOS e num emulador Android, acionando as views reais; passos que precisam de teclado físico indicam o equivalente por toque (Discard em vez de Escape, o botão Select da linha em vez de uma seta). A comparação de texto ainda segue as regras de Unicode de cada plataforma: o Swift considera iguais strings canonicamente equivalentes. Duas fixtures existem duas vezes, em TSX e em arquivos Vue, e repetem um único `steps.json`, e uma terceira cobre o que só os arquivos Vue têm: os arquivos Vue rodam como estão na Web e no NativeScript, e o Swift gerado a partir deles roda no Mac. O único passo com Escape roda ali pelo equivalente por toque, já que um arquivo Vue que também roda no NativeScript não tem como ouvir essa tecla.

Ainda não disponível: ícones, links (`href`), superfícies e regiões de movimento, itens de grade que ocupam mais de uma coluna, as demais propriedades dos campos, datas, seletores de arquivo, trabalho ou validação assíncronos, efeitos, navegação, persistência e os outros componentes do Mavis. `--add-native` e `--add-web` não migram esse projeto, e `--check-portability` informa sem alterar arquivos; Nuxt e `--example directory` são rejeitados nesse destino; `--example tasks` cria o [exemplo Tasks](./tasks-example).

Tipografia e layout seguem cada host, sem promessa de igualdade exata de pixels. O `.app` é para desenvolvimento local: assinatura, notarização, instalador e distribuição na App Store não estão configurados.

O [exemplo Tasks](./tasks-example) junta tudo isso em um app pequeno. O modelo portátil mais amplo segue na [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
