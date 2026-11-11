---
title: Tasks, one source for every target
description: A small task manager written once in shared TSX and generated as Vue for the Web, NativeScript-Vue for iOS and Android, and a native SwiftUI Mac app. Create it with create-mavis --example tasks.
---

# Tasks: one source for every target

A small task manager written once in `shared/` and generated for each target you pick: Vue on the Web, Vue for NativeScript on iOS and Android, and SwiftUI on the Mac. It is the second example for [projects with shared TSX sources](./macos-experimental), next to the basic welcome screen, and it uses most of what that compiler supports: forms, an editable list, a responsive grid, keyboard shortcuts and motion through Jolt.

```sh
npx @getcortexlabs/create-mavis my-tasks --targets web,native,macos --example tasks
cd my-tasks
npm run install:apps
npm run dev:web
npm run macos
```

Pick any combination of targets that includes Mac, or choose **Tasks** in the wizard. Without Native, `npm install` is enough. The example is included from RC.13.

## What it does

- A list of tasks with **All**, **Open** and **Done** filters and their counts.
- A form for a new task: title (required), notes and priority. Return in the title adds it; an empty title shows a message and keeps focus in the field.
- The selected task beside the list: mark it done, rename it, edit its notes, change its priority and move it up or down. Edits go straight to the list, so the row changes while you type.
- Delete, with the neighbour on screen taking the selection.
- An empty state, and another one when a filter hides everything.
- Selection survives filters: the detail keeps showing a task that the current filter hides.

Tasks live in memory for the session. There is no persistence, sync, account, date or notification; that is the app's own code to add.

## Layout

The list and the detail are two cells of an `MGrid` with `columns={2}` and `minColumnWidth={320}`: side by side on the Mac and on a wide browser window, one column on a phone or a narrow window, with no breakpoints in the source. Each row is an `MCard` with `onClick`, so the whole row is one button whose label says the title, the state, the priority and whether it is selected.

## Keyboard

| Action                               | Mac | Web                     |
| ------------------------------------ | --- | ----------------------- |
| New task (focus the title)           | ⌘K  | Control or Command + K  |
| Complete or reopen the selected task | ⌘↩  | Control or Command + ↩  |
| Delete the selected task             | ⌘D  | Control or Command + D  |
| Select the next or previous task     | ↓ ↑ | ↓ ↑ on the focused list |
| Add the task being written           | ↩   | ↩ in the title          |

The shortcuts belong to the three buttons above the list (`shortcut="mod+k"`), so they are disabled with them when nothing is selected. On iOS and Android the same buttons are there and there are no shortcuts.

## Motion

Rows enter, leave and change places through `<For animate>` when you add, delete, reorder or change the filter; the **Done** mark in a row comes in and out with `<Show animate>`; buttons and rows press. All of it runs through Jolt: Mavis Web and Mavis on NativeScript on those targets, JoltSwiftUI on the Mac. Reduce Motion is respected on every target.

## The source

Four files in `shared/`. `Tasks` is the screen every app opens (`portability.entry` in `mavis.config.json`).

::: code-group

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/Tasks.lite.tsx [Tasks.lite.tsx]

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/TaskRow.lite.tsx [TaskRow.lite.tsx]

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/TaskDetail.lite.tsx [TaskDetail.lite.tsx]

<<< @/../packages/create-mavis/templates/macos/examples/tasks/shared/types.ts [types.ts]

:::

## Recordings

Real input at original speed: the keyboard and pointer events of an automated session, in English.

**Vue Web · Chromium · 1100 × 820 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 1100 by 820 CSS pixels" src="/media/tasks-web.mp4" style="width:100%;max-width:880px;border-radius:16px"></video>

**SwiftUI · macOS 15 · Apple Silicon · 800 × 682 window**

<video controls playsinline preload="none" aria-label="SwiftUI · macOS 15 · Apple Silicon · 800 by 682 window" src="/media/tasks-macos.mp4" style="width:100%;max-width:800px;border-radius:16px"></video>

The Mac recording is one minute of the conformance session on the GitHub macOS runner: XCUITest sends the clicks and keys, and waits between steps to compare the screen. The window is shorter than the content, so it scrolls between the list and the form.

## How it is checked

`test/portable/tasksExample` replays one session on the example's own sources: create three tasks (with the shortcut, Return, the button and a validation error on the way), complete one with the shortcut and another with the checkbox, move the selection with the arrow keys, filter, reopen a task so it leaves the Done filter, edit the selected task, reorder with and without a filter, delete with the shortcut and the button, reach the filtered-empty and the empty states, and start again. After every step the visible texts, the rows' names and order, field values and messages, and the focused field must match.

The session passes in the generated Vue (Chromium and WebKit), in the generated SwiftUI app (XCUITest on macOS) and in the generated NativeScript app on an iOS simulator and an Android emulator, where the shortcut steps use the button and the arrow-key step a tap on the row. The Web and the Mac run it a second time with reduced motion.

## Limits

- Reordering uses the **Move up** and **Move down** buttons; there is no drag to reorder.
- A row shows text only: a card that is one button cannot hold a checkbox, so completing a task is in the detail and on ⌘↩.
- Priority is a plain string with three options, and the list keeps the order you give it; there is no sorting by priority.
- Typography and spacing follow each host; pixel parity is not promised.
- Checked on simulators, an emulator and a Mac, not on physical phones, and not audited end to end with VoiceOver or TalkBack.
