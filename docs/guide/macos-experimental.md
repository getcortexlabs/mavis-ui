---
title: Shared screens for Web, Native and Mac
description: Write shared TSX screens once and generate Vue for the Web, Vue for NativeScript on iOS and Android, and a native SwiftUI macOS app from them.
---

# Shared screens for Web, Native and Mac

An **opt-in compiler experiment**: screens written once in `shared/` generate Vue on the Web, Vue for NativeScript on iOS and Android, and SwiftUI on macOS. It does not extend the 92-component renderer to macOS or convert existing `.vue` screens.

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.13 first-light --target macos --yes
cd first-light
npm install
npm run macos
```

RC.12.2 created the first version of this starter (Web + Mac, four primitives, literal state). RC.13 adds everything below, including Native, any combination of targets and Jolt on the Mac. A project with every target is created like this:

```sh
npx @getcortexlabs/create-mavis first-light --targets web,native,macos
```

Choose any combination with Mac in the wizard (Web, Native and Mac are a multi-select), or pass `--targets`; `--target macos` remains the Web + Mac starter. Add `--package-manager pnpm` or `--package-manager yarn` for matching commands and configuration. The Mac app requires **macOS 14+ and Xcode**, Native the NativeScript CLI and platform SDKs; the Web and generation also run on Linux and Windows.

## Shared sources

```text
shared/Welcome.lite.tsx, shared/TaskRow.lite.tsx, shared/types.ts
            │ Mavis portable compiler (type-checked with TypeScript)
            ├── apps/web/src/generated/*.vue → Vue + Vite + Mavis Web
            ├── apps/mobile/src/generated/*.vue → NativeScript-Vue + Mavis (iOS, Android)
            └── apps/macos/Sources/MavisDesktop/Generated/*.swift → SwiftUI + JoltSwiftUI (macOS)
```

Only the selected targets are written. Each `Name.lite.tsx` exports one component; lowercase `.ts` files hold shared record types. `Welcome` is the screen every app opens; `portability.entry` in `mavis.config.json` names another one, as the [Tasks example](./tasks-example) does. The files use [Mitosis](https://mitosis.builder.io/)'s component format (`useStore`, `Show`, `For`), but the Mavis compiler generates every output and Mitosis is not installed. The Mac app uses `@State`, `Text`, stacks and real `Button` controls, with no WebView or JavaScript runtime. Each app keeps its own state; this is source sharing, not synchronization between running apps.

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

| Command                   | Result                                                  |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev:web`         | Generate and start Vue/Vite                             |
| `npm run build:web`       | Generate and build Web                                  |
| `npm run generate`        | Type-check the shared sources and generate every target |
| `npm run ios` / `android` | Generate and run the NativeScript app                   |
| `npm run build:native`    | Generate and bundle the NativeScript JavaScript         |
| `npm run macos`           | Generate, compile and open the Mac app                  |
| `npm run build:macos`     | Compile `dist/first-light.app` without opening it       |
| `npm run build`           | Build every target                                      |

Use `pnpm run` or `yarn run` instead when chosen. `--doctor` checks the Mac toolchain and compiles the shared sources with the project's own compiler; it does not replace building the app.

## What the sources can use

| Area        | Supported                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives  | `MColumn`/`MRow` (`gap`, `padding` tokens, `label`, `onKeyDown`), `MGrid` (`gap`, `columns`, `minColumnWidth`), `MCard` (`gap`, `padding`, `tone`, `label`, `onClick`), `MText` (`variant`, `tone`, text and values), `MButton` (`text`, `variant`, `disabled`, `onClick`, `shortcut`)                                                                                                             |
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

Anything else stops generation with `file:line:column` before any output changes. Record types need a name (`type Task = { … }`), and `For` needs a key from the item, such as `key={task.id}`. To use a value that may be `undefined`, such as `list[index]` or `find(…)`, check it first: `if (task === undefined) return`, `if (task !== undefined) { … }` and `task === undefined ? … : task.title` narrow it in every output. `type` and `multiline` choose the native control, so write them as literals.

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
- `maxLength` counts UTF-16 units everywhere, and `readonly` keeps the value while still allowing selection and copying.
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

## Grids, cards and shortcuts

`MGrid` lays its children out in equal columns: as many as fit `minColumnWidth`, up to `columns`. A list beside its detail on a wide window becomes one column on a phone or a narrow page, with no breakpoints in the source. Assistive technology reads each cell as a whole, in source order.

`MCard` is the theme's card surface around a column of content; `tone` picks its background from the palette (`tone={selected ? 'primarySoft' : 'surface'}`). With `onClick` the whole card is one button, as a selectable row should be: it needs a `label`, which is what assistive technology reads, and it shows text only. Put buttons and fields outside it. The card presses through Jolt like a button.

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

`shortcut` gives an `MButton` a keyboard shortcut: `mod+` and a letter, or `mod+Enter`. `mod` is Command on the Mac and Control or Command on the Web, where the shortcut runs before the focused field sees the key, as a menu shortcut would. It is written as a literal, used once per file, and its button stays on screen: use `disabled` instead of hiding it in a `Show`, and the shortcut is disabled with it. Touch devices have no such keys, so nothing is generated for NativeScript; the button is still there. Browsers keep their own shortcuts for tabs and windows, which a page cannot take.

## Motion

Motion is declared in the source and runs through Jolt on every target. Buttons press by default. `<Show when={…} animate>` reveals its content and keeps leaving content until its exit finishes; `<For each={…} animate>` moves rows that enter, leave or change places. An animated `Show` sits directly in an `MColumn` or an `MCard`, and an animated `For` directly in an `MColumn` or `MRow`, outside other lists.

|                       | Web and Native                              | Mac                                                 |
| --------------------- | ------------------------------------------- | --------------------------------------------------- |
| Button and card press | Mavis press recipe through Jolt             | `joltMotion` with the theme's press scale           |
| `Show animate`        | `MReveal` (fade and rise in, fade out)      | `JoltPresence` with Jolt's `fadeInUp` and `fadeOut` |
| `For animate`         | A Mavis layout region keyed by the row keys | `joltLayout` keyed by the row keys                  |

Reduce Motion is respected on every target, including when it changes while the app is open, and leaving content is hidden from assistive technology. Clicking again mid-animation retargets: no stale row stays behind. On the Mac these JoltSwiftUI modifiers run on SwiftUI animation; there is no Jolt clock or resource to release when a window closes. JoltSwiftUI is a release candidate; the Mac app pins `jolt-swift` exactly.

## On iOS and Android

The NativeScript app renders the same generated Vue with Mavis on NativeScript: real `TextField`, `TextView` and buttons, no WebView. What differs is how people use a phone:

- **Keyboard.** Return runs `onSubmit` in a single-line field and adds a line in a multiline one, as on the Web. `onEscape`, a stack's `onKeyDown` and a button's `shortcut` are for hardware keyboards; they are left out of the NativeScript output, so give those actions a button too, as the examples do.
- **Focus.** Field references move focus and open the software keyboard. Rows keep focus and the text selection when the list reorders: NativeScript moves a row by removing and adding its view, and the generated list puts focus back.
- **Select.** `MSelect` opens a sheet with the options instead of a menu; the value, placeholder and messages are the same.

## Same behavior in every app

The Vue output keeps the source's JavaScript. The SwiftUI output follows JavaScript where Swift differs:

- Numbers are JavaScript numbers (`Double` in Swift), and their text shows the same digits: `0.1 + 0.2` shows `0.30000000000000004`, `1e21` shows `1e+21`.
- `length` counts UTF-16 units, as JavaScript does (`'👋🏽'.length` is 4).
- `trim`, `splice`, `slice` and `Math.round` follow the JavaScript rules, including negative and out-of-range indices.
- `list[index]` is `undefined` unless the index is a whole number inside the list; `toSorted` is stable and treats `NaN` from the compare function as equal.
- `<` and `>` on strings compare UTF-16 code units, as in JavaScript.

Every fixture in `test/portable` runs the same session (clicks, typing, Return, Escape, Tab, arrow keys, checkboxes and menu choices) in the generated Vue (Chromium and WebKit) and in the generated SwiftUI app (XCUITest on macOS), and compares every visible text, field value and message, and the focused field after each step. The same steps also run on the generated NativeScript app on an iOS simulator and an Android emulator, driving the real views; steps that need a hardware keyboard name their touch equivalent (Discard instead of Escape, a row's Select button instead of an arrow key). Text comparison still follows each platform's Unicode rules: Swift treats canonically equivalent strings as equal.

Not available yet: dates, file pickers, asynchronous work or validation, effects, navigation, persistence and the other Mavis components. `--add-native`, `--add-web` and the Vue portability auditor are not migrations for this project; `--example directory` and Nuxt are rejected for this target; `--example tasks` creates the [Tasks example](./tasks-example).

Typography and layout follow each host; exact pixel parity is not promised. The `.app` is for local development: signing, notarization, installers and App Store distribution are not configured.

The [Tasks example](./tasks-example) puts all of this together in one small app. The broader portable model is tracked in [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
