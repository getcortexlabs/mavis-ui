// The route table: the .ts file of the shared folder that Vue Router and vue-router-ns already
// consume, usually routes.ts. It is read as a declared shape, not as a module of values:
//
//   import Home from './Home.vue'                       (./Home.lite for a TSX screen)
//   export const routes = [
//     { path: '/', component: Home },
//     { path: '/places/:id', component: Place, props: true },
//     { path: '/search', component: Search, props: (route) => ({ ...route.query, ...route.params }) },
//     { path: '/:pathMatch(.*)*', component: Missing },
//   ]
//   export const destinations = [{ value: 'places', label: 'Places', href: '/' }]
//
// navigation  { path, home, routes, declared, destinations }: home is the screen at /
//   route        { path, name, segments: [{ static } | { param }], component, props, params,
//                  query, catchAll }: props is 'none', 'params' or 'query'; params and query are
//                  the screen's properties the path and the query string fill, as { name, type }
//                  with a default when the screen has one; name is the route's case in Swift.
//                  routes are in the order they match; declared names them as they were written
//   destination  { value, label, href, icon? }: a top-level place of the app, each with a stack
//                  of its own (NavigationItem, what MTabBar and MNavigationRail take)
import ts from 'typescript'
import { isScreen } from '../components/index.mjs'
import { describe, failure, nameProblem } from '../model.mjs'
import { destinationProblem, isAppDestination, navigationNotes } from './links.mjs'

const tableFile = /^shared\/[^/]+\.ts$/
const screenFile = /\.(?:vue|lite|lite\.tsx)$/

/**
 * Whether a .ts file of the shared folder is the route table: it brings in screens, with import
 * or import(), which a module of values never does.
 */
export function isRouteTable(path, text) {
  if (!tableFile.test(path) || path.endsWith('.d.ts')) return false
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  let found = false
  const visit = (node) => {
    if (ts.isImportDeclaration(node))
      found = !node.importClause?.isTypeOnly && screenFile.test(node.moduleSpecifier.text)
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
      found = screenFile.test(node.arguments[0]?.text ?? '')
    if (!found) ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

const catchAll = '/:pathMatch(.*)*'

const shape =
  "The route table declares export const routes = [{ path: '/', component: Home }] and, for top-level destinations, export const destinations = [{ value: 'home', label: 'Home', href: '/' }]."
const later = {
  redirect: 'redirects are',
  alias: 'aliases are',
  children: 'nested routes are',
  beforeEnter: 'route guards are',
  components: 'named views are',
  modal: 'modal routes are',
  transition: 'route transitions are',
}

const decode = (text) => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

/** The decoded segments of an href's path, or undefined for a path no route can have. */
function segmentsOf(href) {
  const path = href.trim().split('#')[0].split('?')[0]
  if (!path.startsWith('/')) return undefined
  const parts = path.slice(1).split('/')
  if (parts.at(-1) === '') parts.pop()
  return parts.includes('') ? undefined : parts.map(decode)
}

/** The route an href opens, as the generated Swift matches it; undefined when none does. */
export function matchRoute(navigation, href) {
  const segments = segmentsOf(href)
  const route =
    segments &&
    navigation.routes.find(
      (candidate) =>
        !candidate.catchAll &&
        candidate.segments.length === segments.length &&
        candidate.segments.every(
          (segment, index) =>
            segment.param !== undefined ||
            segment.static.toLowerCase() === segments[index].toLowerCase(),
        ),
    )
  return route ?? navigation.routes.find((candidate) => candidate.catchAll)
}

const unwrap = (node) => {
  while (
    node &&
    (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
  )
    node = node.expression
  return node
}
const text = (node) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined

// Static segments before parameters, position by position, as the routers rank their records.
const rank = (a, b) => {
  if (a.catchAll !== b.catchAll) return a.catchAll ? 1 : -1
  for (let index = 0; index < Math.min(a.segments.length, b.segments.length); index++) {
    const left = a.segments[index].param === undefined
    const right = b.segments[index].param === undefined
    if (left !== right) return left ? -1 : 1
  }
  return 0
}

function readRoutes(path, source, find) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
  const fail = (node, message) => {
    const at = node === file ? 0 : node.getStart(file)
    const { line, character } = file.getLineAndCharacterOfPosition(at)
    throw failure([{ file: path, line: line + 1, column: character + 1, message }])
  }
  const sharedPath = (from, node) => {
    const vue = /^\.\/([A-Z][A-Za-z0-9]*)\.vue$/.exec(from)
    const tsx = /^\.\/([A-Z][A-Za-z0-9]*)\.lite(?:\.tsx)?$/.exec(from)
    if (!vue && !tsx)
      fail(
        node,
        `${from} is not a shared screen: a route table imports its screens, as import Home from './Home.vue'.`,
      )
    return vue ? `shared/${vue[1]}.vue` : `shared/${tsx[1]}.lite.tsx`
  }
  const imports = new Map()
  const exported = new Map()
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause
      if (clause?.isTypeOnly) continue
      if (!clause?.name || clause.namedBindings) fail(statement, shape)
      imports.set(clause.name.text, sharedPath(statement.moduleSpecifier.text, statement))
      continue
    }
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) continue
    const list = ts.isVariableStatement(statement) ? statement.declarationList : undefined
    const [declaration] = list?.declarations ?? []
    const name = declaration && ts.isIdentifier(declaration.name) ? declaration.name.text : ''
    const value = unwrap(declaration?.initializer)
    if (
      !list ||
      !(list.flags & ts.NodeFlags.Const) ||
      list.declarations.length !== 1 ||
      !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ||
      !['routes', 'destinations'].includes(name) ||
      !value ||
      !ts.isArrayLiteralExpression(value)
    )
      fail(statement, shape)
    exported.set(name, value)
  }
  if (!exported.has('routes')) fail(file, shape)

  const fields = (node, what, known) => {
    if (!ts.isObjectLiteralExpression(node)) fail(node, `${what} is written out as an object.`)
    const found = new Map()
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
        fail(property, `${what} is written as name: value fields.`)
      const key = property.name.text
      if (!known.includes(key)) fail(property, unknown(what, key, known))
      if (found.has(key)) fail(property, `${key} is set twice.`)
      found.set(key, property)
    }
    return found
  }
  const unknown = (what, key, known) =>
    later[key]
      ? `${key}: ${later[key]} not read for the Mac yet (#341). ${what} has ${known.join(', ')}.`
      : `${what} has ${known.join(', ')}, not ${key}.`

  const propsShape =
    'props is true for the parameters of the path, or (route) => ({ ...route.query, ...route.params }) for the query string as well.'

  const routes = exported.get('routes').elements.map((element) => {
    const found = fields(element, 'A route', ['path', 'component', 'props', 'name', 'meta'])
    const pathNode = found.get('path')?.initializer
    const path = text(pathNode)
    if (path === undefined) fail(element, "A route names its path, for example path: '/places/:id'.")
    const route = { path, node: element, catchAll: path === catchAll, segments: [] }
    if (!route.catchAll) {
      if (!path.startsWith('/')) fail(pathNode, 'A route path starts with /.')
      const body = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
      route.segments = (body === '/' ? [] : body.slice(1).split('/')).map((segment) => {
        if (segment.startsWith(':')) {
          const param = segment.slice(1)
          if (!/^[A-Za-z][A-Za-z0-9]*$/.test(param))
            fail(
              pathNode,
              `${segment} is not a parameter the Mac reads yet (#341): a parameter is :name and fills one segment, and ${catchAll} is the route for everything else.`,
            )
          const problem = nameProblem(param)
          if (problem) fail(pathNode, `The parameter ${param} ${problem}`)
          return { param }
        }
        if (!segment || /[:()*+?]/.test(segment))
          fail(
            pathNode,
            `${path} is not a path the Mac reads yet (#341): write segments of text and :name parameters, such as /places/:id.`,
          )
        return { static: decode(segment) }
      })
      const names = route.segments.flatMap((segment) => segment.param ?? [])
      const twice = names.find((name, index) => names.indexOf(name) !== index)
      if (twice) fail(pathNode, `${path} names the parameter ${twice} twice.`)
    }

    const componentNode = unwrap(found.get('component')?.initializer)
    if (!componentNode)
      fail(element, 'A route opens a screen: give it one, for example component: Home.')
    let target
    if (ts.isIdentifier(componentNode)) target = imports.get(componentNode.text)
    else if (
      ts.isArrowFunction(componentNode) &&
      !componentNode.parameters.length &&
      ts.isCallExpression(componentNode.body) &&
      componentNode.body.expression.kind === ts.SyntaxKind.ImportKeyword &&
      text(componentNode.body.arguments[0]) !== undefined
    )
      target = sharedPath(text(componentNode.body.arguments[0]), componentNode)
    if (!target)
      fail(
        componentNode,
        "A route's component is a screen this file imports, or () => import('./Home.vue').",
      )
    const opened = find(target)
    if (!opened?.component)
      fail(componentNode, `${target} is not a shared screen file of this project.`)
    const component = opened.component
    if (!isScreen(component.view))
      fail(
        componentNode,
        `${component.name} is not a screen: a route opens a whole screen on every target, so make MScreen the root of ${component.name}'s view.`,
      )
    route.component = component.name

    const propsNode = unwrap(found.get('props')?.initializer)
    route.props = 'none'
    if (propsNode) {
      if (propsNode.kind === ts.SyntaxKind.TrueKeyword) route.props = 'params'
      else if (propsNode.kind !== ts.SyntaxKind.FalseKeyword)
        route.props = queryProps(propsNode) ? 'query' : fail(propsNode, propsShape)
      if (route.catchAll && route.props !== 'none')
        fail(propsNode, 'The screen for everything else takes no properties from the route.')
    }
    const nameNode = found.get('name')?.initializer
    if (nameNode && text(nameNode) === undefined) fail(nameNode, 'A route name is written out.')
    route.label = text(nameNode)
    route.meta = found.get('meta')?.getText(file)
    properties(route, component, element)
    return route
  })
  // (route) => ({ ...route.query, ...route.params }): the query string, then the path over it.
  function queryProps(node) {
    if (!ts.isArrowFunction(node) || node.parameters.length !== 1) return false
    const [parameter] = node.parameters
    const body = unwrap(node.body)
    if (!ts.isIdentifier(parameter.name) || !body || !ts.isObjectLiteralExpression(body))
      return false
    const spread = body.properties.map((property) =>
      ts.isSpreadAssignment(property) &&
      ts.isPropertyAccessExpression(property.expression) &&
      ts.isIdentifier(property.expression.expression) &&
      property.expression.expression.text === parameter.name.text
        ? property.expression.name.text
        : undefined,
    )
    return spread.join() === 'query,params'
  }

  // What the route hands the screen, checked against what the screen declares.
  function properties(route, component, node) {
    const named = route.segments.flatMap((segment) => segment.param ?? [])
    const data = component.props.filter((prop) => prop.type.k !== 'function')
    const textual = (type) => type.k === 'string' || (type.k === 'optional' && type.of.k === 'string')
    route.params = []
    route.query = []
    if (route.props === 'none') {
      const needed = data.find((prop) => !('default' in prop))
      if (needed)
        fail(
          node,
          named.includes(needed.name)
            ? `${component.name} needs ${needed.name}: add props: true so the path hands it over.`
            : `${component.name} needs ${needed.name}, which ${route.path} does not provide. Give it a default, or make it a parameter of the path with props: true.`,
        )
      return
    }
    for (const name of named) {
      const prop = data.find((item) => item.name === name)
      if (!prop)
        fail(
          node,
          `${component.name} has no property ${name}: declare ${name}: string in it, or drop props from this route.`,
        )
      if (!textual(prop.type))
        fail(
          node,
          `${component.name} declares ${name} as ${describe(prop.type)}, and a route parameter is text: declare ${name}: string.`,
        )
      route.params.push({ name, type: prop.type })
    }
    for (const prop of data.filter((item) => !named.includes(item.name))) {
      if (route.props === 'query') {
        if (!textual(prop.type) || (prop.type.k === 'string' && !('default' in prop)))
          fail(
            node,
            `${component.name} declares ${prop.name} as ${describe(prop.type)}, and a query value is text that may be missing: declare ${prop.name}?: string.`,
          )
        route.query.push({ name: prop.name, type: prop.type, default: prop.default })
      } else if (!('default' in prop))
        fail(
          node,
          `${component.name} needs ${prop.name}, which ${route.path} does not provide. Give it a default, or make it a parameter of the path.`,
        )
    }
  }

  for (const [index, route] of routes.entries()) {
    const same = routes
      .slice(0, index)
      .find(
        (other) =>
          other.catchAll === route.catchAll &&
          other.segments.length === route.segments.length &&
          rank(other, route) === 0 &&
          other.segments.every(
            (segment, at) =>
              segment.param !== undefined ||
              segment.static.toLowerCase() === route.segments[at].static.toLowerCase(),
          ),
      )
    if (same) fail(route.node, `${route.path} opens the same hrefs as ${same.path} above.`)
  }
  const taken = new Set(['unmatched'])
  for (const route of routes) {
    const words = route.catchAll
      ? ['missing']
      : route.segments.flatMap((segment) =>
          (segment.param ?? segment.static).split(/[^A-Za-z0-9]+/).filter(Boolean),
        )
    const base =
      words
        .map((word, index) =>
          index ? word[0].toUpperCase() + word.slice(1) : word[0].toLowerCase() + word.slice(1),
        )
        .join('') || 'root'
    const safe =
      /^[a-z]/.test(base) && !nameProblem(base) ? base : `route${base[0].toUpperCase()}${base.slice(1)}`
    let name = safe
    for (let next = 2; taken.has(name); next++) name = `${safe}${next}`
    taken.add(name)
    route.name = name
  }

  if (!routes.some((route) => route.catchAll || !route.segments.length))
    fail(
      exported.get('routes'),
      "An app opens at /: give the table a route with path: '/'.",
    )
  const navigation = {
    path,
    routes: [...routes].sort(rank),
    declared: routes.map((route) => route.name),
    destinations: [],
  }
  navigation.home = matchRoute(navigation, '/').component
  const ids = new Set()
  for (const element of exported.get('destinations')?.elements ?? []) {
    const found = fields(element, 'A destination', ['value', 'label', 'href', 'icon'])
    const valueNode = found.get('value')?.initializer
    const value =
      valueNode && ts.isNumericLiteral(valueNode) ? Number(valueNode.text) : text(valueNode)
    const label = text(found.get('label')?.initializer)
    const href = text(found.get('href')?.initializer)
    if (value === undefined || !label?.trim() || href === undefined)
      fail(
        element,
        "A destination is written out with its value, label and href: { value: 'home', label: 'Home', href: '/' }.",
      )
    if (ids.has(String(value))) fail(valueNode, `Two destinations have the value ${value}.`)
    ids.add(String(value))
    const icon = found.get('icon')?.initializer
    if (icon && text(icon) === undefined) fail(icon, 'A destination names its icon as text.')
    const route = isAppDestination(href) && matchRoute(navigation, href)
    if (!route || route.catchAll)
      fail(
        found.get('href'),
        `${href} is not a route of this table: a destination opens one of ${routes.map((item) => item.path).join(', ')}.`,
      )
    navigation.destinations.push({ value, label, href, ...(icon ? { icon: text(icon) } : {}) })
  }
  for (const route of routes) delete route.node
  return navigation
}

/**
 * Reads the route table once every component is read, and checks each component's links and
 * its use of navigation against it. tables are the files isRouteTable claimed, path → text; a
 * problem in one is reported like any other file's.
 */
export function readNavigation({ reader, tables, opened, unread, attempt, find }) {
  let navigation
  const [table, ...others] = [...tables.keys()].sort()
  for (const path of others)
    attempt(path, () => {
      throw failure([
        { file: path, message: `${table} is already the route table: an app has one.` },
      ])
    })
  if (table)
    attempt(table, () => {
      navigation = readRoutes(table, tables.get(table), find)
    })
  const example =
    "add shared/routes.ts with export const routes = [{ path: '/', component: Home }]"
  for (const [path, draft] of [...opened]) {
    if (!draft.component) continue
    const { navigator, links } = navigationNotes(draft.component)
    if (unread.has(path) || (table && !navigation)) continue
    attempt(path, () => {
      if (navigator && !table)
        reader.fail(
          navigator,
          `useMavisNavigation() moves between the screens of the route table, and this project has none: ${example}.`,
        )
      for (const { node, href } of links) {
        const problem = destinationProblem(href)
        if (problem) reader.fail(node, problem)
        if (!isAppDestination(href)) continue
        if (!table)
          reader.fail(
            node,
            `${href} is a screen of the app, and this project has no route table: ${example}.`,
          )
        if (!matchRoute(navigation, href))
          reader.fail(
            node,
            `No route opens ${href}: the routes are ${navigation.routes.map((route) => route.path).join(', ')}.`,
          )
      }
    })
  }
  return navigation
}

/** navigation.push(href), replace(href) and back(): what a screen asks of the app's navigation. */
export function navigateStatement(reader, node, ctx, T) {
  const method = node.expression.name.text
  if (method === 'back') {
    if (node.arguments.length) reader.fail(node, 'back() takes nothing.')
    return { s: 'navigate', method }
  }
  if (!['push', 'replace'].includes(method))
    reader.fail(
      node.expression,
      method === 'resolve'
        ? 'resolve is for the links a host draws itself; a shared screen passes the href to push, replace or a link.'
        : 'Navigation has push(href), replace(href) and back().',
    )
  if (node.arguments.length !== 1) reader.fail(node, `${method} takes the href to open.`)
  return { s: 'navigate', method, href: reader.expr(node.arguments[0], ctx, T.string) }
}

const inStatements = (list) =>
  list.some(
    (statement) =>
      statement.s === 'navigate' ||
      inStatements(statement.then ?? []) ||
      inStatements(statement.else ?? []),
  )
const handlers = (node) =>
  node.v === 'component'
    ? node.props.flatMap(({ value }) => (value.handler ? [value.handler.body] : []))
    : Object.values(node.props ?? {}).flatMap((value) => (value?.body ? [value.body] : []))
const views = (node) => [
  node,
  ...[
    ...(node.children ?? []),
    ...(node.then ?? []),
    ...(node.else ?? []),
    ...(node.body ? [node.body] : []),
    ...(node.slots ?? []).flatMap((slot) => slot.body),
    ...(node.fallback ?? []),
  ].flatMap(views),
]

/** Whether a component calls navigation in one of its actions or handlers. */
export const callsNavigation = (component) =>
  component.actions.some((action) => inStatements(action.body)) ||
  views(component.view).some((node) => handlers(node).some(inStatements))

/** Whether a component's view reaches the app's navigation: by calling it, or through a link. */
export const usesNavigation = (component) =>
  callsNavigation(component) ||
  views(component.view).some((node) => node.v === 'element' && node.props.href)
