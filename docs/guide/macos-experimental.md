---
title: Experimental macOS starter
description: Write shared TSX screens once and generate Vue/Vite and a native SwiftUI macOS app from them.
---

# Experimental macOS starter

An **opt-in compiler experiment**: screens written once in `shared/` generate Vue on the Web and SwiftUI on macOS. It does not extend the 92-component renderer to macOS or convert existing `.vue` screens.

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.12.2 first-light --target macos --yes
cd first-light
npm install
npm run macos
```

RC.12.2 creates the first version of this starter (four primitives, literal state). The compiler described below, with shared components, typed state, forms, lists and conditionals, is in the source checkout and ships with the next release.

Choose **macOS + Web · experimental** in the wizard, or use `--target macos`. Add `--package-manager pnpm` or `--package-manager yarn` for matching commands and configuration. Native compilation requires **macOS 14+ and Xcode**; Web and generation also run on other hosts.

## Shared sources

```text
shared/Welcome.lite.tsx, shared/TaskRow.lite.tsx, shared/types.ts
            │ Mavis portable compiler (type-checked with TypeScript)
            ├── web/generated/*.vue → Vue + Vite + Mavis Web
            └── native/Sources/MavisDesktop/Generated/*.swift → SwiftUI / macOS
```

Each `Name.lite.tsx` exports one component; lowercase `.ts` files hold shared record types. `Welcome` is the screen both apps open. The files use [Mitosis](https://mitosis.builder.io/)'s component format (`useStore`, `Show`, `For`), but the Mavis compiler generates both outputs and Mitosis is not installed. The native app uses `@State`, `Text`, stacks and real `Button` controls, with no WebView or JavaScript runtime. Each app keeps its own state; this is source sharing, not synchronization between running apps.

```tsx
import { useStore, Show, For } from '@builder.io/mitosis'
import type { Task } from './types'
import TaskRow from './TaskRow.lite'

export default function Welcome() {
  const state = useStore({
    tasks: [{ id: 'a', title: 'Write', done: false }] as Task[],
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
      <MText variant="title">{state.open} open</MText>
      <Show when={state.tasks.length > 0} else={<MText tone="muted">Nothing yet</MText>}>
        <For each={state.tasks}>
          {(task) => <TaskRow key={task.id} task={task} onToggle={(id) => state.toggle(id)} />}
        </For>
      </Show>
    </MColumn>
  )
}
```

Run `npm run generate` after editing; startup and build commands regenerate too. While Vite is running, generate again and Vite reloads. Rebuild or reopen the Mac app for native changes. Generated folders are replaced on every run; don't edit them. `tsconfig.json` and the generated `mavis-env.d.ts` let your editor check `shared/` the same way.

| Command               | Result                                            |
| --------------------- | ------------------------------------------------- |
| `npm run dev:web`     | Generate and start Vue/Vite                       |
| `npm run build:web`   | Generate and build Web                            |
| `npm run generate`    | Type-check the shared sources and generate both   |
| `npm run macos`       | Generate, compile and open the native app         |
| `npm run build:macos` | Compile `dist/first-light.app` without opening it |

Use `pnpm run` or `yarn run` instead when chosen. `--doctor` checks the Mac toolchain and compiles the shared sources with the project's own compiler; it does not replace building the app.

## What the sources can use

| Area        | Supported                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives  | `MColumn`/`MRow` (`gap`, `padding` tokens, `label`, `onKeyDown`), `MText` (`variant`, `tone`, text and values), `MButton` (`text`, `variant`, `disabled`, `onClick`)                                                                                                                                                                                                                               |
| Fields      | `MInput` (`label`, `value`, `onChange`, `placeholder`, `helperText`, `error`, `type` text/email/password, `multiline`, `rows`, `maxLength`, `disabled`, `readonly`, `onSubmit`, `onEscape`, `ref`), `MCheckbox` (`label`, `checked`, `onChange`, `indeterminate`, `helperText`, `disabled`), `MSelect` (`label`, `value`, `options`, `onChange`, `placeholder`, `helperText`, `error`, `disabled`) |
| Components  | Other shared files, with typed properties and callback properties                                                                                                                                                                                                                                                                                                                                  |
| State       | `useStore` with strings, numbers, booleans, string unions, named record types and arrays; initial values can come from properties                                                                                                                                                                                                                                                                  |
| References  | `const titleRef = useRef<MavisFieldRef>(null)` on one `MInput` with `ref={titleRef}`; actions call `titleRef.focus()` and `titleRef.blur()`                                                                                                                                                                                                                                                        |
| Getters     | `get name(): Type { … }`: optional `const` lines, then `return`                                                                                                                                                                                                                                                                                                                                    |
| Actions     | Methods with typed parameters: `=`, `+=`, `-=`, `++`, `--`, `if`/`else`, `return`, `push`, `unshift`, `splice`, calls to other actions and callbacks                                                                                                                                                                                                                                               |
| Expressions | Comparisons of numbers or of strings, `&&`, `\|\|`, `!`, ternaries, arithmetic, template literals, `?.`, `??`                                                                                                                                                                                                                                                                                      |
| Text        | `trim`, `toLowerCase`, `toUpperCase`, `includes`, `startsWith`, `endsWith`, `length`                                                                                                                                                                                                                                                                                                               |
| Arrays      | `filter`, `map`, `find`, `findIndex`, `some`, `every`, `includes`, `slice`, `join`, `toSorted`, `length`, `list[index]`                                                                                                                                                                                                                                                                            |
| Math        | `Math.min`, `max`, `floor`, `ceil`, `abs`, `round`                                                                                                                                                                                                                                                                                                                                                 |
| Rendering   | `<Show when else>`, `<For each>` with a `key` field of each item                                                                                                                                                                                                                                                                                                                                   |

Anything else stops generation with `file:line:column` before either output changes. Record types need a name (`type Task = { … }`), and `For` needs a key from the item, such as `key={task.id}`. To use a value that may be `undefined`, such as `list[index]` or `find(…)`, check it first: `if (task === undefined) return`, `if (task !== undefined) { … }` and `task === undefined ? … : task.title` narrow it in both outputs. `type` and `multiline` choose the native control, so write them as literals.

## Forms

Fields are controlled: the source keeps the value and a change handler sets it. Validation is a getter, and an action can move focus to the first invalid field.

```tsx
import { useStore, useRef } from '@builder.io/mitosis'

export default function NewTask() {
  const titleRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    title: '',
    priority: undefined as string | undefined,
    submitted: false,
    priorities: [
      { value: 'low', label: 'Low' },
      { value: 'high', label: 'High' },
    ] as SelectOption[],
    get titleError(): string {
      return state.submitted && state.title.trim() === '' ? 'Enter a title' : ''
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
        label="Title"
        ref={titleRef}
        value={state.title}
        onChange={(value) => (state.title = value)}
        error={state.titleError}
        onSubmit={() => state.save()}
      />
      <MSelect
        label="Priority"
        value={state.priority}
        options={state.priorities}
        onChange={(value) => (state.priority = value)}
        placeholder="Choose one"
      />
      <MButton text="Save" onClick={() => state.save()} />
    </MColumn>
  )
}
```

The Web uses Mavis Web's `MInput`, `MCheckbox` and `MSelect`. macOS uses `TextField`, `SecureField` or `TextEditor` (with the label as their accessibility name), a checkbox `Toggle` that shows the mixed state of `indeterminate`, and a menu `Picker` whose placeholder is an explicit empty choice while `value` is `undefined`. Both draw the field label, message and the Mavis focus border from the theme tokens.

- **Return** in a single-line field runs `onSubmit`; in a multiline field it adds a line. **Escape** runs `onEscape`.
- **Tab** and **Shift-Tab** follow the source order. On macOS, Tab inside a multiline field types a tab, as in other Mac apps; Control-Tab moves on.
- `maxLength` counts UTF-16 units on both, and `readonly` keeps the value while still allowing selection and copying.
- `type="email"` turns off autocorrection on macOS; macOS has no email keyboard. Like the Web input, a field shows its own text until the source changes the value.

## Lists

Keep the selection in state by key, so it survives filtering, sorting and reordering. A stack with a `label` and `onKeyDown` receives the arrow keys while it or one of its rows has focus: on the Web it is a focusable group, on macOS it is in the Tab order and takes focus when clicked. Text fields keep their own arrow keys.

```tsx
<MColumn gap="sm" label="Tasks" onKeyDown={(key) => state.step(key)}>
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

Rows keep their state, focus and text selection when other rows are added or removed, when the list is filtered, and when a row moves, including the row being edited when a sort depends on its text. SwiftUI keeps the row by its key. On the Web, Vue moves rows with `insertBefore`, which drops focus in browsers, so the generated list moves the focused row with `moveBefore` where the browser has it and otherwise puts focus and the selection back.

On macOS, buttons join the Tab order only when keyboard navigation is turned on in System Settings, as in other Mac apps. Without it, Tab moves between fields and lists, and the arrow keys move the selection.

## Same behavior in both apps

The Vue output keeps the source's JavaScript. The SwiftUI output follows JavaScript where Swift differs:

- Numbers are JavaScript numbers (`Double` in Swift), and their text shows the same digits: `0.1 + 0.2` shows `0.30000000000000004`, `1e21` shows `1e+21`.
- `length` counts UTF-16 units, as JavaScript does (`'👋🏽'.length` is 4).
- `trim`, `splice`, `slice` and `Math.round` follow the JavaScript rules, including negative and out-of-range indices.
- `list[index]` is `undefined` unless the index is a whole number inside the list; `toSorted` is stable and treats `NaN` from the compare function as equal.
- `<` and `>` on strings compare UTF-16 code units, as in JavaScript.

Every fixture in `test/portable` runs the same session (clicks, typing, Return, Escape, Tab, arrow keys, checkboxes and menu choices) in the generated Vue (Chromium and WebKit) and in the generated SwiftUI app (XCUITest on macOS), and compares every visible text, field value and message, and the focused field after each step. Text comparison still follows each platform's Unicode rules: Swift treats canonically equivalent strings as equal.

Not available yet: dates, file pickers, asynchronous work or validation, effects, navigation, persistence and the other Mavis components. `--add-native`, `--add-web` and the Vue portability auditor are not migrations for this project; `--example directory` and Nuxt are rejected for this target.

Web buttons use Mavis/Jolt. Native button feedback uses SwiftUI and respects Reduce Motion; **the generated screens do not use Jolt yet**. Jolt 0.1.0-rc.13 ships a SwiftUI package; adopting it here is tracked in [#315](https://github.com/getcortexlabs/mavis-ui/issues/315). Typography and layout follow each host; exact pixel parity is not promised. The `.app` is for local development: signing, notarization, installers and App Store distribution are not configured.

The next steps are motion through JoltSwiftUI ([#315](https://github.com/getcortexlabs/mavis-ui/issues/315)), a Tasks example ([#318](https://github.com/getcortexlabs/mavis-ui/issues/318)), the same screens on iOS and Android ([#316](https://github.com/getcortexlabs/mavis-ui/issues/316)) and choosing Web, Native and Mac together in the creator ([#317](https://github.com/getcortexlabs/mavis-ui/issues/317)). The broader portable model is tracked in [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
