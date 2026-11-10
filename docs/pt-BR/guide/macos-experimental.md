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

A RC.12.2 cria a primeira versão deste starter (quatro primitivas, estado literal). O compilador descrito abaixo, com componentes compartilhados, estado tipado, listas e condicionais, está no código-fonte e sai na próxima versão.

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

| Área         | Suportado                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitivas   | `MColumn`/`MRow` (tokens de `gap` e `padding`), `MText` (`variant`, `tone`, texto e valores), `MButton` (`text`, `variant`, `disabled`, `onClick`)   |
| Componentes  | Outros arquivos compartilhados, com propriedades tipadas e callbacks                                                                                 |
| Estado       | `useStore` com strings, números, booleanos, uniões de strings, tipos de registro nomeados e arrays; valores iniciais podem vir das propriedades      |
| Getters      | `get nome(): Tipo { … }`: linhas `const` opcionais e depois `return`                                                                                 |
| Ações        | Métodos com parâmetros tipados: `=`, `+=`, `-=`, `++`, `--`, `if`/`else`, `return`, `push`, `unshift`, `splice`, chamadas a outras ações e callbacks |
| Expressões   | Comparações, `&&`, `\|\|`, `!`, ternários, aritmética, template literals, `?.`, `??`                                                                 |
| Texto        | `trim`, `toLowerCase`, `toUpperCase`, `includes`, `startsWith`, `endsWith`, `length`                                                                 |
| Arrays       | `filter`, `map`, `find`, `findIndex`, `some`, `every`, `includes`, `slice`, `join`, `length`                                                         |
| Math         | `Math.min`, `max`, `floor`, `ceil`, `abs`, `round`                                                                                                   |
| Renderização | `<Show when else>`, `<For each>` com um campo `key` de cada item                                                                                     |

Qualquer outra coisa interrompe a geração com `arquivo:linha:coluna`, antes de mudar qualquer saída. Tipos de registro precisam de nome (`type Task = { … }`) e o `For` precisa de uma chave vinda do item, como `key={task.id}`. Para usar um valor que pode ser `undefined`, verifique antes: `if (task === undefined) return` e `if (task !== undefined) { … }` estreitam o tipo nas duas saídas.

## Mesmo comportamento nos dois apps

O Vue gerado mantém o JavaScript do código-fonte. O SwiftUI gerado segue o JavaScript onde o Swift é diferente:

- Números são números do JavaScript (`Double` no Swift) e mostram os mesmos dígitos: `0.1 + 0.2` mostra `0.30000000000000004`, `1e21` mostra `1e+21`.
- `length` conta unidades UTF-16, como no JavaScript (`'👋🏽'.length` é 4).
- `trim`, `splice`, `slice` e `Math.round` seguem as regras do JavaScript, incluindo índices negativos e fora do intervalo.

Cada fixture em `test/portable` executa os mesmos cliques no Vue gerado (Chromium e WebKit) e no app SwiftUI gerado (XCUITest no macOS) e compara todos os textos visíveis a cada passo. A comparação de texto ainda segue as regras de Unicode de cada plataforma: o Swift considera iguais strings canonicamente equivalentes.

Ainda não disponível: inputs e formulários ([#313](https://github.com/getcortexlabs/mavis-ui/issues/313)), acesso por índice como `lista[0]`, trabalho assíncrono, efeitos, navegação, persistência e os outros componentes do Mavis. `--add-native`, `--add-web` e o auditor Vue não migram esse projeto; Nuxt e `--example directory` são rejeitados nesse destino.

Os botões Web usam Mavis/Jolt. No Mac, o feedback usa SwiftUI e respeita Reduzir Movimento; **as telas geradas ainda não usam o Jolt**. O Jolt 0.1.0-rc.13 inclui um pacote SwiftUI; a adoção aqui está na [#315](https://github.com/getcortexlabs/mavis-ui/issues/315). Tipografia e layout seguem cada host, sem promessa de igualdade exata de pixels. O `.app` é para desenvolvimento local: assinatura, notarização, instalador e distribuição na App Store não estão configurados.

Os próximos passos são edição e seleção em listas ([#314](https://github.com/getcortexlabs/mavis-ui/issues/314)), as mesmas telas no iOS e Android ([#316](https://github.com/getcortexlabs/mavis-ui/issues/316)) e escolher Web, Nativo e Mac juntos no criador ([#317](https://github.com/getcortexlabs/mavis-ui/issues/317)). O modelo portátil mais amplo segue na [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
