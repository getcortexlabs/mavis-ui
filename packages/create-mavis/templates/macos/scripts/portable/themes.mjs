// Project themes are declarations, not executable build hooks. Read literal defineTheme calls
// and hand their data to the same core validator the Web and NativeScript use.
import ts from 'typescript'
import { posix } from 'node:path'
import { createHash } from 'node:crypto'
import { failure, PortableError } from './model.mjs'
const coreName = '@getcortexlabs/mavis-core'
const own = (object, key) => Object.hasOwn(object, key)
const unwrap = (node) => {
  while (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    node = node.expression
  return node
}
export function themeColor(value, what = 'color') {
  if (value === 'transparent') return 0
  const hex = typeof value === 'string' && /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value)
  if (hex) {
    const digits = hex[1].length < 5 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return (
      (parseInt(digits.slice(6) || 'ff', 16) * 0x1000000 + parseInt(digits.slice(0, 6), 16)) >>> 0
    )
  }
  const rgba =
    typeof value === 'string' &&
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/.exec(
      value,
    )
  if (rgba) {
    const channels = rgba.slice(1, 4).map(Number),
      alpha = Number(rgba[4] ?? 1)
    if (channels.every((v) => v >= 0 && v <= 255) && alpha >= 0 && alpha <= 1)
      return (
        (Math.round(alpha * 255) * 0x1000000 +
          Math.round(channels[0]) * 0x10000 +
          Math.round(channels[1]) * 0x100 +
          Math.round(channels[2])) >>>
        0
      )
  }
  throw new PortableError(
    `${what}: use transparent, HEX (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) or rgb()/rgba() with numeric channels.`,
  )
}
function validateOptions(value, shape, path = 'theme') {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new PortableError(`${path} must be an object.`)
  const extra = {
    theme: ['appearance'],
    'theme.components.input': ['fontFamily', 'fontSize'],
    'theme.components.button': ['fontFamily'],
  }
  for (const [key, entry] of Object.entries(value)) {
    if (!own(shape, key) && !extra[path]?.includes(key))
      throw new PortableError(`Unknown theme token ${path}.${key}.`)
    const expected = shape[key],
      name = path + '.' + key
    if (key === 'fontFamily') {
      if (typeof entry === 'string') continue
      validateOptions(entry, { web: '', ios: '', android: '' }, name)
      if (!['web', 'ios', 'android'].every((key) => typeof entry[key] === 'string'))
        throw new PortableError(`${name} requires web, ios and android names.`)
    } else if (expected && typeof expected === 'object') validateOptions(entry, expected, name)
    else if (typeof expected === 'number' && (typeof entry !== 'number' || !Number.isFinite(entry)))
      throw new PortableError(`${name} must be a finite number.`)
    else if (
      typeof expected === 'string' &&
      typeof entry !== 'string' &&
      !(name.endsWith('.radius') || name.endsWith('.padding'))
    )
      throw new PortableError(`${name} must be a string.`)
  }
}
function validateTheme(value) {
  if (typeof value.name !== 'string' || !value.name.trim())
    throw new PortableError('A theme needs a nonempty name.')
  if (!['light', 'dark'].includes(value.appearance))
    throw new PortableError('Theme appearance is light or dark.')
  for (const [name, color] of Object.entries(value.colors)) themeColor(color, `colors.${name}`)
  for (const [name, shadow] of Object.entries(value.elevation)) {
    themeColor(shadow.color, `elevation.${name}.color`)
  }
  for (const key of ['pressDuration', 'releaseDuration', 'enterDuration', 'exitDuration'])
    if (value.motion[key] > 60000)
      throw new PortableError(`motion.${key}: Jolt on the Mac accepts at most 60000 milliseconds.`)
  if (value.motion.enterDuration > 25000)
    throw new PortableError(
      'motion.enterDuration: data motion scales duration by 2.4; Jolt on the Mac accepts at most 25000 milliseconds here.',
    )
  if (value.motion.enterOffset > 1000000)
    throw new PortableError('motion.enterOffset: Jolt on the Mac accepts at most 1000000 points.')
  for (const [size, control] of Object.entries(value.control))
    for (const [name, number] of Object.entries(control))
      if (!Number.isFinite(number) || number < 0)
        throw new PortableError(`control.${size}.${name} must be finite and nonnegative.`)
  for (const [variant, type] of Object.entries(value.typography)) {
    const family = typeof type.fontFamily === 'string' ? type.fontFamily : type.fontFamily.ios
    if (family && family !== 'system' && /[,]/.test(family))
      throw new PortableError(
        `typography.${variant}.fontFamily: CSS font stacks need an explicit native font name.`,
      )
  }
  return value
}
/** Owns files importing defineTheme; no imports, function bodies or getters are executed. */
export async function resolveProjectThemes(files, selection = 'mavis') {
  const core = await import(coreName)
  const selected = typeof selection === 'string' ? selection : null
  if (selected && !['mavis', 'midnight'].includes(selected))
    throw new PortableError('Unknown starter theme.')
  if (
    !selected &&
    (!selection ||
      typeof selection.module !== 'string' ||
      typeof selection.export !== 'string' ||
      !selection.export)
  )
    throw new PortableError('A project theme names { module, export, dark? }.')
  const sources = new Map(),
    modules = new Map(),
    themes = { mavis: core.mavis, midnight: core.midnight },
    exports = new Map()
  for (const [path, text] of files) {
    if (!path.endsWith('.ts') || path.endsWith('.d.ts')) continue
    const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    if (
      file.statements.some(
        (s) =>
          ts.isImportDeclaration(s) &&
          s.moduleSpecifier.text === coreName &&
          s.importClause?.namedBindings &&
          ts.isNamedImports(s.importClause.namedBindings) &&
          s.importClause.namedBindings.elements.some(
            (e) => (e.propertyName ?? e.name).text === 'defineTheme',
          ),
      )
    )
      sources.set(path, file)
  }
  const resolved = new Map(),
    resolving = new Set()
  function read(path) {
    if (resolved.has(path)) return resolved.get(path)
    const file = sources.get(path)
    if (!file)
      throw new PortableError(`${path}: A theme module imports defineTheme from ${coreName}.`)
    const fail = (node, message) => {
      const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file))
      throw failure([{ file: path, line: line + 1, column: character + 1, message }])
    }
    if (resolving.has(path)) fail(file, 'Theme modules cannot form an import cycle.')
    resolving.add(path)
    const names = new Map(),
      result = new Map()
    function literal(input) {
      const node = unwrap(input)
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
      if (ts.isNumericLiteral(node)) return Number(node.text)
      if (node.kind === ts.SyntaxKind.TrueKeyword) return true
      if (node.kind === ts.SyntaxKind.FalseKeyword) return false
      if (node.kind === ts.SyntaxKind.NullKeyword) return null
      if (
        ts.isPrefixUnaryExpression(node) &&
        [ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken].includes(node.operator)
      ) {
        const value = literal(node.operand)
        if (typeof value !== 'number') fail(node, 'A numeric theme token needs a number.')
        return node.operator === ts.SyntaxKind.MinusToken ? -value : value
      }
      if (ts.isIdentifier(node)) {
        if (!names.has(node.text)) fail(node, `Unknown theme constant ${node.text}.`)
        return names.get(node.text)
      }
      if (ts.isArrayLiteralExpression(node))
        return node.elements.flatMap((entry) =>
          ts.isSpreadElement(entry) ? literal(entry.expression) : [literal(entry)],
        )
      if (ts.isPropertyAccessExpression(node)) {
        const object = literal(node.expression)
        if (!object || typeof object !== 'object' || !own(object, node.name.text))
          fail(node, 'Read an existing theme property.')
        return object[node.name.text]
      }
      if (ts.isElementAccessExpression(node)) {
        const object = literal(node.expression),
          key = literal(node.argumentExpression)
        if (!object || typeof object !== 'object' || !own(object, key))
          fail(node, 'Read an existing theme property.')
        return object[key]
      }
      if (ts.isObjectLiteralExpression(node)) {
        const result = Object.create(null)
        for (const prop of node.properties) {
          if (ts.isSpreadAssignment(prop)) {
            const value = literal(prop.expression)
            if (!value || typeof value !== 'object' || Array.isArray(value))
              fail(prop, 'Spread a literal theme object.')
            Object.assign(result, value)
            continue
          }
          if (ts.isShorthandPropertyAssignment(prop)) {
            result[prop.name.text] = literal(prop.name)
            continue
          }
          if (
            !ts.isPropertyAssignment(prop) ||
            !['Identifier', 'StringLiteral', 'NumericLiteral'].some((kind) =>
              ts['is' + kind](prop.name),
            )
          )
            fail(
              prop,
              'Theme objects contain literal properties; methods and computed keys are not supported.',
            )
          result[prop.name.text] = literal(prop.initializer)
        }
        return result
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        names.get(node.expression.text) === core.defineTheme
      ) {
        if (node.arguments.length < 1 || node.arguments.length > 2)
          fail(node, 'defineTheme takes options and an optional base theme.')
        const options = literal(node.arguments[0]),
          base = node.arguments[1] ? literal(node.arguments[1]) : core.mavis
        try {
          validateOptions(options, core.mavis)
          return validateTheme(core.defineTheme(options, base))
        } catch (error) {
          fail(node, error.message)
        }
      }
      fail(
        node,
        'Theme modules contain literal data and defineTheme(options, base?); executable expressions are not supported.',
      )
    }
    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement)) {
        const from = statement.moduleSpecifier.text,
          clause = statement.importClause
        if (clause?.isTypeOnly) continue
        if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings) || clause.name)
          fail(statement, 'Import theme declarations by name.')
        const relative = from.startsWith('.')
          ? posix.normalize(posix.join(posix.dirname(path), from.replace(/\.ts$/, ''))) + '.ts'
          : null
        const imported =
          from === coreName
            ? new Map([
                ['defineTheme', core.defineTheme],
                ['mavis', core.mavis],
                ['midnight', core.midnight],
              ])
            : relative
              ? read(relative)
              : null
        if (!imported)
          fail(statement, 'Theme modules import Mavis themes or another shared theme module.')
        for (const item of clause.namedBindings.elements) {
          if (item.isTypeOnly) continue
          const name = (item.propertyName ?? item.name).text
          if (!imported.has(name)) fail(item, `Unknown theme import ${name}.`)
          names.set(item.name.text, imported.get(name))
        }
      } else if (
        ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isEmptyStatement(statement)
      )
        continue
      else if (ts.isVariableStatement(statement)) {
        if (!(statement.declarationList.flags & ts.NodeFlags.Const))
          fail(statement, 'Theme data uses const declarations.')
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
            fail(declaration, 'A theme constant has a name and a literal value.')
          const value = literal(declaration.initializer)
          names.set(declaration.name.text, value)
          if (statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
            result.set(declaration.name.text, value)
        }
      } else if (ts.isExportAssignment(statement) && !statement.isExportEquals)
        result.set('default', literal(statement.expression))
      else if (
        ts.isExportDeclaration(statement) &&
        !statement.moduleSpecifier &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      )
        for (const item of statement.exportClause.elements)
          result.set(item.name.text, literal(item.propertyName ?? item.name))
      else
        fail(
          statement,
          'Theme modules contain imports, types and exported const defineTheme declarations only.',
        )
    }
    resolving.delete(path)
    resolved.set(path, result)
    const declarations = []
    for (const [name, value] of result) {
      if (
        !value ||
        typeof value !== 'object' ||
        !value.colors ||
        !value.typography ||
        !value.motion
      )
        continue
      validateTheme(value)
      const key =
        'project_' +
        createHash('sha256')
          .update(path + '#' + name)
          .digest('hex')
          .slice(0, 12)
      themes[key] = value
      exports.set(path + '#' + name, { key, theme: value, module: path, export: name })
      declarations.push(
        `${name === 'default' ? 'declare const __mavisDefaultTheme' : 'export declare const ' + name}: MavisTheme & { readonly appearance: ${JSON.stringify(value.appearance)}; readonly __mavisThemeKey: ${JSON.stringify(key)}; readonly __mavisThemeModule: ${JSON.stringify(path)}; readonly __mavisThemeExport: ${JSON.stringify(name)} };${name === 'default' ? ' export default __mavisDefaultTheme;' : ''}`,
      )
    }
    modules.set(path, declarations.join('\n'))
    return result
  }
  for (const path of sources.keys()) read(path)
  let key = selected,
    dark = selected === 'midnight' ? 'midnight' : undefined
  if (!selected) {
    const chosen = exports.get(selection.module + '#' + selection.export)
    if (!chosen)
      throw new PortableError(`${selection.module}: No exported theme ${selection.export}.`)
    key = chosen.key
    if (selection.dark !== undefined) {
      const chosenDark = exports.get(selection.module + '#' + selection.dark)
      if (!chosenDark || chosenDark.theme.appearance !== 'dark')
        throw new PortableError(`${selection.module}: ${selection.dark} must export a dark theme.`)
      dark = chosenDark.key
    }
  }
  const value = themes[key],
    light = value.appearance === 'light' ? key : 'mavis'
  const catalog = {
    themes,
    modules,
    key,
    light,
    dark: dark ?? (selected ? 'midnight' : undefined),
    appearance: !selected && dark ? 'system' : value.appearance,
  }
  return { ...value, __mavisProjectThemes: catalog }
}
