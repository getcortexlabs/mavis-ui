// What a project's route table becomes: MavisNavigation.swift for the Mac, with the typed route
// its NavigationStack keeps as path, and for the Vue hosts of generated screens the same table
// with their generated files.
import { jsString } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'

const destinationStyles = ['sidebar', 'toolbar']

/** How the Mac offers top-level destinations; sidebar unless the project asks for the toolbar. */
export function destinationStyle(style = 'sidebar') {
  if (!destinationStyles.includes(style))
    throw new Error(`Destinations are shown as ${destinationStyles.join(' or ')}, not ${style}.`)
  return style
}

const isMissing = (value) => value.default?.e === 'undefined'
// What a route's case carries: every parameter of its path, then the query values it reads.
const payload = (route) => [
  ...route.segments.flatMap((segment) =>
    segment.param === undefined ? [] : [{ name: segment.param, optional: false }],
  ),
  ...route.query.map((value) => ({ ...value, optional: !value.default || isMissing(value) })),
]

/**
 * MavisRoute, the app's routes as one type: the route an href opens, the href that names it
 * again and its screen; and MavisNavigationHost, the window's content.
 */
export function emitNavigation(navigation, model, emitter, header, namespace, style) {
  const pad = namespace ? '    ' : ''
  const components = new Map(model.components.map((component) => [component.name, component]))
  const routes = navigation.routes.filter((route) => !route.catchAll)
  const missing = navigation.routes.find((route) => route.catchAll)
  const bound = (route, used = payload(route).map((value) => value.name)) =>
    payload(route).some((value) => used.includes(value.name))
      ? `(${payload(route)
          .map((value) => (used.includes(value.name) ? `let ${value.name}` : '_'))
          .join(', ')})`
      : ''

  const cases = routes.map((route) => {
    const values = payload(route).map(
      (value) => `${value.name}: String${value.optional ? '?' : ''}`,
    )
    return `    case ${route.name}${values.length ? `(${values.join(', ')})` : ''}`
  })

  const matches = routes.map((route) => {
    const tests = [
      `path.count == ${route.segments.length}`,
      ...route.segments.flatMap((segment, index) =>
        segment.param === undefined
          ? [`lower[${index}] == ${swiftString(segment.static.toLowerCase())}`]
          : [],
      ),
    ]
    const values = [
      ...route.segments.flatMap((segment, index) =>
        segment.param === undefined ? [] : [`${segment.param}: path[${index}]`],
      ),
      ...route.query.map((value) => {
        const read = `location.query[${swiftString(value.name)}]`
        return `${value.name}: ${value.default && !isMissing(value) ? `${read} ?? ${emitter.expr(value.default)}` : read}`
      }),
    ]
    return `            if ${tests.join(', ')} { self = .${route.name}${values.length ? `(${values.join(', ')})` : ''}; return }`
  })
  const lowered = routes.some((route) =>
    route.segments.some((segment) => segment.param === undefined),
  )

  const hrefs = routes.map((route) => {
    const segments = route.segments.map((segment) =>
      segment.param === undefined ? swiftString(segment.static) : segment.param,
    )
    const query = route.query.map((value) => `(${swiftString(value.name)}, ${value.name})`)
    return `        case .${route.name}${bound(route)}: return MavisLocation.href([${segments.join(', ')}]${query.length ? `, [${query.join(', ')}]` : ''})`
  })

  const given = (route) => [...route.params, ...route.query].map((value) => value.name)
  const screen = (route) => {
    const component = components.get(route.component)
    const args = component.props.flatMap((prop) => {
      if (prop.type.k === 'function')
        return [
          `${prop.name}: { ${prop.type.params.map(() => '_').join(', ')}${prop.type.params.length ? ' in ' : ''}}`,
        ]
      return given(route).includes(prop.name) ? [`${prop.name}: ${prop.name}`] : []
    })
    return `${route.component}(${args.join(', ')})`
  }
  const screens = routes.map(
    (route) => `        case .${route.name}${bound(route, given(route))}: ${screen(route)}`,
  )

  const destinations = navigation.destinations.map(
    (destination) =>
      `            MavisRouteDestination(id: ${swiftString(String(destination.value))}, label: ${swiftString(destination.label)}, href: ${swiftString(destination.href)}),`,
  )
  const lines = [
    `// ${header}`,
    'import SwiftUI',
    '',
    `/// The app's routes, from ${navigation.path}: the typed path of its NavigationStack.`,
    'enum MavisRoute: MavisRouting {',
    ...cases,
    '    /// An href no route of the table opens.',
    '    case unmatched(href: String)',
    '',
    '    init(href: String) {',
    '        let location = MavisLocation(href)',
    '        if let path = location.segments {',
    ...(lowered ? ['            let lower = path.map { $0.lowercased() }'] : []),
    ...matches,
    ...(matches.length ? [] : ['            _ = path']),
    '        }',
    '        self = .unmatched(href: location.href)',
    '    }',
    '',
    '    var href: String {',
    '        switch self {',
    ...hrefs,
    '        case .unmatched(let href): return href',
    '        }',
    '    }',
    '',
    '    @MainActor @ViewBuilder var screen: some View {',
    '        switch self {',
    ...screens,
    `        case .unmatched: ${missing ? screen(missing) : 'MavisScreen { EmptyView() }'}`,
    '        }',
    '    }',
    '}',
    '',
    "/// The window's content: the screens of the route table in a NavigationStack" +
      (destinations.length ? ', one for each top-level destination.' : '.'),
    'struct MavisNavigationHost: View {',
    '    var store: MavisNavigationStore? = nil',
    '',
    '    var body: some View {',
    ...(destinations.length
      ? [
          '        MavisNavigationView<MavisRoute>(store: store, destinations: [',
          ...destinations,
          `        ], style: .${destinationStyle(style)})`,
        ]
      : ['        MavisNavigationView<MavisRoute>(store: store)']),
    '    }',
    '}',
  ]
  return [
    lines.slice(0, 3),
    namespace ? [`extension ${namespace} {`] : [],
    lines.slice(3).map((line) => (line ? `${pad}${line}` : line)),
    namespace ? ['}'] : [],
    [''],
  ]
    .flat()
    .join('\n')
}

/**
 * The route table for a Vue host whose screens are generated: the same records, in the order
 * they were written, with the generated files.
 */
export function emitRoutes(navigation, header) {
  const routes = navigation.declared.map((name) =>
    navigation.routes.find((route) => route.name === name),
  )
  const imports = [...new Set(routes.map((route) => route.component))].sort()
  const record = (route) =>
    [
      `path: ${jsString(route.path)}`,
      ...(route.label === undefined ? [] : [`name: ${jsString(route.label)}`]),
      `component: ${route.component}`,
      ...(route.props === 'params' ? ['props: true'] : []),
      ...(route.props === 'query'
        ? [
            'props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params })',
          ]
        : []),
      ...(route.meta ? [route.meta] : []),
    ].join(', ')
  return [
    `// ${header}`,
    ...imports.map((name) => `import ${name} from './${name}.vue'`),
    '',
    'export const routes = [',
    ...routes.map((route) => `  { ${record(route)} },`),
    ']',
    ...(navigation.destinations.length
      ? [
          '',
          'export const destinations = [',
          ...navigation.destinations.map(
            (destination) =>
              `  { value: ${typeof destination.value === 'number' ? destination.value : jsString(destination.value)}, label: ${jsString(destination.label)}, href: ${jsString(destination.href)}${destination.icon ? `, icon: ${jsString(destination.icon)}` : ''} },`,
          ),
          ']',
        ]
      : []),
    '',
  ].join('\n')
}
