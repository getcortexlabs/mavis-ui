import ts from 'typescript'
import { components } from './components/index.mjs'
import { sharedTypes } from './components/shared.mjs'

export const preludePath = 'shared/__mavis_prelude__.d.ts'

/** Ambient declarations for the shared sources: Mavis primitives and the Mitosis authoring API. */
export function prelude(theme) {
  const definitions = Object.values(components)
  return `declare namespace JSX {
  interface Element { readonly __mavisElement: true }
  interface ElementChildrenAttribute { children: {} }
  interface IntrinsicAttributes { key?: string | number }
  interface IntrinsicElements {}
}
${sharedTypes(theme)}
${definitions.flatMap((definition) => (definition.types ? [definition.types(theme)] : [])).join('\n')}
${definitions.map((definition) => definition.declaration).join('\n')}
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
