---
title: Tasks, um código-fonte para todos os destinos
description: Um gerenciador de tarefas escrito uma vez em TSX compartilhado e gerado como Vue para a Web, NativeScript-Vue para iOS e Android e um app nativo SwiftUI para Mac. Crie com create-mavis --example tasks.
---

# Tasks: um código-fonte para todos os destinos

Um pequeno gerenciador de tarefas escrito uma vez em `shared/` e gerado para cada destino que você escolher: Vue na Web, Vue para NativeScript no iOS e no Android e SwiftUI no Mac. É o segundo exemplo dos [projetos com TSX compartilhado](./macos-experimental), ao lado da tela básica de boas-vindas, e usa quase tudo o que esse compilador aceita: formulários, uma lista editável, uma grade responsiva, atalhos de teclado e movimento pelo Jolt.

```sh
npx @getcortexlabs/create-mavis my-tasks --targets web,native,macos --example tasks
cd my-tasks
npm run install:apps
npm run dev:web
npm run macos
```

Escolha qualquer combinação de destinos que inclua Mac, ou selecione **Tasks** no assistente. Sem Nativo, `npm install` basta. O exemplo está no código-fonte e sai com a próxima release; a RC.12.2 ainda não o tem.

## O que ele faz

- Uma lista de tarefas com os filtros **All**, **Open** e **Done** e suas contagens.
- Um formulário para a nova tarefa: título (obrigatório), notas e prioridade. Return no título adiciona; um título vazio mostra a mensagem e mantém o foco no campo.
- A tarefa selecionada ao lado da lista: concluir, renomear, editar as notas, mudar a prioridade e mover para cima ou para baixo. As edições vão direto para a lista, então a linha muda enquanto você digita.
- Excluir, com a vizinha na tela ficando selecionada.
- Um estado vazio, e outro quando um filtro esconde tudo.
- A seleção sobrevive aos filtros: o detalhe continua mostrando uma tarefa que o filtro atual esconde.

As tarefas ficam na memória durante a sessão. Não há persistência, sincronização, conta, datas nem notificações; isso é código do próprio app.

## Layout

A lista e o detalhe são duas células de um `MGrid` com `columns={2}` e `minColumnWidth={320}`: lado a lado no Mac e em uma janela larga do navegador, uma coluna só no celular ou em uma janela estreita, sem breakpoints no código. Cada linha é um `MCard` com `onClick`, então a linha inteira é um botão cujo rótulo diz o título, o estado, a prioridade e se está selecionada.

## Teclado

| Ação                                      | Mac | Web                     |
| ----------------------------------------- | --- | ----------------------- |
| Nova tarefa (foco no título)              | ⌘K  | Control ou Command + K  |
| Concluir ou reabrir a tarefa selecionada  | ⌘↩  | Control ou Command + ↩  |
| Excluir a tarefa selecionada              | ⌘D  | Control ou Command + D  |
| Selecionar a próxima ou a anterior        | ↓ ↑ | ↓ ↑ com a lista em foco |
| Adicionar a tarefa que está sendo escrita | ↩   | ↩ no título             |

Os atalhos pertencem aos três botões acima da lista (`shortcut="mod+k"`), então ficam desativados junto com eles quando nada está selecionado. No iOS e no Android os mesmos botões estão lá e não há atalhos.

## Movimento

As linhas entram, saem e trocam de lugar com `<For animate>` quando você adiciona, exclui, reordena ou muda o filtro; a marca **Done** da linha aparece e some com `<Show animate>`; botões e linhas reagem ao toque. Tudo roda pelo Jolt: Mavis Web e Mavis no NativeScript nesses destinos, JoltSwiftUI no Mac. Reduzir Movimento é respeitado em todos os destinos.

## O código

Quatro arquivos em `shared/`. `Tasks` é a tela que todos os apps abrem (`portability.entry` no `mavis.config.json`).

::: code-group

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/Tasks.lite.tsx [Tasks.lite.tsx]

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/TaskRow.lite.tsx [TaskRow.lite.tsx]

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/TaskDetail.lite.tsx [TaskDetail.lite.tsx]

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/types.ts [types.ts]

:::

## Gravações

Entrada real em velocidade original: os eventos de teclado e ponteiro de uma sessão automatizada, em inglês.

**Vue Web · Chromium · 1100 × 820 pixels CSS**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 1100 por 820 pixels CSS" src="/media/tasks-web.mp4" style="width:100%;max-width:880px;border-radius:16px"></video>

## Como é verificado

`test/portable/tasksExample` repete uma sessão sobre o código do próprio exemplo: criar três tarefas (com o atalho, Return, o botão e um erro de validação no caminho), concluir uma com o atalho e outra com o checkbox, mover a seleção com as setas, filtrar, reabrir uma tarefa para ela sair do filtro Done, editar a tarefa selecionada, reordenar com e sem filtro, excluir com o atalho e com o botão, chegar ao estado de filtro vazio e ao estado vazio, e começar de novo. Depois de cada passo, os textos visíveis, os nomes e a ordem das linhas, os valores e mensagens dos campos e o campo em foco precisam ser iguais.

A sessão passa no Vue gerado (Chromium e WebKit), no app SwiftUI gerado (XCUITest no macOS) e no app NativeScript gerado em um simulador iOS e em um emulador Android, onde os passos de atalho usam o botão e o passo de seta um toque na linha. A Web e o Mac rodam uma segunda vez com movimento reduzido.

## Limites

- Reordenar usa os botões **Move up** e **Move down**; não há arrastar para reordenar.
- A linha mostra só texto: um cartão que é um botão não pode conter um checkbox, então concluir uma tarefa fica no detalhe e no ⌘↩.
- A prioridade é um texto simples com três opções, e a lista mantém a ordem que você der; não há ordenação por prioridade.
- Tipografia e espaçamento seguem cada host; não há promessa de paridade de pixels.
- Verificado em simuladores, em um emulador e em um Mac, não em celulares físicos, e sem auditoria completa com VoiceOver ou TalkBack.
