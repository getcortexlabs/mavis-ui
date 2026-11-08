import ts from 'typescript'

const allowed = {
  MColumn: ['gap', 'padding'],
  MRow: ['gap', 'padding'],
  MText: ['variant', 'tone'],
  MButton: ['text', 'variant', 'onClick'],
}
const reserved = new Set(
  'self body description init let var func class struct enum protocol extension import return true false nil default switch case if else for while repeat break continue throw throws try catch await async in is as some any private public internal static typealias defer guard do super associatedtype deinit fileprivate inout operator rethrows subscript where'.split(
    ' ',
  ),
)

/** A deliberately bounded grammar, checked before Mitosis can drop unsupported code. */
export function validateSource(source) {
  const file = ts.createSourceFile(
    'shared/Welcome.lite.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const fail = (node, message) => {
    const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file))
    throw new Error(`${file.fileName}:${line + 1}:${character + 1}: ${message}`)
  }
  if (file.parseDiagnostics.length) fail(file, 'Invalid TSX syntax.')
  const statements = file.statements
  const imp = statements[0]
  if (
    statements.length !== 2 ||
    !imp ||
    !ts.isImportDeclaration(imp) ||
    imp.moduleSpecifier.text !== '@builder.io/mitosis' ||
    imp.importClause?.name ||
    imp.importClause?.isTypeOnly ||
    imp.attributes ||
    !imp.importClause?.namedBindings ||
    !ts.isNamedImports(imp.importClause.namedBindings) ||
    imp.importClause.namedBindings.elements.length !== 1 ||
    imp.importClause.namedBindings.elements[0].name.text !== 'useStore' ||
    imp.importClause.namedBindings.elements[0].propertyName
  )
    fail(
      file,
      'Import only { useStore } from @builder.io/mitosis, followed by export default function Welcome().',
    )
  const fn = statements[1]
  if (
    !ts.isFunctionDeclaration(fn) ||
    fn.name?.text !== 'Welcome' ||
    fn.parameters.length ||
    fn.typeParameters ||
    fn.asteriskToken ||
    fn.type ||
    fn.modifiers?.map((m) => m.kind).join(',') !==
      [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].join(',') ||
    fn.body?.statements.length !== 2
  )
    fail(
      fn,
      'Use export default function Welcome() with one state declaration and one JSX return. Hooks, props and arbitrary functions are not supported yet.',
    )
  const declaration = fn.body.statements[0]
  if (
    !ts.isVariableStatement(declaration) ||
    declaration.declarationList.flags !== ts.NodeFlags.Const ||
    declaration.declarationList.declarations.length !== 1
  )
    fail(declaration, 'Declare const state = useStore({ ... }).')
  const store = declaration.declarationList.declarations[0]
  if (
    !ts.isIdentifier(store.name) ||
    store.name.text !== 'state' ||
    store.type ||
    !store.initializer ||
    !ts.isCallExpression(store.initializer) ||
    store.initializer.expression.getText(file) !== 'useStore' ||
    store.initializer.typeArguments ||
    store.initializer.arguments.length !== 1 ||
    !ts.isObjectLiteralExpression(store.initializer.arguments[0])
  )
    fail(store, 'Declare const state = useStore({ ... }) without type arguments.')
  const state = new Map()
  const literal = (node) => {
    if (ts.isStringLiteral(node)) return { kind: 'string', value: node.text }
    if (ts.isNumericLiteral(node) && /^\d+$/.test(node.text) && Number(node.text) <= 2147483647)
      return { kind: 'number', value: Number(node.text) }
    if ([ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(node.kind))
      return { kind: 'boolean', value: node.kind === ts.SyntaxKind.TrueKeyword }
    return null
  }
  for (const prop of store.initializer.arguments[0].properties) {
    if (
      !ts.isPropertyAssignment(prop) ||
      !ts.isIdentifier(prop.name) ||
      reserved.has(prop.name.text) ||
      !/^[a-z][a-zA-Z0-9]*$/.test(prop.name.text) ||
      state.has(prop.name.text)
    )
      fail(prop, 'State needs unique, simple names (not Swift keywords) and literal values.')
    const value = literal(prop.initializer)
    if (!value)
      fail(prop, 'State supports strings, booleans and non-negative 32-bit integer literals only.')
    state.set(prop.name.text, value)
  }
  const reference = (node) =>
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'state' &&
    state.has(node.name.text)
      ? node.name.text
      : null
  const action = (node) => {
    if (
      !ts.isArrowFunction(node) ||
      node.parameters.length ||
      node.modifiers ||
      node.typeParameters ||
      node.type
    )
      fail(node, 'onClick supports a zero-argument arrow with one state assignment.')
    let body = node.body
    while (ts.isParenthesizedExpression(body)) body = body.expression
    if (
      !ts.isBinaryExpression(body) ||
      body.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
      !reference(body.left)
    )
      fail(body, 'Assign one declared state property, for example state.sparks = state.sparks + 1.')
    const key = reference(body.left),
      value = literal(body.right)
    if (value?.kind === state.get(key).kind) return
    if (
      state.get(key).kind === 'number' &&
      ts.isBinaryExpression(body.right) &&
      reference(body.right.left) === key &&
      body.right.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      literal(body.right.right)?.kind === 'number'
    )
      return
    fail(
      body.right,
      'Only same-type literal assignments or integer increments are supported. Calls, effects and other expressions need a future compiler contract.',
    )
  }
  const jsx = (node, parent) => {
    if (ts.isParenthesizedExpression(node)) return jsx(node.expression, parent)
    if (ts.isJsxText(node)) {
      if (node.text.trim() && parent !== 'MText') fail(node, 'Put text inside MText.')
      return
    }
    if (ts.isJsxExpression(node)) {
      if (parent !== 'MText' || !node.expression || !reference(node.expression))
        fail(node, 'Text bindings must reference one declared state property.')
      return
    }
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node))
      fail(
        node,
        'Use MColumn, MRow, MText and MButton. HTML, loops, conditionals and other components are not supported yet.',
      )
    const tag = ts.isJsxElement(node) ? node.openingElement : node
    const name = tag.tagName.getText(file)
    if (!allowed[name]) fail(tag, `${name} is not part of the experimental macOS subset.`)
    const names = new Set()
    for (const attr of tag.attributes.properties) {
      if (
        !ts.isJsxAttribute(attr) ||
        !allowed[name].includes(attr.name.text) ||
        names.has(attr.name.text)
      )
        fail(
          attr,
          `Unsupported or duplicate ${name} property. Supported: ${allowed[name].join(', ')}.`,
        )
      names.add(attr.name.text)
      if (attr.name.text === 'onClick') {
        if (
          !attr.initializer ||
          !ts.isJsxExpression(attr.initializer) ||
          !attr.initializer.expression
        )
          fail(attr, 'onClick needs an arrow function.')
        action(attr.initializer.expression)
      } else if (!attr.initializer || !ts.isStringLiteral(attr.initializer))
        fail(attr, 'Use literal string properties; dynamic styling is not supported yet.')
    }
    if (name === 'MButton' && (!names.has('text') || !names.has('onClick')))
      fail(tag, 'MButton requires text and onClick.')
    const children = ts.isJsxElement(node)
      ? node.children.filter((c) => !ts.isJsxText(c) || c.text.trim())
      : []
    if (
      name === 'MText' &&
      (children.length !== 1 || !(ts.isJsxText(children[0]) || ts.isJsxExpression(children[0])))
    )
      fail(node, 'MText needs one literal text or state binding, without nested markup.')
    if (name === 'MButton' && children.length) fail(node, 'Use the text property on MButton.')
    children.forEach((child) => jsx(child, name))
  }
  const ret = fn.body.statements[1]
  if (!ts.isReturnStatement(ret) || !ret.expression) fail(ret, 'Return the shared screen as JSX.')
  jsx(ret.expression)
  return state
}

const binding = (code) => ({ code, type: 'single', bindingType: 'expression' })
const nativeString = (text) => {
  if (!text.isWellFormed()) throw new Error('Text must contain well-formed Unicode.')
  return (
    '"' +
    Array.from(text, (char) => {
      if (char === '\\') return '\\\\'
      if (char === '"') return '\\"'
      return char.codePointAt(0) < 32 ? `\\u{${char.codePointAt(0).toString(16)}}` : char
    }).join('') +
    '"'
  )
}
const node = (name, properties = {}, bindings = {}, children = []) => ({
  '@type': '@builder.io/mitosis/node',
  name,
  properties,
  bindings,
  children,
  meta: {},
  scope: {},
})

export async function compileWelcome(source, themeName = 'mavis') {
  const state = validateSource(source)
  const [{ parseJsx, componentToSwift, componentToVue }, core] = await Promise.all([
    import('@builder.io/mitosis'),
    import('@getcortexlabs/mavis-core'),
  ])
  if (!['mavis', 'midnight'].includes(themeName)) throw new Error('Unknown starter theme.')
  const theme = core[themeName]
  const parsed = parseJsx(source)
  const wrappers = []
  // Keep string literals outside Mitosis's generic formatter: it decodes \\n.
  // Its Swift generator still owns state, actions and the view tree.
  const literals = []
  const textLiteral = (value) => {
    const key = `text${literals.length}`
    literals.push(`static let ${key} = ${nativeString(value)}`)
    return `MavisLiterals.${key}`
  }
  const nativeAction = (code) => {
    const file = ts.createSourceFile('action.ts', code, ts.ScriptTarget.Latest, true)
    const result = ts.transform(file, [
      (context) => {
        const visit = (node) =>
          ts.isStringLiteral(node)
            ? ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('MavisLiterals'),
                textLiteral(node.text).split('.')[1],
              )
            : ts.visitEachChild(node, visit, context)
        return (node) => ts.visitNode(node, visit)
      },
    ])
    try {
      return ts.createPrinter().printFile(result.transformed[0]).trim()
    } finally {
      result.dispose()
    }
  }
  const colors = Object.entries(theme.colors)
    .map(([key, value]) => {
      if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Unsupported color token ${key}.`)
      const hex = Number.parseInt(value.slice(1), 16)
      return `static let ${key} = Color(red: ${((hex >> 16) & 255) / 255}, green: ${((hex >> 8) & 255) / 255}, blue: ${(hex & 255) / 255})`
    })
    .join('\n')
  const token = (family, value, fallback) => {
    const key = value ?? fallback
    if (!Object.hasOwn(family, key))
      throw new Error(`shared/Welcome.lite.tsx: Unsupported token ${key}.`)
    return family[key]
  }
  const lower = (input) => {
    const p = input.properties
    let output,
      modifiers = []
    if (input.name === 'MColumn' || input.name === 'MRow') {
      output = node(
        input.name === 'MColumn' ? 'div' : 'HStack',
        {
          spacing: String(token(theme.space, p.gap, 'none')),
          alignment: input.name === 'MColumn' ? 'leading' : 'center',
        },
        {},
        input.children.map(lower),
      )
      if (Object.hasOwn(p, 'padding')) modifiers.push(`.padding(${token(theme.space, p.padding)})`)
    } else if (input.name === 'MText') {
      const child = input.children[0]
      const ref = child.bindings._text?.code
      const content = ref
        ? state.get(ref.slice(6)).kind === 'string'
          ? ref
          : `String(${ref})`
        : textLiteral(child.properties._text.replace(/\s*\n\s*/g, ' ').trim())
      output = node('p', {}, { innerHTML: binding(content) })
      const typo = token(theme.typography, p.variant, 'body')
      const weights = {
        normal: 'regular',
        bold: 'bold',
        100: 'ultraLight',
        200: 'thin',
        300: 'light',
        400: 'regular',
        500: 'medium',
        600: 'semibold',
        700: 'bold',
        800: 'heavy',
        900: 'black',
      }
      token(theme.colors, p.tone, 'text')
      modifiers.push(
        `.font(.system(size: ${typo.fontSize}, weight: .${weights[typo.fontWeight]}))`,
        `.foregroundStyle(MavisTokens.${p.tone ?? 'text'})`,
        '.fixedSize(horizontal: false, vertical: true)',
      )
      if (['title', 'heading', 'display'].includes(p.variant))
        modifiers.push('.accessibilityAddTraits(.isHeader)')
    } else {
      if (!['primary', 'secondary'].includes(p.variant ?? 'primary'))
        throw new Error(
          'shared/Welcome.lite.tsx: MButton supports primary and secondary variants in this experiment.',
        )
      output = node(
        'button',
        {},
        { onClick: { ...input.bindings.onClick, code: nativeAction(input.bindings.onClick.code) } },
        [node('p', {}, { innerHTML: binding(textLiteral(p.text)) })],
      )
      modifiers.push(
        `.buttonStyle(MavisStarterButtonStyle(secondary: ${p.variant === 'secondary'}))`,
      )
    }
    const name = `MavisStyle${wrappers.length}`
    wrappers.push(`private struct ${name}<Content: View>: View {
      let content: Content
      init(@ViewBuilder content: () -> Content) { self.content = content() }
      var body: some View { content\n${modifiers.join('\n')} }
    }`)
    return node(name, {}, {}, [output])
  }
  const plugin = () => ({
    json: {
      pre(json) {
        for (const [key, value] of state) {
          json.state[key].typeParameter = { number: 'Int', string: 'String', boolean: 'Bool' }[
            value.kind
          ]
          json.state[key].code =
            value.kind === 'string' ? textLiteral(value.value) : String(value.value)
        }
        json.children = json.children.map(lower)
        return json
      },
    },
    code: {
      post(code, _json) {
        return `${code}\nprivate enum MavisLiterals {\n${literals.join('\n')}\n}\n${wrappers.join('\n')}`
      },
    },
  })
  const swift = componentToSwift({ includePreview: false, plugins: [plugin] })({
    component: parsed,
  })
  const vue = componentToVue({ api: 'composition' })({ component: parsed })
  return {
    swift,
    vue,
    tokens: `enum MavisTokens {\n${colors}\n}
private struct MavisStarterButtonStyle: ButtonStyle {
    let secondary: Bool
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .padding(.horizontal, 20).padding(.vertical, 12)
            .foregroundStyle(secondary ? MavisTokens.text : MavisTokens.onPrimary)
            .background(secondary ? MavisTokens.elevated : MavisTokens.primary, in: RoundedRectangle(cornerRadius: 12))
            .opacity(configuration.isPressed ? 0.8 : 1)
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.98 : 1)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.15), value: configuration.isPressed)
    }
}`,
  }
}
