---
title: Starter experimental para macOS
description: Escreva telas TSX compartilhadas uma vez e gere Vue/Vite e um app nativo SwiftUI para macOS a partir delas.
---

# Starter experimental para macOS

Um **experimento opcional de compilação**: telas escritas uma vez em `shared/` geram Vue na Web e SwiftUI no macOS. Isso não leva os 92 componentes ao macOS nem converte telas `.vue` existentes.

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.12.2 first-light --target macos --yes
cd first-light
npm install
npm run macos
```

A RC.12.2 cria a primeira versão deste starter (quatro primitivas, estado literal). O compilador descrito abaixo, com componentes compartilhados, estado tipado, formulários, listas e condicionais, está no código-fonte e sai na próxima versão.

Escolha **macOS + Web · experimental** no assistente ou use `--target macos`. Acrescente `--package-manager pnpm` ou `--package-manager yarn` para gerar os comandos e configurações correspondentes. A compilação nativa exige **macOS 14+ e Xcode**; Web e geração também funcionam em outros sistemas.

## Código compartilhado

```text
shared/Welcome.lite.tsx, shared/TaskRow.lite.tsx, shared/types.ts
            │ Compilador portátil do Mavis (checado com TypeScript)
            ├── web/generated/*.vue → Vue + Vite + Mavis Web
            └── native/Sources/MavisDesktop/Generated/*.swift → SwiftUI / macOS
```

Cada `Nome.lite.tsx` exporta um componente; arquivos `.ts` em minúsculas guardam tipos de registro compartilhados. `Welcome` é a tela que os dois apps abrem. Os arquivos usam o formato de componente do [Mitosis](https://mitosis.builder.io/) (`useStore`, `Show`, `For`), mas quem gera as duas saídas é o compilador do Mavis, e o Mitosis não é instalado. O app nativo usa `@State`, `Text`, stacks e controles `Button` reais, sem WebView nem runtime JavaScript. Cada app mantém seu próprio estado: compartilhamos o código, não os dados entre apps abertos.

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

| Comando               | Resultado                                          |
| --------------------- | -------------------------------------------------- |
| `npm run dev:web`     | Gera e abre o servidor Vue/Vite                    |
| `npm run build:web`   | Gera e compila a Web                               |
| `npm run generate`    | Checa os tipos do código compartilhado e gera tudo |
| `npm run macos`       | Gera, compila e abre o app nativo                  |
| `npm run build:macos` | Compila `dist/first-light.app` sem abrir           |

Use `pnpm run` ou `yarn run` se esse foi o gerenciador escolhido. `--doctor` verifica as ferramentas do Mac e compila o código compartilhado com o compilador do próprio projeto; não substitui o build do app.

## O que o código pode usar

| Área         | Suportado                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitivas   | `MColumn`/`MRow` (tokens de `gap` e `padding`, `label`, `onKeyDown`), `MText` (`variant`, `tone`, texto e valores), `MButton` (`text`, `variant`, `disabled`, `onClick`)                                                                                                                                                                                                                           |
| Campos       | `MInput` (`label`, `value`, `onChange`, `placeholder`, `helperText`, `error`, `type` text/email/password, `multiline`, `rows`, `maxLength`, `disabled`, `readonly`, `onSubmit`, `onEscape`, `ref`), `MCheckbox` (`label`, `checked`, `onChange`, `indeterminate`, `helperText`, `disabled`), `MSelect` (`label`, `value`, `options`, `onChange`, `placeholder`, `helperText`, `error`, `disabled`) |
| Componentes  | Outros arquivos compartilhados, com propriedades tipadas e callbacks                                                                                                                                                                                                                                                                                                                               |
| Estado       | `useStore` com strings, números, booleanos, uniões de strings, tipos de registro nomeados e arrays; valores iniciais podem vir das propriedades                                                                                                                                                                                                                                                    |
| Referências  | `const titleRef = useRef<MavisFieldRef>(null)` em um `MInput` com `ref={titleRef}`; ações chamam `titleRef.focus()` e `titleRef.blur()`                                                                                                                                                                                                                                                            |
| Getters      | `get nome(): Tipo { … }`: linhas `const` opcionais e depois `return`                                                                                                                                                                                                                                                                                                                               |
| Ações        | Métodos com parâmetros tipados: `=`, `+=`, `-=`, `++`, `--`, `if`/`else`, `return`, `push`, `unshift`, `splice`, chamadas a outras ações e callbacks                                                                                                                                                                                                                                               |
| Expressões   | Comparações entre números ou entre strings, `&&`, `\|\|`, `!`, ternários, aritmética, template literals, `?.`, `??`                                                                                                                                                                                                                                                                                |
| Texto        | `trim`, `toLowerCase`, `toUpperCase`, `includes`, `startsWith`, `endsWith`, `length`                                                                                                                                                                                                                                                                                                               |
| Arrays       | `filter`, `map`, `find`, `findIndex`, `some`, `every`, `includes`, `slice`, `join`, `toSorted`, `length`, `lista[índice]`                                                                                                                                                                                                                                                                          |
| Math         | `Math.min`, `max`, `floor`, `ceil`, `abs`, `round`                                                                                                                                                                                                                                                                                                                                                 |
| Renderização | `<Show when else>`, `<For each>` com um campo `key` de cada item                                                                                                                                                                                                                                                                                                                                   |

Qualquer outra coisa interrompe a geração com `arquivo:linha:coluna`, antes de mudar qualquer saída. Tipos de registro precisam de nome (`type Task = { … }`) e o `For` precisa de uma chave vinda do item, como `key={task.id}`. Para usar um valor que pode ser `undefined`, como `lista[índice]` ou `find(…)`, verifique antes: `if (task === undefined) return`, `if (task !== undefined) { … }` e `task === undefined ? … : task.title` estreitam o tipo nas duas saídas. `type` e `multiline` escolhem o controle nativo, por isso são escritos como literais.

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
- `maxLength` conta unidades UTF-16 nos dois, e `readonly` mantém o valor e ainda permite selecionar e copiar.
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

## Mesmo comportamento nos dois apps

O Vue gerado mantém o JavaScript do código-fonte. O SwiftUI gerado segue o JavaScript onde o Swift é diferente:

- Números são números do JavaScript (`Double` no Swift) e mostram os mesmos dígitos: `0.1 + 0.2` mostra `0.30000000000000004`, `1e21` mostra `1e+21`.
- `length` conta unidades UTF-16, como no JavaScript (`'👋🏽'.length` é 4).
- `trim`, `splice`, `slice` e `Math.round` seguem as regras do JavaScript, incluindo índices negativos e fora do intervalo.
- `lista[índice]` é `undefined` a menos que o índice seja um inteiro dentro da lista; `toSorted` é estável e trata `NaN` da função de comparação como igualdade.
- `<` e `>` entre strings comparam unidades UTF-16, como no JavaScript.

Cada fixture em `test/portable` executa a mesma sessão (cliques, digitação, Return, Escape, Tab, setas, checkboxes e escolhas de menu) no Vue gerado (Chromium e WebKit) e no app SwiftUI gerado (XCUITest no macOS) e compara, a cada passo, todos os textos visíveis, valores e mensagens dos campos e o campo com foco. A comparação de texto ainda segue as regras de Unicode de cada plataforma: o Swift considera iguais strings canonicamente equivalentes.

Ainda não disponível: datas, seletores de arquivo, trabalho ou validação assíncronos, efeitos, navegação, persistência e os outros componentes do Mavis. `--add-native`, `--add-web` e o auditor Vue não migram esse projeto; Nuxt e `--example directory` são rejeitados nesse destino.

Os botões Web usam Mavis/Jolt. No Mac, o feedback usa SwiftUI e respeita Reduzir Movimento; **as telas geradas ainda não usam o Jolt**. O Jolt 0.1.0-rc.13 inclui um pacote SwiftUI; a adoção aqui está na [#315](https://github.com/getcortexlabs/mavis-ui/issues/315). Tipografia e layout seguem cada host, sem promessa de igualdade exata de pixels. O `.app` é para desenvolvimento local: assinatura, notarização, instalador e distribuição na App Store não estão configurados.

Os próximos passos são movimento com o JoltSwiftUI ([#315](https://github.com/getcortexlabs/mavis-ui/issues/315)), um exemplo de tarefas ([#318](https://github.com/getcortexlabs/mavis-ui/issues/318)), as mesmas telas no iOS e Android ([#316](https://github.com/getcortexlabs/mavis-ui/issues/316)) e escolher Web, Nativo e Mac juntos no criador ([#317](https://github.com/getcortexlabs/mavis-ui/issues/317)). O modelo portátil mais amplo segue na [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
