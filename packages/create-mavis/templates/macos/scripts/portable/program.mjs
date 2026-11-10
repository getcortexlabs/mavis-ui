import ts from 'typescript'

export const primitives = {
  MColumn: ['gap', 'padding'],
  MRow: ['gap', 'padding'],
  MText: ['variant', 'tone'],
  MButton: ['text', 'variant', 'disabled', 'onClick'],
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
declare function MColumn(props: { gap?: MavisSpace; padding?: MavisSpace; children?: unknown }): JSX.Element
declare function MRow(props: { gap?: MavisSpace; padding?: MavisSpace; children?: unknown }): JSX.Element
declare function MText(props: { variant?: MavisVariant; tone?: MavisTone; children?: MavisText | MavisText[] }): JSX.Element
declare function MButton(props: { text: string; variant?: 'primary' | 'secondary'; disabled?: boolean; onClick: () => void }): JSX.Element
declare module '@builder.io/mitosis' {
  export function useStore<T extends object>(initial: T): T
  export function Show(props: { when: boolean; else?: JSX.Element; children?: unknown }): JSX.Element
  export function For<T>(props: { each: readonly T[]; children: (item: T, index: number) => JSX.Element }): JSX.Element
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
  lib: ['lib.es2022.d.ts'],
  types: [],
}

/**
 * Type-checks the shared sources in memory. `files` maps a project-relative path
 * (shared/Welcome.lite.tsx) to its text.
 */
export function createProgram(files, theme) {
  const root = '/mavis/'
  const texts = new Map([...files].map(([path, text]) => [root + path, text]))
  texts.set(root + 'shared/__mavis_prelude__.d.ts', prelude(theme))
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
