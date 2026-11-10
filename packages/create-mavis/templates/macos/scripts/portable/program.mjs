import ts from 'typescript'

export const preludePath = 'shared/__mavis_prelude__.d.ts'

export const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

/** Each primitive's properties: how a value is checked and passed to both renderers. */
export const primitives = {
  MColumn: { gap: 'space', padding: 'space', label: 'string', onKeyDown: 'key' },
  MRow: { gap: 'space', padding: 'space', label: 'string', onKeyDown: 'key' },
  MGrid: { gap: 'space', columns: 'number', minColumnWidth: 'number' },
  MCard: { gap: 'space', padding: 'space', tone: 'string', label: 'string', onClick: 'handler' },
  MText: { variant: 'string', tone: 'string' },
  MButton: {
    text: 'string',
    variant: 'string',
    disabled: 'boolean',
    onClick: 'handler',
    shortcut: 'shortcut',
  },
  MInput: {
    label: 'string',
    value: 'string',
    onChange: 'string-handler',
    placeholder: 'string',
    helperText: 'string',
    error: 'string',
    type: 'string',
    multiline: 'boolean',
    rows: 'number',
    maxLength: 'number',
    disabled: 'boolean',
    readonly: 'boolean',
    onSubmit: 'handler',
    onEscape: 'handler',
    ref: 'ref',
  },
  MCheckbox: {
    label: 'string',
    checked: 'boolean',
    onChange: 'boolean-handler',
    indeterminate: 'boolean',
    helperText: 'string',
    disabled: 'boolean',
  },
  MSelect: {
    label: 'string',
    value: 'optional-string',
    options: 'options',
    onChange: 'string-handler',
    placeholder: 'string',
    helperText: 'string',
    error: 'string',
    disabled: 'boolean',
  },
}

const union = (values) => values.map((value) => JSON.stringify(value)).join(' | ')

/** Ambient declarations for the shared sources: Mavis primitives and the Mitosis authoring API. */
export function prelude(theme) {
  return `declare namespace JSX {
  interface Element { readonly __mavisElement: true }
  interface ElementChildrenAttribute { children: {} }
  interface IntrinsicAttributes { key?: string | number }
  interface IntrinsicElements {}
}
type MavisSpace = ${union(Object.keys(theme.space))}
type MavisVariant = ${union(Object.keys(theme.typography))}
type MavisTone = ${union(Object.keys(theme.colors))}
type MavisText = string | number | boolean
type MavisKey = ${union(keys)}
/** Command on Apple keyboards, Control elsewhere, with a letter or Enter. */
type MavisShortcut = ${union([...'abcdefghijklmnopqrstuvwxyz'].map((letter) => `mod+${letter}`))} | 'mod+Enter'
/** A field you can move focus to from an action: const titleRef = useRef<MavisFieldRef>(null). */
interface MavisFieldRef { focus(): void; blur(): void }
type SelectOption = { value: string; label: string; disabled?: boolean }
type MavisStack = { gap?: MavisSpace; padding?: MavisSpace; label?: string; onKeyDown?: (key: MavisKey) => void; children?: unknown }
declare function MColumn(props: MavisStack): JSX.Element
declare function MRow(props: MavisStack): JSX.Element
declare function MGrid(props: { gap?: MavisSpace; columns?: number; minColumnWidth?: number; children?: unknown }): JSX.Element
declare function MCard(props: { gap?: MavisSpace; padding?: MavisSpace; tone?: MavisTone; label?: string; onClick?: () => void; children?: unknown }): JSX.Element
declare function MText(props: { variant?: MavisVariant; tone?: MavisTone; children?: MavisText | MavisText[] }): JSX.Element
declare function MButton(props: { text: string; variant?: 'primary' | 'secondary'; disabled?: boolean; onClick: () => void; shortcut?: MavisShortcut }): JSX.Element
declare function MInput(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helperText?: string; error?: string; type?: 'text' | 'email' | 'password'; multiline?: boolean; rows?: number; maxLength?: number; disabled?: boolean; readonly?: boolean; onSubmit?: () => void; onEscape?: () => void; ref?: MavisFieldRef }): JSX.Element
declare function MCheckbox(props: { label: string; checked: boolean; onChange: (checked: boolean) => void; indeterminate?: boolean; helperText?: string; disabled?: boolean }): JSX.Element
declare function MSelect(props: { label: string; value: string | undefined; options: SelectOption[]; onChange: (value: string) => void; placeholder?: string; helperText?: string; error?: string; disabled?: boolean }): JSX.Element
declare module '@builder.io/mitosis' {
  export function useStore<T extends object>(initial: T): T
  export function useRef<T>(initial?: T | null): T
  export function Show(props: { when: boolean; else?: JSX.Element; animate?: boolean; children?: unknown }): JSX.Element
  export function For<T>(props: { each: readonly T[]; animate?: boolean; children: (item: T, index: number) => JSX.Element }): JSX.Element
}
`
}

export const compilerOptions = {
  strict: true,
  noEmit: true,
  jsx: ts.JsxEmit.Preserve,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  allowImportingTsExtensions: false,
  lib: ['lib.es2023.d.ts'],
  // Reading list[i] can miss in JavaScript; make that visible in the types too.
  noUncheckedIndexedAccess: true,
  types: [],
}

/**
 * Type-checks the shared sources in memory. `files` maps a project-relative path
 * (shared/Welcome.lite.tsx) to its text.
 */
export function createProgram(files, theme) {
  const root = '/mavis/'
  const texts = new Map([...files].map(([path, text]) => [root + path, text]))
  texts.set(root + preludePath, prelude(theme))
  const base = ts.createCompilerHost(compilerOptions)
  const host = {
    ...base,
    getCurrentDirectory: () => root,
    fileExists: (name) => texts.has(name) || (!name.startsWith(root) && base.fileExists(name)),
    readFile: (name) =>
      texts.get(name) ?? (name.startsWith(root) ? undefined : base.readFile(name)),
    getSourceFile(name, languageVersion) {
      const text = texts.get(name)
      if (text !== undefined)
        return ts.createSourceFile(
          name,
          text,
          languageVersion,
          true,
          name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        )
      return name.startsWith(root) ? undefined : base.getSourceFile(name, languageVersion)
    },
    writeFile() {},
    directoryExists: (name) =>
      name.startsWith(root)
        ? [...texts.keys()].some((path) => path.startsWith(name.endsWith('/') ? name : name + '/'))
        : (base.directoryExists?.(name) ?? true),
    getDirectories: () => [],
  }
  const program = ts.createProgram([...texts.keys()], compilerOptions, host)
  const relative = (name) => name.slice(root.length)
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => !diagnostic.file || diagnostic.file.fileName.startsWith(root))
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      if (!diagnostic.file || diagnostic.start === undefined) return message
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      return `${relative(diagnostic.file.fileName)}:${line + 1}:${character + 1}: ${message}`
    })
  return {
    program,
    checker: program.getTypeChecker(),
    diagnostics,
    sourceFile: (path) => program.getSourceFile(root + path),
    relative,
  }
}
