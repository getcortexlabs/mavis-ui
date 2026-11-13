import ts from 'typescript'
import { components } from './components/index.mjs'
import { contractAmbient } from './contract-types.mjs'
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
${contractAmbient()}
declare module '@builder.io/mitosis' {
  export function useStore<T extends object>(initial: T): T
  export function useRef<T>(initial?: T | null): T
  export function onMount(hook: () => void | Promise<void>): void
  export function onUnMount(hook: () => void): void
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
 * Type-checks sources in memory. `files` maps a project-relative path
 * (shared/Welcome.lite.tsx) to the TypeScript the checker reads. A front end that lowers its
 * format to TypeScript adds ambient declarations, and for each lowered file an origin that
 * says where a position of that TypeScript sits in the file the author wrote:
 * { path, at(position) → { line, column, echo? } }; echo marks text the front end repeated.
 */
export function createProgram(files, theme, { ambient = new Map(), origins = new Map() } = {}) {
  const root = '/mavis/'
  const texts = new Map([...files, ...ambient].map(([path, text]) => [root + path, text]))
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
  const position = (file, start) => {
    const path = relative(file.fileName)
    const origin = origins.get(path)
    if (origin) return { file: origin.path, ...origin.at(start) }
    const { line, character } = file.getLineAndCharacterOfPosition(start)
    return { file: path, line: line + 1, column: character + 1 }
  }
  const found = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => !diagnostic.file || diagnostic.file.fileName.startsWith(root))
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      if (!diagnostic.file || diagnostic.start === undefined) return { message }
      return { ...position(diagnostic.file, diagnostic.start), message }
    })
  // Repeated text reports what the original already did.
  const original = new Set(found.filter((item) => !item.echo).map((item) => item.file))
  const diagnostics = found
    .filter((item) => !item.echo || !original.has(item.file))
    .map(({ echo, ...item }) => item)
  return {
    program,
    checker: program.getTypeChecker(),
    diagnostics,
    sourceFile: (path) => program.getSourceFile(root + path),
    relative,
    isSource: (path) => files.has(path) || ambient.has(path) || path === preludePath,
    /** Where a node sits in the file its author wrote. */
    where: (node) => {
      const file = node.getSourceFile()
      const { echo, ...place } = position(file, node.getStart(file))
      return place
    },
  }
}
