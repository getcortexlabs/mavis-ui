import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { resolve } from 'node:path'
// @ts-expect-error The compiler ships ESM.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'

describe('shared source renderer facades', () => {
  it('resolves every compiled component and the shared helpers in every generated host', () => {
    const paths = [
      'vite/src/mavis.ts',
      'nuxt/app/mavis.ts',
      'mobile/src/mavis.ts',
      'macos/web/src/mavis.js',
    ].map((file) => resolve(import.meta.dirname, '../packages/create-mavis/templates', file))
    const program = ts.createProgram(paths, {
      allowJs: true,
      checkJs: true,
      skipLibCheck: true,
      noEmit: true,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      types: [],
    })
    const checker = program.getTypeChecker()
    for (const path of paths) {
      const source = program.getSourceFile(path)!
      expect(
        [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map(
          (diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        ),
        path,
      ).toEqual([])
      const names = new Set(
        checker
          .getExportsOfModule(checker.getSymbolAtLocation(source)!)
          .map((symbol) => symbol.name),
      )
      for (const name of [
        ...Object.keys(components).filter((name) => name.startsWith('M')),
        'useToast',
        'useMavisTheme',
        'useFileSelection',
        'useFormController',
        'useMavisNavigation',
        'defineTheme',
        'formatDateTime',
        'dateTimeToCivilDate',
      ])
        expect(names.has(name), `${path}: ${name}`).toBe(true)
    }
  })
})
