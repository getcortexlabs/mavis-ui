---
title: Shared screens for Web, Native and Mac
description: Write shared screens once, as TSX or as the Vue files your apps already run, and generate a native SwiftUI macOS app from them, with Vue for the Web and NativeScript.
---

# Shared screens for Web, Native and Mac

An **opt-in compiler experiment**: screens written once in `shared/` generate Vue on the Web, Vue for NativeScript on iOS and Android, and SwiftUI on macOS. It does not extend the 92-component renderer to macOS. Shared `.vue` screens that stay within the same subset are [read for the Mac as they are](#shared-vue-files), without a rewrite.

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

| Area        | Supported                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives  | `MColumn`/`MRow` (`gap`, `justify`, `align`, `wrap`, `label`, `onKeyDown`), `MGrid` (`gap`, `columns`, `minColumnWidth`), `MCard` (`gap`, `elevation`, `tone`, `label`, `onClick`, `disabled`), `MText` (`variant`, `tone`, `weight`, `align`, `as`, `wrap`, text and values), `MButton` (`text`, `variant` primary/secondary/ghost, `size`, `disabled`, `loading`, `loadingText`, `loadingIndicator`, `onClick`, `shortcut`) |
| Boxes       | On `MColumn`, `MRow`, `MGrid` and `MCard`: `padding`, `paddingX`, `paddingY`, `radius`, `backgroundColor`, `width`, `height`, `grow`, `shrink`. `MText` and `MButton` take `grow` and `shrink`. Every primitive takes `id` and `accessibilityHidden`, and all but the fields `accessibilityLabel`                                                                                                                             |
| Fields      | `MInput` (`label`, `value`, `onChange`, `placeholder`, `helperText`, `error`, `type` text/email/password, `multiline`, `rows`, `maxLength`, `disabled`, `readonly`, `onSubmit`, `onEscape`, `ref`), `MCheckbox` (`label`, `checked`, `onChange`, `indeterminate`, `helperText`, `disabled`), `MSelect` (`label`, `value`, `options`, `onChange`, `placeholder`, `helperText`, `error`, `disabled`)                            |
| Components  | Other shared files, with typed properties, callback properties and [slots](#slots)                                                                                                                                                                                                                                                                                                                                            |
| State       | `useStore` with strings, numbers, booleans, string unions, named record types and arrays; initial values can come from properties                                                                                                                                                                                                                                                                                             |
| References  | `const titleRef = useRef<MavisFieldRef>(null)` on one `MInput` with `ref={titleRef}`; actions call `titleRef.focus()` and `titleRef.blur()`                                                                                                                                                                                                                                                                                   |
| Getters     | `get name(): Type { … }`: optional `const` lines, then `return`                                                                                                                                                                                                                                                                                                                                                               |
| Actions     | Methods with typed parameters: `=`, `+=`, `-=`, `++`, `--`, `if`/`else`, `return`, `push`, `unshift`, `splice`, calls to other actions and callbacks                                                                                                                                                                                                                                                                          |
| Expressions | Comparisons of numbers or of strings, `&&`, `\|\|`, `!`, ternaries, arithmetic, template literals, `?.`, `??`                                                                                                                                                                                                                                                                                                                 |
| Text        | `trim`, `toLowerCase`, `toUpperCase`, `includes`, `startsWith`, `endsWith`, `length`                                                                                                                                                                                                                                                                                                                                          |
| Arrays      | `filter`, `map`, `find`, `findIndex`, `some`, `every`, `includes`, `slice`, `join`, `toSorted`, `length`, `list[index]`                                                                                                                                                                                                                                                                                                       |
| Math        | `Math.min`, `max`, `floor`, `ceil`, `abs`, `round`                                                                                                                                                                                                                                                                                                                                                                            |
| Rendering   | `<Show when else>`, `<For each>` with a `key` field of each item                                                                                                                                                                                                                                                                                                                                                              |

Anything else stops generation with `file:line:column` before any output changes. Record types need a name (`type Task = { … }`), and `For` needs a key from the item, such as `key={task.id}`. To use a value that may be `undefined`, such as `list[index]` or `find(…)`, check it first: `if (task === undefined) return`, `if (task !== undefined) { … }` and `task === undefined ? … : task.title` narrow it in every output. `type` and `multiline` choose the native control, so write them as literals.

## Layout

The primitives take the properties of the published Mavis contracts, with the same names, values and defaults, so a screen is laid out once for every target:

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

- `gap`, `padding`, `paddingX` and `paddingY` take a spacing token or a number; `paddingX` and `paddingY` each replace `padding` on their axis. `radius` takes a radius token or a number and rounds the `backgroundColor`.
- `justify` is `start`, `center`, `end`, `between` or `around`. `align` is `start`, `center`, `end` or `stretch`: a column stretches its children by default and a row centers them. `wrap` starts a new line when the next child does not fit.
- `width` and `height` take a number, a share of the container such as `"50%"`, or `"auto"`. `grow` shares the free space and `shrink` gives it up when there is too little: a row's children shrink by default, a column's do not.
- `MText` takes `weight`, `align` (`left`, `center`, `right`) and `wrap`; `as="h1"` to `as="h6"` makes it a heading for assistive technology. Without `as`, the Mac still reads the `display`, `title` and `heading` variants as headings.
- `id` names an element for tests and tools: the DOM `id`, the NativeScript view's `id` and the accessibility identifier on the Mac. `accessibilityLabel` is what assistive technology reads instead of the content, and `accessibilityHidden` hides the element from it.

On the Web and in NativeScript these properties go to the Mavis components unchanged. On the Mac, `MColumn` and `MRow` are a SwiftUI `Layout` in the generated runtime (`MavisFlex`) that follows the same flexbox rules instead of approximating them with stacks and spacers: a child starts at its `width` or `height` or at its content's size, free space goes to the children that grow, a shortage comes out of those that shrink, a share resolves against the stack's own size, and `gap` separates wrapped lines too. A button placed directly in a column is therefore as wide as the column, as on the Web; put it in an `MRow` to keep its own width.

Written as literals, because each target resolves them when the screen is compiled: a share such as `"50%"`, and `as`. `backgroundColor` is a hex color, `#RGB` or `#RRGGBB`, which every target reads the same way.

On the Mac, the `id` of a text, a button or a field is its accessibility identifier. The `id` of a container (`MColumn`, `MRow`, `MGrid`, or an `MCard` without `onClick`) adds nothing to the app people use: an accessibility element over a container would take the hit test from the controls inside it, and SwiftUI merges a container element with the only container inside it. A UI test that needs a container's bounds launches the app with the environment variable `MAVIS_TEST_IDENTIFIERS=1`. The container then marks its top-leading and bottom-trailing corners with two clear one-point elements that carry the identifier, and its frame is the union of the elements with that identifier. Match the identifier exactly, with a predicate such as `identifier == %@`: XCUITest's `matching(identifier:)` also matches an element whose label is the same text.

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

`MCard` is the theme's card surface around a column of content; `tone` picks its background from the palette (`tone={selected ? 'primarySoft' : 'surface'}`), `elevation` its shadow, and the box properties its padding, radius and size. With `onClick` the whole card is one button, as a selectable row should be: it needs a `label`, which is what assistive technology reads, and it shows text only. Put buttons and fields outside it. The card presses through Jolt like a button, and `disabled` turns the press off.

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

An `MButton` has the theme's three control sizes (`size="sm"`, `"md"` or `"lg"`) and three variants: `primary`, `secondary` and `ghost`, which has no background. While `loading` is true it shows `loadingText` (`Loading…` unless set) and takes neither clicks nor its shortcut. `loadingIndicator` adds Jolt's `dots`, `bars` or `ring` before the text: Mavis draws it on the Web and on iOS, the Mac uses JoltSwiftUI's `JoltLoaderView`, and Android shows the text alone.

`shortcut` gives an `MButton` a keyboard shortcut: `mod+` and a letter, a digit or `Enter`, or a function key from `F1` to `F12`, alone or with `mod+`. `mod` is Command on the Mac and Control or Command on the Web, where the shortcut runs before the focused field sees the key, as a menu shortcut would. It is written as a literal, used once per file, and its button stays on screen: use `disabled` instead of hiding it in a `Show`, and the shortcut is disabled with it. Touch devices have no such keys, so nothing is generated for NativeScript; the button is still there. Browsers keep their own shortcuts for tabs and windows, which a page cannot take.

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

## Shared Vue files

A screen that already runs on Vue Web and NativeScript-Vue does not have to be rewritten as TSX to reach the Mac. Put `Name.vue` in `shared/`, next to the `.lite.tsx` files or instead of them. The Web and NativeScript apps import the file itself and run it unchanged; only the Mac needs generation. The compiler reads the file into the same model the TSX sources produce, and the Swift generator works from that model without knowing which format a screen came from.

```text
shared/Tasks.vue ───────────── imported as written ──→ apps/web, apps/mobile
       │ Vue front end (Vue's own compiler + TypeScript)
       ▼
  portable model ←── TSX front end ←── shared/Welcome.lite.tsx
       ├── Vue generator ──→ apps/web/src/generated, apps/mobile/src/generated (TSX sources)
       └── Swift generator ──→ apps/macos/Sources/MavisDesktop/Generated (every source)
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

const tasks = ref<Task[]>([{ id: 'a', title: 'Write', done: false }])
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
    <MText variant="title">{{ title }}: {{ open }} open</MText>
    <MInput v-model="draft" label="New task" @submit="add" />
    <MButton text="Add" :disabled="!draft.trim()" @click="add" />
    <MText v-if="tasks.length === 0" tone="muted">Nothing yet</MText>
    <template v-else>
      <TaskRow v-for="task in tasks" :key="task.id" :task="task" @toggle="toggle" />
    </template>
    <MReveal :show="open === 0">
      <MText tone="success">All done</MText>
    </MReveal>
  </MColumn>
</template>
```

`npm run generate` writes `Tasks.swift` for the Mac and nothing for this file on the Web or NativeScript. When `portability.entry` names a Vue file, the generated `entry.ts` of each Vue app re-exports the shared file, so the hosts open it as written. Shared Vue files import Mavis from `#mavis`, which each host resolves to its renderer (`apps/web/src/mavis.js`, `apps/mobile/src/mavis.ts`). A Vue file shows other Vue files and a TSX file other TSX files, because a Vue file's imports have to exist for the Web and NativeScript as written.

### What a Vue file can use

| Area       | Supported                                                                                                                                                                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script     | `<script setup lang="ts">`. `const name = ref(value)` is state, `computed(() => …)` a derived value (an expression, or `const` lines and a `return`), a `function` or arrow function in braces an action, and any other `const` a constant                                                                            |
| Properties | `defineProps<{ … }>()` with the types in the file, read as `props.name` in the script and by name in the template. `withDefaults` gives literal defaults; a property marked `?` can be left out by the parent (a boolean is then `false`, anything else is missing)                                                   |
| Events     | `defineEmits<{ saved: [id: string] }>()`, sent with `emit('saved', id)` or `$emit` in the template and heard with `@saved`. An event nobody listens to goes nowhere                                                                                                                                                   |
| Fields     | `v-model` on `MInput`, `MCheckbox` and `MSelect`, or `:modelValue` with `@update:modelValue`; `@submit` on `MInput`. `const titleRef = ref<InputHandle \| null>(null)` with `ref="titleRef"` on one `MInput` lets a function call `titleRef.value?.focus()` and `blur()`                           |
| Template   | The nine primitives, as `MButton` or `m-button`, with the properties of the tables above under their Vue names: `accessibilityLabel`, `@click` on `MButton`, `interactive` with `@click` on `MCard`, text as content or `text`. `v-if`, `v-else-if`, `v-else`, `v-for` with `:key` (on the element or a `<template>`) |
| Listeners  | A function's name (`@click="save"`), an arrow function, or statements with `$event` (`@click="count++"`, `@update:modelValue="title = $event.trim()"`)                                                                                                                                                                |
| Motion     | `<MReveal :show="…">` directly in an `MColumn` or `MCard`, where TSX writes `<Show animate>`; with more than one child it takes the same `gap` as the stack around it                                                                                                                                                 |
| Components | `import TaskRow from './TaskRow.vue'` with its properties, events and [slots](#slots)                                                                                                                                                                                                                                 |
| Values     | Everything in the Expressions, Text, Arrays and Math rows above. `null` is a missing value, like `undefined`: `ref<string \| null>(null)` and `value === null` work, and a type may use one of the two, not both                                                                                                      |
| Conditions | Where JavaScript reads a value as a condition, so does the Mac: text is true when it is not empty, a missing record or list is false, and `list.length` is true above zero. `a \|\| b` picks the first text that is not empty. Compare other numbers (`count > 0`)                                                    |

A `ref` and a `computed` are read through `.value` in the script and by name in the template, as Vue does. An initial value can read a property but not other state: on the Mac nothing of the component exists yet when it is computed. A function changes state and returns nothing; a value that is derived is a `computed`. A check does not make a `ref` or a `computed` present for what follows, as it does in TypeScript: after `last.value === null ? … : …` the value is still optional in every target, so give it a fallback (`last.value ?? ''`) or copy it to a `const` first and check that.

### One file, three platforms

`useMavisPlatform()` answers `{ platform, isWeb, isNative, isIOS, isAndroid, isMacOS }`. On the Web and NativeScript the renderer answers while the app runs, and `isMacOS` is always `false` there. For the Mac the compiler answers while it generates: `platform` is `'macos'`, `isMacOS` is `true` and the rest are `false`. A branch that depends only on these answers is settled then, and the other branches never reach the Mac app, so they may hold what only another platform has:

```vue
<script setup lang="ts">
import { MColumn, MGrid, MPlatform, MText, useMavisPlatform } from '#mavis'
const { isMacOS, isNative } = useMavisPlatform()
const columns = isMacOS ? 3 : 1
</script>

<template>
  <MGrid :columns="columns" :gap="isMacOS ? 'lg' : 'md'">
    <MText v-if="isMacOS">A window of its own</MText>
    <Label v-else-if="isNative" text="A NativeScript view the Mac never reads" />
    <MText v-else>A browser tab</MText>
    <MPlatform only="macos">
      <MText>Mac only</MText>
      <template #fallback><MText>Everywhere else</MText></template>
    </MPlatform>
  </MGrid>
</template>
```

This holds for `v-if` chains, `<MPlatform only="…">`, `if` statements, `a ? b : c` and `&&`, `||`, `!`, `===` on those answers. Imports are not conditional: a module only one platform has still belongs in a host app.

### Slots

A component can take content from the parent that shows it: a default slot, named slots, and scoped slots that hand their content values. Both formats write them, and both read into the same model.

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
<!-- shared/TaskList.vue: a scoped slot declares what it hands its content -->
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
<!-- the parent fills them -->
<Panel title="Unused">
  <template #header><MText variant="heading">Today</MText></template>
  <MText>Content between the tags is the default slot.</MText>
</Panel>
<TaskList :tasks="tasks">
  <template #row="{ task, position }">
    <MText>{{ position }}. {{ task.title }}</MText>
    <MButton :text="`Finish ${task.title}`" @click="finish(task.id)" />
  </template>
</TaskList>
```

The same in TSX follows Mitosis's conventions: `props.children` is the default slot and `props.slotHeader` the one named `header`, both typed `JSX.Element`; `??` gives the fallback; a scoped slot is a function, `slotRow?: (props: { task: Task; position: number }) => JSX.Element`, shown as `{props.slotRow?.({ task, position: index + 1 }) ?? <MText>{task.title}</MText>}` and filled with `slotRow={({ task, position }) => <>…</>}`. A parent passes the default slot as children, or a function of the slot's properties as the only child.

On the Mac each slot is a view type of the component, as in SwiftUI, and a closure it keeps; a slot left out defaults to an empty view and shows its fallback instead:

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
    title: "Unused",
    header: { Text(verbatim: "Today") },
    content: { Text(verbatim: "Content between the tags is the default slot.") }
)
```

- The content belongs to the parent: it reads the parent's state, its fields share the parent's focus, and it is laid out where the slot stands, with the component's spacing. A slot that gets nothing and has no fallback takes no space and adds no gap.
- Slot names are letters and digits, such as `headerTitle`. A scoped slot hands its content every property it declares, and none called `name` or `key`, which Vue reads on `<slot>` as the slot's own.
- Where a slot has fallback content, the content passed must always show something. Vue also shows the fallback when the content renders nothing (a `v-if` that is false, an empty list), and SwiftUI only knows whether content was passed, so such content fails generation.
- Content a component shows more than once, in a list or at two places, cannot hold an `MInput`: on the Mac the copies would share one focus. A button with a `shortcut` is never content, and `MReveal` cannot be content directly: it needs the column around it.
- In Swift the slot `header` is the view type `Header`, kept as the closure `header`, and the default slot is `Content` and `content`. Where the component already uses one of these names, for a record, a component, a member or SwiftUI's own `Text`, the generated Swift takes another, such as `TextContent` or `footerSlot`; the source does not change.

### What fails, and how

A file outside this subset stops generation before any output is written, with `file:line:column` in the `.vue` file and the construct by name:

```text
shared/Edit.vue:2:25: watch from vue is not supported in shared screens for the Mac: effects are not part of the portable model yet.
shared/Detail.vue:14:7: <div> is an HTML element, which a shared screen cannot use on the Mac; shared screens use MColumn, MRow, MGrid, MCard, MText, MButton, MInput, MCheckbox, MSelect and MReveal.
shared/Detail.vue:9:3: document is browser DOM access, which a shared screen cannot use on the Mac. Keep it in the Web app.
shared/Row.vue:21:23: Type '"huge"' is not assignable to type '"primary" | "secondary" | "ghost" | undefined'.
```

Every file is read before generation fails, so one run lists the first problem of each file; a file that shows a component with a problem waits for it. Type errors come from TypeScript, checked against what the Mac supports rather than against the Web's wider properties.

Not read for the Mac yet: `watch` and lifecycle hooks, `async` functions, dynamic slot names (`#[name]`, `<slot :name>`), `$slots` and `useSlots`, a slot's `<template>` with `v-if`, `v-model` and `ref` on shared components, `v-show`, `v-html`, `class`, `style` and `<style>`, key and event modifiers such as `@keydown.esc` and `@click.stop` (NativeScript-Vue does not run them, so `onEscape`, a stack's `onKeyDown` and a button's `shortcut` have no Vue spelling yet), `defineModel` and destructured `defineProps`, functions that return a value, animated lists (`:motionRegion`), a property type imported from another file, and anything that is not a shared `.vue` file or a type import: stores, services and other `.ts` modules with values ([#340](https://github.com/getcortexlabs/mavis-ui/issues/340)), router navigation ([#341](https://github.com/getcortexlabs/mavis-ui/issues/341)), `useMavisTheme` ([#342](https://github.com/getcortexlabs/mavis-ui/issues/342)), and components beyond the nine primitives, `MScreen` included. DOM and NativeScript access in a shared file is always an error. A screen that uses these keeps running on the Web and NativeScript; it is the Mac that has to wait.

In any Mavis project, `npx @getcortexlabs/create-mavis --check-portability` now ends with this list for the Mac, file by file, using the same front ends. It only fails the command in a project that has the Mac target:

```text
Mac target (experimental): 1 of 3 shared files are ready to compile.
  ready      shared/TaskRow.vue
  not ready  shared/Tasks.vue
             12:5 MScreen is not available on the Mac yet; shared screens use MColumn, …
  not ready  shared/tasks-store.ts
             A .ts file holds shared record types, under a lowercase name without dashes such as types.ts. …
```

### Adding a format

The compiler is in `scripts/portable`: `frontends/` read a format, `model.mjs` describes what they produce, and `emit-swift.mjs` and `emit-vue.mjs` print it. A front end is one module listed in `frontends/index.mjs`:

- `extension` names its files (`.lite.tsx`, `.vue`), and `direct` the targets that run them as written.
- `open(reader, sourceFile, path)` returns the component with its name and properties, so other files can use it, then `link` checks its imports and `finish` reads state, actions and the view into the model.
- A format that is not TypeScript adds `prepare`: it lowers each file to TypeScript the checker can read and says where each position came from, so every message points at the author's file. The Vue front end does this with Vue's own parser (`vue/compiler-sfc`).

`frontends/typescript.mjs` is the part formats share when their expressions are TypeScript, as React, Svelte, Solid and Angular's are: record types, expressions, statements, handlers and the properties of the Mavis primitives, read from the checker's nodes. A front end gives it a dialect, the few functions that say how the format names a component's own state (`state.count`, `count.value` or `count`), and reads its own view syntax. The test of a new front end is the one the Vue one passes: the same screen in two formats produces the same model and the same Swift.

## Same behavior in every app

The Vue output keeps the source's JavaScript. The SwiftUI output follows JavaScript where Swift differs:

- Numbers are JavaScript numbers (`Double` in Swift), and their text shows the same digits: `0.1 + 0.2` shows `0.30000000000000004`, `1e21` shows `1e+21`.
- `length` counts UTF-16 units, as JavaScript does (`'👋🏽'.length` is 4).
- `trim`, `splice`, `slice` and `Math.round` follow the JavaScript rules, including negative and out-of-range indices.
- `list[index]` is `undefined` unless the index is a whole number inside the list; `toSorted` is stable and treats `NaN` from the compare function as equal.
- `<` and `>` on strings compare UTF-16 code units, as in JavaScript.

Every fixture in `test/portable` runs the same session (clicks, typing, Return, Escape, Tab, arrow keys, checkboxes and menu choices) in the generated Vue (Chromium and WebKit) and in the generated SwiftUI app (XCUITest on macOS), and compares every visible text, field value and message, and the focused field after each step. A step can also assert layout between elements addressed by their `id`: an element's edges in its container, the order and gap of siblings, equal or fixed sizes, and which row a wrapped child is on, within a unit and a half so the relations hold across renderers and fonts. `node scripts/check-portable-conformance.mjs --offscreen` replays the sessions that need no keyboard on the Mac without showing a window, by laying the generated views out in one process and reading their accessibility tree. Before each click it checks that the accessibility hit test at the control's center reaches the control, as a UI test's click requires. The same steps also run on the generated NativeScript app on an iOS simulator and an Android emulator, driving the real views; steps that need a hardware keyboard name their touch equivalent (Discard instead of Escape, a row's Select button instead of an arrow key). Text comparison still follows each platform's Unicode rules: Swift treats canonically equivalent strings as equal. Two fixtures exist twice, as TSX and as Vue files, and replay one `steps.json`, and a third covers what only Vue files have: the Vue files run as written on the Web and NativeScript, and the Swift generated from them on the Mac. The one Escape step runs as its touch equivalent there, since a Vue file that also runs on NativeScript has no listener for the key.

Not available yet: icons, links (`href`), motion surfaces and regions, grid items that span columns, the remaining field properties, dates, file pickers, asynchronous work or validation, effects, navigation, persistence and the other Mavis components. `--add-native` and `--add-web` are not migrations for this project, and `--check-portability` reports without changing files; `--example directory` and Nuxt are rejected for this target; `--example tasks` creates the [Tasks example](./tasks-example).

Typography and layout follow each host; exact pixel parity is not promised. The `.app` is for local development: signing, notarization, installers and App Store distribution are not configured.

The [Tasks example](./tasks-example) puts all of this together in one small app. The broader portable model is tracked in [#144](https://github.com/getcortexlabs/mavis-ui/issues/144).
