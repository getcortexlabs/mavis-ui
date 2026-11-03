import { lstat, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'
import { components, composables } from './shared-api.mjs'

const rendererImports = new Set(['@getcortexlabs/mavis-web', '@getcortexlabs/mavis/vue'])
const sharedNames = new Set([...components, ...composables])
const browserGlobals = new Set([
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
  'HTMLElement',
  'Element',
  'Node',
  'ResizeObserver',
  'MutationObserver',
  'IntersectionObserver',
  'getComputedStyle',
  'matchMedia',
  'requestAnimationFrame',
  'cancelAnimationFrame',
])
const ignored = new Set([
  'node_modules',
  '.git',
  '.nuxt',
  '.output',
  'dist',
  'platforms',
  'artifacts',
])
const sourceExtensions = ['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs']
const platformImports =
  /^(?:@getcortexlabs\/mavis(?:-web)?(?:\/|$)|@nativescript\/|nativescript-vue$|vue-router(?:-ns)?$|nuxt(?:\/|$)|#app$|node:|@rafaelaugusto\/jolt(?:\/|$))/
const portableImports = new Set([
  'vue',
  '@getcortexlabs/mavis-core',
  '@getcortexlabs/mavis-core/vue',
  '@getcortexlabs/mavis-core/experimental',
  '#mavis',
])
const internal = (root, file) => {
  const path = relative(root, file)
  return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}

/** A conservative source audit, not a proof that arbitrary dependencies are portable. */
export function inspectSource(source, filename, { allowImports = [] } = {}) {
  const diagnostics = [],
    edits = [],
    imports = []
  const report = (code, offset, message, fixable = false) => {
    const before = source.slice(0, offset).split('\n')
    diagnostics.push({
      file: filename,
      line: before.length,
      column: before.at(-1).length + 1,
      code,
      message,
      fixable,
    })
  }
  let script = source
  let template
  const templateExpressions = []
  if (filename.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename })
    for (const error of errors)
      report('parse', error.loc?.start?.offset ?? 0, String(error.message ?? error))
    if (descriptor.template?.lang && descriptor.template.lang !== 'html')
      report(
        'template-language',
        descriptor.template.loc.start.offset,
        'Only Vue HTML templates can be audited; review this template language separately.',
      )
    template = descriptor.template?.ast
    script = source.replace(/[^\r\n]/g, ' ')
    for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
      if (block.src)
        report(
          'script-src',
          block.loc.start.offset,
          'Audit the external script separately; inline script imports can be followed automatically.',
        )
      script =
        script.slice(0, block.loc.start.offset) + block.content + script.slice(block.loc.end.offset)
    }
    for (const style of descriptor.styles)
      report(
        'css',
        style.loc.start.offset,
        'CSS needs renderer review. Prefer Mavis layout, typography and spacing props in shared screens.',
      )
    const visit = (node) => {
      if (node.type === 5) templateExpressions.push(node.content)
      if (node.type === 1)
        for (const prop of node.props)
          if (prop.type === 7 && prop.exp && !['for', 'slot'].includes(prop.name))
            templateExpressions.push(prop.exp)
      if (node.type === 1) {
        if (
          (node.tagType === 0 && !['template', 'slot'].includes(node.tag)) ||
          /^(?:RouterLink|NuxtLink|ClientOnly|Teleport|Frame|Page|GridLayout|StackLayout|Label|TextField)$/i.test(
            node.tag,
          )
        )
          report(
            'element',
            node.loc.start.offset,
            `<${node.tag}> is platform-specific. Use a shared Mavis component or move it into a host adapter.`,
          )
        for (const prop of node.props) {
          if (
            (prop.type === 6 && ['style', 'class'].includes(prop.name)) ||
            (prop.type === 7 &&
              prop.name === 'bind' &&
              ['style', 'class'].includes(prop.arg?.content))
          )
            report(
              'styling',
              prop.loc.start.offset,
              'Review class/style across both renderers; prefer shared props and tokens.',
            )
          if (
            prop.type === 7 &&
            (prop.name === 'html' ||
              prop.modifiers?.some((m) =>
                ['prevent', 'stop', 'capture', 'passive', 'self'].includes(m.content),
              ))
          )
            report(
              'dom-directive',
              prop.loc.start.offset,
              'This directive relies on DOM event/content behavior. Use the component contract or a host adapter.',
            )
        }
      }
      for (const child of node.children ?? []) visit(child)
    }
    if (descriptor.template?.ast) visit(descriptor.template.ast)
  }
  const file = ts.createSourceFile(
    filename + '.ts',
    script,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const host = {
    getSourceFile: (name) => (name === file.fileName ? file : undefined),
    writeFile() {},
    getCurrentDirectory: () => '',
    getDirectories: () => [],
    fileExists: (name) => name === file.fileName,
    readFile: () => undefined,
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getDefaultLibFileName: () => '',
  }
  const program = ts.createProgram([file.fileName], { noLib: true, noResolve: true }, host)
  const checker = program.getTypeChecker()
  for (const error of program.getSyntacticDiagnostics(file))
    report('parse', error.start ?? 0, ts.flattenDiagnosticMessageText(error.messageText, ' '))
  const dependency = (literal, declaration) => {
    const name = literal.text
    imports.push(name)
    if (rendererImports.has(name)) {
      const bindings = declaration?.importClause?.namedBindings
      const safe =
        !declaration?.importClause?.name &&
        bindings &&
        ts.isNamedImports(bindings) &&
        bindings.elements.length > 0 &&
        bindings.elements.every((item) => sharedNames.has((item.propertyName ?? item.name).text))
      report(
        'renderer-import',
        literal.getStart(file),
        'Import shared components/composables from #mavis; the host selects the renderer.',
        Boolean(safe),
      )
      if (safe)
        edits.push({ start: literal.getStart(file) + 1, end: literal.getEnd() - 1, text: '#mavis' })
    } else if (platformImports.test(name)) {
      report(
        'platform-import',
        literal.getStart(file),
        `${name} belongs in a host adapter. Core contracts are available from @getcortexlabs/mavis-core.`,
      )
    } else if (
      !portableImports.has(name) &&
      !allowImports.includes(name) &&
      !name.startsWith('.')
    ) {
      report(
        'review-import',
        literal.getStart(file),
        `Review ${name} for each target. Audited portable dependencies can be listed in portability.allowImports.`,
      )
    }
  }
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))
        dependency(node.moduleSpecifier, ts.isImportDeclaration(node) ? node : undefined)
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require' &&
          !checker.getSymbolAtLocation(node.expression)))
    ) {
      const value = node.arguments[0]
      if (value && ts.isStringLiteral(value)) dependency(value)
      else
        report(
          'dynamic-import',
          node.getStart(file),
          'A computed dependency cannot be audited statically; isolate or review it for every target.',
        )
    } else if (ts.isIdentifier(node) && browserGlobals.has(node.text)) {
      const parent = node.parent
      const property =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) &&
          parent.name === node)
      if (!property && !checker.getSymbolAtLocation(node))
        report(
          'browser-global',
          node.getStart(file),
          `${node.text} is browser-specific. Inject a host service or use a shared Mavis contract.`,
        )
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['globalThis', 'self'].includes(node.expression.text) &&
      !checker.getSymbolAtLocation(node.expression)?.declarations?.length &&
      browserGlobals.has(node.name.text)
    ) {
      report(
        'browser-global',
        node.getStart(file),
        `${node.getText(file)} is browser-specific. Inject a host service.`,
      )
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  if (template) {
    const bindings = checker
      .getSymbolsInScope(file, ts.SymbolFlags.Value)
      .filter((symbol) =>
        symbol.declarations?.some((declaration) => declaration.getSourceFile() === file),
      )
      .map((symbol) => symbol.name)
      .filter((name) => /^[$A-Z_a-z][$\w]*$/.test(name))
    const prefix = bindings.map((name) => `declare const ${name}: any;`).join('') + '\n'
    for (const expression of templateExpressions) {
      const analysis = inspectSource(prefix + expression.content, 'template-expression.ts', {
        allowImports,
      })
      for (const item of analysis.diagnostics.filter((item) => item.code === 'browser-global')) {
        const lines = (prefix + expression.content).split('\n')
        const offset =
          lines.slice(0, item.line - 1).reduce((length, line) => length + line.length + 1, 0) +
          item.column -
          1 -
          prefix.length
        report(item.code, expression.loc.start.offset + Math.max(0, offset), item.message)
      }
    }
  }
  return { diagnostics, edits, imports }
}

async function projectConfig(root) {
  try {
    return JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return {}
    throw new Error(`Cannot read mavis.config.json: ${error.message}`)
  }
}

/** Never follows symlinks or traverses outside the selected project. */
export async function checkPortability(root = process.cwd(), options = {}) {
  root = resolve(root)
  const config = await projectConfig(root)
  const roots = options.path
    ? [options.path]
    : (config.portability?.roots ?? [
        config.target === 'both' ? 'shared' : config.web === 'nuxt' ? 'app/shared' : 'src/shared',
      ])
  if (
    !Array.isArray(roots) ||
    !roots.length ||
    roots.some((value) => typeof value !== 'string' || !value)
  )
    throw new Error('Configure at least one source directory in portability.roots.')
  const files = new Map(),
    diagnostics = [],
    fixes = []
  const load = async (file, dependency = false) => {
    if (!internal(root, file)) throw new Error('Portability paths must stay inside the project.')
    let ancestor = root
    for (const part of relative(root, file).split(sep).filter(Boolean)) {
      ancestor = join(ancestor, part)
      if ((await lstat(ancestor)).isSymbolicLink())
        throw new Error(`Portability does not follow symlinks: ${relative(root, ancestor)}`)
    }
    const info = await lstat(file)
    if (info.isSymbolicLink())
      throw new Error(`Portability does not follow symlinks: ${relative(root, file)}`)
    if (info.isDirectory()) {
      if (dependency) return
      for (const item of (await readdir(file)).sort())
        if (!ignored.has(item)) await load(join(file, item))
    } else if (sourceExtensions.includes(extname(file)) && !files.has(file)) {
      const source = await readFile(file, 'utf8')
      const result = inspectSource(source, relative(root, file), config.portability)
      files.set(file, { source, ...result })
      diagnostics.push(...result.diagnostics)
      for (const name of result.imports.filter((name) => name.startsWith('.'))) {
        const target = resolve(dirname(file), name)
        const candidates = [
          ...(/\.[cm]?jsx?$/.test(target)
            ? [target.replace(/\.[cm]?jsx?$/, '.ts'), target.replace(/\.[cm]?jsx?$/, '.tsx')]
            : []),
          target,
          ...sourceExtensions.map((ext) => target + ext),
          ...sourceExtensions.map((ext) => join(target, 'index' + ext)),
        ]
        let found = false
        for (const candidate of candidates) {
          if (!internal(root, candidate))
            throw new Error(`Shared dependency leaves the project: ${name}`)
          let stat
          try {
            stat = await lstat(candidate)
          } catch (error) {
            if (error.code === 'ENOENT' || error.code === 'ENOTDIR') continue
            throw error
          }
          if (stat.isDirectory()) continue
          if (!sourceExtensions.includes(extname(candidate)))
            diagnostics.push({
              file: relative(root, file),
              line: 1,
              column: 1,
              code: 'review-asset',
              message: `Review ${name} across renderers; non-script dependencies are not audited.`,
              fixable: false,
            })
          await load(candidate, true)
          found = true
          break
        }
        if (!found)
          diagnostics.push({
            file: relative(root, file),
            line: 1,
            column: 1,
            code: 'unresolved-import',
            message: `Could not audit ${name}; check its resolution or move it into a host adapter.`,
            fixable: false,
          })
      }
    }
  }
  for (const name of roots) {
    const file = resolve(root, name)
    // Check every ancestor so a symlinked parent cannot escape the project.
    if (!internal(root, file)) throw new Error('Portability paths must stay inside the project.')
    let current = root
    for (const part of relative(root, file).split(sep).filter(Boolean)) {
      current = join(current, part)
      if ((await lstat(current)).isSymbolicLink())
        throw new Error('Portability does not follow symlinks.')
    }
    await load(file)
  }
  if (!files.size)
    throw new Error('No Vue or script sources found in the configured portability paths.')
  if (options.fixImports) {
    if (config.portability?.alias !== '#mavis')
      throw new Error(
        'Import migration requires a generated #mavis alias. Configure the host and TypeScript aliases before migrating.',
      )
    const hosts =
      config.target === 'both'
        ? [
            ['apps/web', config.web],
            ['apps/mobile', 'mobile'],
          ]
        : [['', config.target === 'mobile' ? 'mobile' : config.web]]
    for (const [directory, host] of hosts) {
      const facade = join(root, directory, host === 'nuxt' ? 'app/mavis.ts' : 'src/mavis.ts')
      const build = join(
        root,
        directory,
        host === 'mobile'
          ? 'webpack.config.js'
          : host === 'nuxt'
            ? 'nuxt.config.ts'
            : 'vite.config.ts',
      )
      if (
        !(await readFile(facade, 'utf8')).includes('@getcortexlabs/mavis') ||
        !(await readFile(build, 'utf8')).includes('#mavis')
      )
        throw new Error('The generated #mavis host configuration is missing. No files changed.')
    }
    // Prepare all edits before any write. A parse error makes the migration a no-op.
    if (diagnostics.some((item) => item.code === 'parse'))
      throw new Error('Fix syntax errors before migrating imports. No files changed.')
    for (const [file, result] of files) {
      if (!result.edits.length) continue
      let updated = result.source
      for (const edit of [...result.edits].sort((a, b) => b.start - a.start))
        updated = updated.slice(0, edit.start) + edit.text + updated.slice(edit.end)
      fixes.push({ file: relative(root, file), before: result.source, after: updated })
    }
    if (options.write) {
      for (const fix of fixes) {
        const file = join(root, fix.file)
        if ((await lstat(file)).isSymbolicLink() || (await readFile(file, 'utf8')) !== fix.before)
          throw new Error(`Source changed during migration: ${fix.file}`)
      }
      for (const fix of fixes) await writeFile(join(root, fix.file), fix.after)
      const after = await checkPortability(root, { path: options.path })
      return { ...after, fixes, written: true }
    }
  }
  return {
    files: [...files.keys()].map((file) => relative(root, file)),
    diagnostics: diagnostics.sort(
      (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
    ),
    fixes,
    written: false,
  }
}
