---
title: CommandPalette
---

# CommandPalette

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="command-palette" :height="1000" />

```vue
<MCommandPalette v-model:open="open" :items="commands" label="Commands" @select="run" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly CommandItem[]` | required | Commands with value, label, description, group, keywords, icon, disabled and a display-only shortcut. |
| `open / query` | `boolean / string` | false / local | Controlled presentation and optionally controlled search. A local query resets on close. |
| `shortcut / loading / disabled` | `boolean` | false | Opt-in Cmd/Ctrl+K on Web; loading blocks selection while the application fetches. |
| `label / searchLabel / placeholder / emptyLabel / loadingLabel / closeLabel` | `string` | see source | Localizable title, search and state labels. |
| `returnFocus` | `SheetReturnFocus` | captured opener | Web focus destination after closing: element ID (without `#`), callback or `false`, inherited from MSheet. |

Search ignores accents and matches all space-separated terms against labels, descriptions, groups and keywords. Arrow keys move from search to enabled actions; Home/End work inside results, Enter selects, Escape closes. The Web shortcut is opt-in, ignores editable targets, composition and other dialogs, and is released on unmount. Native uses a Sheet with search and explicit actions. The application executes commands and owns async work; selection closes the palette. Item shortcut strings are hints, not registered hotkeys.

Events: `update:open(boolean)`, `update:query(string)`, `select(ChoiceValue, CommandItem)`.

<<< @/../examples/catalog/shared/demos/CommandPaletteDemo.vue
