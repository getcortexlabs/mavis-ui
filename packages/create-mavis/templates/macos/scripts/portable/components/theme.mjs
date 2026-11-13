import { union } from './shared.mjs'

/** The themes Mavis exports; the Mac knows their colors while generating. */
export const builtInThemes = ['mavis', 'midnight']
const appearances = ['system', 'light', 'dark']
const core = '@getcortexlabs/mavis-core'
const later =
  'Declare custom themes with defineTheme in a shared .ts theme module, then import the exported theme by name.'

/** Why a name a shared file imports from @getcortexlabs/mavis-core does not reach the Mac. */
export const themeImport = (name, from) =>
  name === 'defineTheme'
    ? `defineTheme belongs to a shared theme module. ${later}`
    : `${name} from ${from} is not available to shared screens on the Mac yet; import the themes ${builtInThemes.join(' and ')}.`

// theme and darkTheme: one of the themes Mavis exports, imported by name from the core.
function theme({ key, attribute, value, fail, ts, checker }) {
  const problem = `${key} takes a theme Mavis exports, ${builtInThemes.join(' or ')}, imported from ${core}. ${later}`
  if (!ts.isIdentifier(value)) fail(attribute, problem)
  const declaration = checker.getSymbolAtLocation(value)?.declarations?.[0]
  if (!declaration || !ts.isImportSpecifier(declaration)) fail(attribute, problem)
  const from = declaration.parent.parent.parent.moduleSpecifier.text
  const name = (declaration.propertyName ?? declaration.name).text
  if (from === core && builtInThemes.includes(name)) return { lit: name }
  const type = checker.getTypeAtLocation(value)
  const literal = (name) => {
    const property = type.getProperty(name)
    const declared = property && checker.getTypeOfSymbolAtLocation(property, value)
    return declared?.isStringLiteral() ? declared.value : undefined
  }
  const themeKey = literal('__mavisThemeKey'),
    module = literal('__mavisThemeModule'),
    exported = literal('__mavisThemeExport'),
    appearance = literal('appearance')
  if (!themeKey || !module || !exported) fail(attribute, problem)
  return { lit: themeKey, module, exported, appearance }
}

function appearance({ key, attribute, value, ctx, expr, fail, ts, T }) {
  if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
  if (!appearances.includes(value.text)) fail(attribute, `${key} is ${appearances.join(', ')}.`)
  return { lit: value.text }
}

// themeProviderProps: renderless, like the Web and NativeScript provider. Its content sits in
// the stack around it and draws with the scoped theme; the rest of the window keeps its own.
export const MThemeProvider = {
  props: { theme, darkTheme: theme, appearance },
  children: 'elements',
  types: () => `type MavisTheme = { readonly name: string; readonly appearance: 'light' | 'dark' }
type MavisAppearanceMode = ${union(appearances)}
declare module '${core}' {
  export const mavis: MavisTheme & { readonly appearance: 'light' }
  export const midnight: MavisTheme & { readonly appearance: 'dark' }
  export function defineTheme(...definition: unknown[]): MavisTheme
}`,
  declaration:
    "declare function MThemeProvider(props: { theme?: MavisTheme; darkTheme?: MavisTheme & { readonly appearance: 'dark' }; appearance?: MavisAppearanceMode; children?: unknown }): JSX.Element",
  check({ props, attrs, fail }) {
    if (
      props.darkTheme &&
      (props.darkTheme.appearance ?? (props.darkTheme.lit === 'midnight' ? 'dark' : 'light')) !==
        'dark'
    )
      fail(attrs.get('darkTheme'), 'darkTheme must be a dark theme.')
  },
  swift(node, { emit, indent, tokens }) {
    const pad = ' '.repeat(indent)
    const { theme: scoped, darkTheme, appearance: mode } = node.props
    const args = [
      ...(scoped ? [`theme: .${scoped.lit}`] : []),
      ...(darkTheme ? [`darkTheme: .${darkTheme.lit}`] : []),
      ...(mode
        ? [
            `appearance: ${'lit' in mode ? `.${mode.lit}` : `MavisAppearanceMode(${emit.expr(mode.expr)})`}`,
          ]
        : []),
    ]
    return [
      `${pad}MavisThemeProvider(${args.join(', ')}) {`,
      ...(tokens.scoped ? [`${pad}    MavisThemeReader { mavisTheme in`] : []),
      node.children
        .map((child) => emit.view(child, indent + (tokens.scoped ? 8 : 4), tokens))
        .join('\n') || `${pad}    EmptyView()`,
      ...(tokens.scoped ? [`${pad}    }`] : []),
      `${pad}}`,
    ].join('\n')
  },
  swiftRuntime:
    () => `/// The Mac's own appearance, which an MThemeProvider with appearance system follows: the
/// setting in System Settings, whatever the window was made to use.
final class MavisSystemAppearance: ObservableObject {
    static let shared = MavisSystemAppearance()
    @Published private(set) var current = MavisSystemAppearance.read()
    private var observer: NSObjectProtocol?

    private init() {
        observer = DistributedNotificationCenter.default().addObserver(
            forName: Notification.Name("AppleInterfaceThemeChangedNotification"), object: nil, queue: .main
        ) { [weak self] _ in
            self?.current = MavisSystemAppearance.read()
        }
    }

    private static func read() -> MavisAppearance {
        UserDefaults.standard.string(forKey: "AppleInterfaceStyle") == "Dark" ? .dark : .light
    }
}

/// MThemeProvider: its content draws with another theme or appearance, and the rest of the
/// window keeps its own. It adds no view: the content sits in the stack around it.
struct MavisThemeProvider<Content: View>: View {
    var theme: MavisPalette? = nil
    var darkTheme: MavisPalette? = nil
    var appearance: MavisAppearanceMode? = nil
    @ViewBuilder var content: () -> Content
    @Environment(\\.mavisTheme) private var around
    @ObservedObject private var system = MavisSystemAppearance.shared

    var body: some View {
        Group { content() }
            .environment(\\.mavisTheme, around.scoped(theme: theme, darkTheme: darkTheme, appearance: appearance, system: system.current))
    }
}`,
  vue: {
    attribute(name, value) {
      if (name === 'theme' || name === 'darkTheme')
        return `:${name}="${value.module ? `mavisTheme_${value.lit}` : value.lit}"`
    },
    // The themes come from the core, on the Web and on NativeScript.
    script(
      nodes,
      {
        shared = '#shared-ui',
        sourceRoot = 'shared',
        relative = (a, b) => b.replace(/^shared\//, ''),
      } = {},
    ) {
      const imports = {}
      for (const node of nodes)
        for (const key of ['theme', 'darkTheme']) {
          const value = node.props[key]
          if (!value) continue
          const from = value.module
            ? `${shared}/${relative(sourceRoot, value.module).replace(/\.ts$/, '')}`
            : core
          const name = value.module ? `${value.exported} as mavisTheme_${value.lit}` : value.lit
          ;(imports[from] ??= []).push(name)
        }
      return { imports }
    },
  },
}
