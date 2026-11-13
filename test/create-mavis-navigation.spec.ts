import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { linkProps } from '../packages/core/src/vue/props'
import { isAppDestination as coreIsAppDestination } from '../packages/core/src/link'
import {
  checkShared,
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
import {
  isRouteTable,
  matchRoute,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/navigation/routes.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { isAppDestination } from '../packages/create-mavis/templates/macos/scripts/portable/navigation/links.mjs'
import { mavis } from '../packages/core/src/index'
import { defineNavigationTransition } from '../packages/core/src/navigation-transition'

const portable = new URL('./portable/', import.meta.url).pathname

type Route = {
  path: string
  name: string
  component: string
  props: string
  catchAll: boolean
  params: { name: string }[]
  query: { name: string }[]
}
type Output = {
  model: {
    components: { name: string; view: unknown }[]
    navigation?: {
      path: string
      home: string
      routes: Route[]
      declared: string[]
      destinations: { value: string | number; label: string; href: string; icon?: string }[]
    }
  }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>, options = {}): Promise<Output> =>
  compileProject(shared(files), { root: 'Home', ...options })
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
const screen = (template: string, script = '') =>
  vue(script, `  <MScreen>\n    <MColumn>\n${template}\n    </MColumn>\n  </MScreen>`)
const tsx = (name: string, view: string, { props = '', before = '', members = '' } = {}) =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function ${name}(${props ? `props: ${props}` : ''}) {\n${before}  const state = useStore({\n    count: 0,\n${members}  })\n  return (\n    <MScreen>\n      <MColumn>\n${view}\n      </MColumn>\n    </MScreen>\n  )\n}\n`
const table = (records: string, imports = ['Home']) =>
  `${imports.map((name) => `import ${name} from './${name}.vue'`).join('\n')}\n\nexport const routes = [\n${records}\n]\n`
const home = screen('      <MText as="h1">Home</MText>')
const place = screen('      <MText>{{ id }}</MText>', 'defineProps<{ id: string }>()')
const routedHome = (template: string, script = '') => ({
  'routes.ts': table(
    "  { path: '/', component: Home },\n  { path: '/places/:id', component: Place, props: true },",
    ['Home', 'Place'],
  ),
  'Home.vue': screen(template, script),
  'Place.vue': place,
})
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' && typeof value === 'string' && value.startsWith('shared/')
        ? undefined
        : value instanceof Map
          ? [...value.keys()]
          : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])
const fixture = async (name: string, options = {}): Promise<Output> =>
  compileProject(await readShared(join(portable, name)), { root: 'Home', ...options })
const failure = async (files: Record<string, string>, options = {}) => {
  try {
    await compile(files, options)
  } catch (error) {
    return (error as Error).message
  }
  return ''
}

describe('shared navigation transition policies', () => {
  const policyModule = (options: string) =>
    `import { defineNavigationTransition as transition, type NavigationTransition } from '@getcortexlabs/mavis-core'\nexport const pageTransition = transition(${options})\n`
  const policyHome = screen(
    '      <MText>{{ pageTransition.name }} {{ pageTransition.duration }}</MText>',
    "import { pageTransition } from './page-transition'",
  )

  it.each([
    ['', {}],
    ['{}', {}],
    ['undefined', {}],
    [
      "{ name: 'slide', duration: 320 } satisfies NavigationTransition",
      { name: 'slide', duration: 320 },
    ],
    ["{ name: 'none', duration: 0 }", { name: 'none', duration: 0 }],
    ["{ name: 'fade', duration: 10000 }", { name: 'fade', duration: 10000 }],
    ['{ name: undefined, duration: undefined }', {}],
  ])('preserves the public policy and its defaults for %s', async (source, options) => {
    const { swift, model, direct } = await compile({
      'page-transition.ts': policyModule(source as string),
      'Home.vue': policyHome,
    })
    const expected = defineNavigationTransition(
      options as Parameters<typeof defineNavigationTransition>[0],
    )
    const module = swift.get('PageTransitionModule.swift')!
    expect(module).toContain(`name: "${expected.name}", duration: ${expected.duration}`)
    expect(module).toContain('Mac navigation uses the plain NavigationStack fallback')
    expect(swift.get('MavisTypes.swift')).toContain('struct NavigationTransitionPolicy: Hashable')
    expect(swift.get('Home.swift')).toContain('PageTransitionModule.pageTransition')
    expect(direct).toContain('shared/Home.vue')
    expect(model.navigation).toBeUndefined()
  })

  it('reads the same policy module from TSX and Vue without changing routes or applying a host adapter', async () => {
    const source = policyModule("{ name: 'slide', duration: 250 }")
    const fromVue = await compile({ 'page-transition.ts': source, 'Home.vue': policyHome })
    const fromTsx = await compile({
      'page-transition.ts': source,
      'Home.lite.tsx': `import { pageTransition } from './page-transition'\nexport default function Home() { return <MScreen><MColumn><MText>{pageTransition.name} {pageTransition.duration}</MText></MColumn></MScreen> }`,
    })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it('preserves typed params and back in the policy conformance fixtures', async () => {
    const fromTsx = await fixture('navigationPolicy')
    const fromVue = await fixture('navigationPolicyVue')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.model.navigation?.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/details/:id',
          params: [{ name: 'id', type: { k: 'string' } }],
        }),
      ]),
    )
  })

  it.each([
    ["{ name: 'zoom' }", /not assignable|fade, slide or none/],
    ['{ duration: -1 }', /between 0 and 10000/],
    ['{ duration: 10001 }', /between 0 and 10000/],
    ['{ duration: Infinity }', /finite number literal/],
    ['{ duration: NaN }', /finite number literal/],
    ['{ duration: 120 + 100 }', /finite number literal/],
    ["{ name: ('slide' as string) }", /not assignable/],
    ['{ ...{} }', /literal properties/],
    ["{ ['name']: 'slide' }", /literal properties/],
    ["{ sharedElements: ['hero'] }", /known properties/],
  ])('rejects an unsupported policy without silently changing it: %s', async (source, message) => {
    expect(await failure({ 'page-transition.ts': policyModule(source), 'Home.vue': home })).toMatch(
      message,
    )
  })

  it('does not treat a shadowed factory parameter as the imported function', async () => {
    const source = `import { defineNavigationTransition } from '@getcortexlabs/mavis-core'\nexport function make(defineNavigationTransition: (value: number) => void): number { defineNavigationTransition(1); return 2 }`
    expect(await failure({ 'page-transition.ts': source, 'Home.vue': home })).toMatch(
      /Functions can only|parameter is a value/,
    )
  })
})

describe('the route table', () => {
  it('reads the routes fixture into one model and one SwiftUI app from TSX and from Vue', async () => {
    const fromTsx = await fixture('routes')
    const fromVue = await fixture('routesVue')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toHaveLength(5)
    expect(fromTsx.direct).toEqual([])
  })

  it('is the .ts file that brings in screens, and a module of values never is', async () => {
    expect(isRouteTable('shared/routes.ts', "import Home from './Home.vue'\n")).toBe(true)
    expect(isRouteTable('shared/pages.ts', "import Home from './Home.lite'\n")).toBe(true)
    expect(
      isRouteTable(
        'shared/lazy.ts',
        "export const routes = [{ path: '/', component: () => import('./Home.vue') }]\n",
      ),
    ).toBe(true)
    expect(isRouteTable('shared/routes.ts', 'export const routes = ["bus", "tram"]\n')).toBe(false)
    expect(isRouteTable('shared/types.ts', "import type Home from './Home.vue'\n")).toBe(false)
    expect(isRouteTable('shared/Home.vue', "import Other from './Other.vue'\n")).toBe(false)

    // A module called routes stays a module: its constants reach the screens that import them.
    const { swift, model } = await compile({
      'routes.ts': "export const lines = ['bus', 'tram']\n",
      'Home.vue': screen(
        '      <MText>{{ lines.length }}</MText>',
        "import { lines } from './routes'",
      ),
    })
    expect(model.navigation).toBeUndefined()
    expect(swift.has('RoutesModule.swift')).toBe(true)
    expect(swift.has('MavisNavigation.swift')).toBe(false)
  })

  it('names what it opens under any file name, and an app has one', async () => {
    const { model } = await compile({
      'pages.ts': table("  { path: '/', component: Home },"),
      'Home.vue': home,
    })
    expect(model.navigation).toMatchObject({ path: 'shared/pages.ts', home: 'Home' })
    expect(
      await failure({
        'pages.ts': table("  { path: '/', component: Home },"),
        'routes.ts': table("  { path: '/', component: Home },"),
        'Home.vue': home,
      }),
    ).toBe('shared/routes.ts: shared/pages.ts is already the route table: an app has one.')
  })

  it('ranks static segments before parameters and keeps the order written for the hosts', async () => {
    const { model, swift } = await compile({
      'routes.ts': table(
        [
          "  { path: '/:pathMatch(.*)*', component: Missing },",
          "  { path: '/places/:id', component: Place, props: true, name: 'place', meta: { title: 'A place' } },",
          "  { path: '/places/new', component: Home },",
          "  { path: '/', component: Home },",
          "  { path: '/Team-Members/:id/', component: Place, props: true },",
        ].join('\n'),
        ['Home', 'Place', 'Missing'],
      ),
      'Home.vue': home,
      'Place.vue': place,
      'Missing.vue': screen('      <MText>Nothing</MText>'),
    })
    const navigation = model.navigation!
    expect(navigation.routes.map((route) => route.path)).toEqual([
      '/places/new',
      '/',
      '/places/:id',
      '/Team-Members/:id/',
      '/:pathMatch(.*)*',
    ])
    expect(navigation.routes.map((route) => route.name)).toEqual([
      'placesNew',
      'root',
      'placesId',
      'teamMembersId',
      'missing',
    ])
    expect(navigation.declared).toEqual([
      'missing',
      'placesId',
      'placesNew',
      'root',
      'teamMembersId',
    ])
    expect(matchRoute(navigation, '/places/new')!.name).toBe('placesNew')
    expect(matchRoute(navigation, '/PLACES/New/')!.name).toBe('placesNew')
    expect(matchRoute(navigation, '/places/garden?tab=1#top')!.name).toBe('placesId')
    expect(matchRoute(navigation, '/team-members/ana')!.name).toBe('teamMembersId')
    expect(matchRoute(navigation, '/places//garden')!.catchAll).toBe(true)
    expect(matchRoute(navigation, 'places/garden')!.catchAll).toBe(true)

    const routes = swift.get('MavisNavigation.swift')!
    expect(routes).toContain('enum MavisRoute: MavisRouting {')
    expect(routes).toContain(
      [
        '            let lower = path.map { $0.lowercased() }',
        '            if path.count == 2, lower[0] == "places", lower[1] == "new" { self = .placesNew; return }',
        '            if path.count == 0 { self = .root; return }',
        '            if path.count == 2, lower[0] == "places" { self = .placesId(id: path[1]); return }',
        '            if path.count == 2, lower[0] == "team-members" { self = .teamMembersId(id: path[1]); return }',
      ].join('\n'),
    )
    expect(routes).toContain(
      'case .teamMembersId(let id): return MavisLocation.href(["Team-Members", id])',
    )
    expect(routes).toContain('case .unmatched: Missing()')
    expect(routes).toContain('MavisNavigationView<MavisRoute>(store: store)')
  })

  it('hands the path and the query string to the screen as its typed properties', async () => {
    const { swift, model } = await compile({
      'routes.ts': table(
        [
          "  { path: '/', component: Home },",
          "  { path: '/places/:id', component: Place, props: true },",
          "  { path: '/places/:id/visits/:visit', component: Visit, props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params }) },",
          "  { path: '/about/:lang', component: Home },",
        ].join('\n'),
        ['Home', 'Place', 'Visit'],
      ),
      'Home.vue': home,
      'Place.vue': screen(
        '      <MText>{{ id }} {{ note }}</MText>\n      <MButton text="Save" @click="emit(\'saved\', id)" />',
        "import { MButton } from '#mavis'\nwithDefaults(defineProps<{ id: string; note?: string }>(), { note: 'none' })\nconst emit = defineEmits<{ saved: [id: string] }>()",
      ),
      'Visit.vue': screen(
        '      <MText>{{ id }} {{ visit }} {{ tab ?? "" }} {{ sort }}</MText>',
        "withDefaults(defineProps<{ visit: string; id: string; tab?: string; sort?: string }>(), { sort: 'date' })",
      ),
    })
    const routes = swift.get('MavisNavigation.swift')!
    expect(routes).toContain(
      'case placesIdVisitsVisit(id: String, visit: String, tab: String?, sort: String)',
    )
    expect(routes).toContain(
      'self = .placesIdVisitsVisit(id: path[1], visit: path[3], tab: location.query["tab"], sort: location.query["sort"] ?? "date"); return',
    )
    expect(routes).toContain(
      'return MavisLocation.href(["places", id, "visits", visit], [("tab", tab), ("sort", sort)])',
    )
    // The screen takes its properties in its own order; an event nobody hears gets nothing to do.
    expect(routes).toContain(
      'case .placesIdVisitsVisit(let id, let visit, let tab, let sort): Visit(visit: visit, id: id, tab: tab, sort: sort)',
    )
    expect(routes).toContain('case .placesId(let id): Place(id: id, onSaved: { _ in })')
    // Without props the path still names the route, and the screen takes nothing from it.
    expect(routes).toContain('case aboutLang(lang: String)')
    expect(routes).toContain('case .aboutLang: Home()')
    expect(routes).toContain('case .unmatched: MavisScreen { EmptyView() }')
    const visits = model.navigation!.routes.find((route) => route.name === 'placesIdVisitsVisit')!
    expect(visits).toMatchObject({ props: 'query' })
    expect(visits.params.map((param) => param.name)).toEqual(['id', 'visit'])
    expect(visits.query.map((value) => value.name)).toEqual(['tab', 'sort'])
  })

  it('writes the same table for the hosts whose screens are generated, and none for the others', async () => {
    const fromTsx = await fixture('routes')
    for (const output of [fromTsx.vue, fromTsx.native]) {
      const routes = output.get('routes.ts')!
      expect(routes).toContain("import Place from './Place.vue'")
      expect(routes).toContain("  { path: '/places/:id', component: Place, props: true },")
      expect(routes).toContain(
        "  { path: '/search', component: Search, props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params }) },",
      )
      expect(routes).toContain("  { path: '/:pathMatch(.*)*', component: Missing },")
    }
    const fromVue = await fixture('routesVue')
    expect(fromVue.vue.size).toBe(0)
    expect(fromVue.native.size).toBe(0)

    const named = await compile({
      'routes.ts':
        "import Home from './Home.lite'\nimport type { NavigationItem } from '@getcortexlabs/mavis-core'\n\nexport const routes = [{ path: '/', component: Home, name: 'home', meta: { layout: 'wide' } }]\nexport const destinations: NavigationItem[] = [{ value: 1, label: 'Home', href: '/', icon: 'home' }]\n",
      'Home.lite.tsx': tsx('Home', '        <MText>Home</MText>'),
    })
    expect(named.vue.get('routes.ts')).toContain(
      "  { path: '/', name: 'home', component: Home, meta: { layout: 'wide' } },",
    )
    expect(named.vue.get('routes.ts')).toContain(
      "export const destinations = [\n  { value: 1, label: 'Home', href: '/', icon: 'home' },\n]",
    )
  })

  it.each([
    ['export const paths = [Home]', /routes\.ts:3:1: The route table declares export const routes/],
    ['const routes = [{ path: "/", component: Home }]', /routes\.ts:3:1: The route table declares/],
    ['export const routes = [Home]', /routes\.ts:3:24: A route is written out as an object\./],
    [
      'export const routes = [{ component: Home }]',
      /routes\.ts:3:24: A route names its path, for example path: '\/places\/:id'\./,
    ],
    [
      "export const routes = [{ path: 'places', component: Home }]",
      /routes\.ts:3:32: A route path starts with \/\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/files/:path+', component: Home }]",
      /:path\+ is not a parameter the Mac reads yet \(#341\)/,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/a/:id(\\\\d+)', component: Home }]",
      /is not a parameter the Mac reads yet \(#341\)/,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/a/:class', component: Home }]",
      /The parameter class collides with a reserved word/,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/a/:id/b/:id', component: Home }]",
      /\/a\/:id\/b\/:id names the parameter id twice\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/a(b)', component: Home }]",
      /\/a\(b\) is not a path the Mac reads yet \(#341\)/,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/A/:x', component: Home }, { path: '/a/:y/', component: Home }]",
      /routes\.ts:3:92: \/a\/:y\/ opens the same hrefs as \/A\/:x above\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home, redirect: '/home' }]",
      /routes\.ts:3:54: redirect: redirects are not read for the Mac yet \(#341\)\. A route has path, component, props, name, meta\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home, children: [] }]",
      /children: nested routes are not read for the Mac yet \(#341\)/,
    ],
    [
      "export const routes = [{ path: '/', component: Home, beforeEnter: () => true }]",
      /beforeEnter: route guards are not read for the Mac yet \(#341\)/,
    ],
    [
      "export const routes = [{ path: '/', component: Home, title: 'Home' }]",
      /A route has path, component, props, name, meta, not title\./,
    ],
    ["export const routes = [{ path: '/' }]", /A route opens a screen: give it one/],
    [
      "export const routes = [{ path: '/', component: Other }]",
      /routes\.ts:3:48: A route's component is a screen this file imports, or \(\) => import\('\.\/Home\.vue'\)\./,
    ],
    [
      "export const routes = [{ path: '/', component: () => import('./Gone.vue') }]",
      /shared\/Gone\.vue is not a shared screen file of this project\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home, props: { id: 'a' } }]",
      /props is true for the parameters of the path, or \(route\) => \(\{ \.\.\.route\.query, \.\.\.route\.params \}\) for the query string as well\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home, props: (route) => ({ ...route.params, ...route.query }) }]",
      /props is true for the parameters of the path/,
    ],
    [
      "export const routes = [{ path: '/home', component: Home }]",
      /routes\.ts:3:23: An app opens at \/: give the table a route with path: '\/'\./,
    ],
    [
      "export const routes = [{ path: '/', component: Home }, { path: '/:pathMatch(.*)*', component: Home, props: true }]",
      /The screen for everything else takes no properties from the route\./,
    ],
  ])('fails on %s', async (routes, message) => {
    expect(
      await failure({
        'routes.ts': `import Home from './Home.vue'\n\n${routes}\n`,
        'Home.vue': home,
      }),
    ).toMatch(message)
  })

  it.each([
    [
      "{ path: '/places/:id', component: Place }",
      'defineProps<{ id: string }>()',
      /routes\.ts:6:3: Place needs id: add props: true so the path hands it over\./,
    ],
    [
      "{ path: '/places/:slug', component: Place, props: true }",
      'defineProps<{ id: string }>()',
      /Place has no property slug: declare slug: string in it, or drop props from this route\./,
    ],
    [
      "{ path: '/places/:id', component: Place, props: true }",
      'defineProps<{ id: number }>()',
      /Place declares id as number, and a route parameter is text: declare id: string\./,
    ],
    [
      "{ path: '/places/:id', component: Place, props: true }",
      'defineProps<{ id: string; title: string }>()',
      /Place needs title, which \/places\/:id does not provide\. Give it a default, or make it a parameter of the path\./,
    ],
    [
      "{ path: '/places', component: Place }",
      'defineProps<{ title: string }>()',
      /Place needs title, which \/places does not provide\. Give it a default, or make it a parameter of the path with props: true\./,
    ],
    [
      "{ path: '/places/:id', component: Place, props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params }) }",
      'defineProps<{ id: string; page?: number }>()',
      /Place declares page as number \| undefined, and a query value is text that may be missing: declare page\?: string\./,
    ],
    [
      "{ path: '/places/:id', component: Place, props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params }) }",
      'defineProps<{ id: string; tab: string }>()',
      /Place declares tab as string, and a query value is text that may be missing: declare tab\?: string\./,
    ],
  ])('checks %s against what the screen declares', async (route, props, message) => {
    expect(
      await failure({
        'routes.ts': table(`  { path: '/', component: Home },\n  ${route},`, ['Home', 'Place']),
        'Home.vue': home,
        'Place.vue': screen('      <MText>Place</MText>', props),
      }),
    ).toMatch(message)
  })

  it('opens screens only, of one format, and waits for a screen that is not ready', async () => {
    expect(
      await failure({
        'routes.ts': table("  { path: '/', component: Home },"),
        'Home.vue': vue('', '  <MColumn>\n    <MText>Home</MText>\n  </MColumn>'),
      }),
    ).toBe(
      "shared/routes.ts:4:27: Home is not a screen: a route opens a whole screen on every target, so make MScreen the root of Home's view.",
    )
    expect(
      await failure({
        'routes.ts':
          "import Home from './Home.vue'\nimport About from './About.lite'\n\nexport const routes = [\n  { path: '/', component: Home },\n  { path: '/about', component: About },\n]\n",
        'Home.vue': home,
        'About.lite.tsx': tsx('About', '        <MText>About</MText>'),
      }),
    ).toBe(
      'shared/routes.ts: A route table opens screens of one format: Home run as written, and the others are generated.',
    )
    const report = await checkShared(
      shared({
        'routes.ts': table("  { path: '/', component: Home },"),
        'Home.vue': screen('      <div>Home</div>'),
      }),
      mavis,
    )
    expect(report.find((item: { file: string }) => item.file === 'shared/routes.ts')).toEqual({
      file: 'shared/routes.ts',
      ready: false,
      problems: [{ message: 'It shows shared/Home.vue, which is not ready for the Mac.' }],
    })
  })
})

describe('navigating from shared screens', () => {
  it('follows the same destinations the Mavis core calls screens of the app', () => {
    for (const href of [
      '/',
      '/places/a:b',
      'places',
      '?tab=1',
      'https://example.com',
      '//cdn',
      'mailto:a@b.c',
      'app:/x',
      'a\\b',
      'tel+1:5',
    ])
      expect(isAppDestination(href), href).toBe(coreIsAppDestination(href))
  })

  it('takes only properties of the published link contract', () => {
    const own = ['onClick', 'onError']
    expect(
      Object.keys(components.MLink.props).filter(
        (prop) => !own.includes(prop) && !Object.keys(linkProps).includes(prop),
      ),
    ).toEqual([])
    for (const name of ['MButton', 'MCard'])
      expect(Object.keys(components[name].props)).toEqual(
        expect.arrayContaining(['href', 'navigate', 'target', 'rel']),
      )
  })

  it('calls the window navigation from useMavisNavigation in both formats', async () => {
    const files = routedHome(
      [
        '      <MText as="h1">Home</MText>',
        '      <MButton text="Open" @click="open(\'garden\')" />',
        '      <MButton text="Swap" @click="navigation.replace(\'/places/library\')" />',
        '      <MButton text="Leave" @click="navigation.back()" />',
      ].join('\n'),
      "import { MButton, useMavisNavigation } from '#mavis'\nconst navigation = useMavisNavigation()\nfunction open(id: string) {\n  void navigation.push(`/places/${id}`)\n}",
    )
    const fromVue = await compile(files)
    const view = fromVue.swift.get('Home.swift')!
    expect(view).toContain('    @Environment(\\.mavisNavigation) private var mavisNavigation')
    expect(view).toContain('        self.mavisNavigation.push("/places/\\(id)")')
    expect(view).toContain('self.mavisNavigation.replace("/places/library")')
    expect(view).toContain('self.mavisNavigation.back()')
    expect(view).toContain('.mavisScreenTitle("Home")')
    expect(fromVue.swift.get('Place.swift')).not.toContain('mavisNavigation')

    const fromTsx = await compile({
      'routes.ts':
        "import Home from './Home.lite'\nimport Place from './Place.lite'\n\nexport const routes = [\n  { path: '/', component: Home },\n  { path: '/places/:id', component: Place, props: true },\n]\n",
      'Home.lite.tsx': tsx(
        'Home',
        '        <MButton text="Open" onClick={() => state.open(\'garden\')} />\n        <MButton text="Leave" onClick={() => navigation.back()} />',
        {
          before: '  const navigation = useMavisNavigation()\n',
          members: '    open(id: string) {\n      navigation.push(`/places/${id}`)\n    },\n',
        },
      ),
      'Place.lite.tsx': tsx('Place', '        <MText>{props.id}</MText>', {
        props: '{ id: string }',
      }),
    })
    expect(fromTsx.swift.get('Home.swift')).toContain('self.mavisNavigation.push("/places/\\(id)")')
    for (const output of [fromTsx.vue, fromTsx.native]) {
      const file = output.get('Home.vue')!
      expect(file).toContain("import { useMavisNavigation } from '@getcortexlabs/mavis-core/vue'")
      expect(file).toContain('const mavisNavigation = useMavisNavigation()')
      expect(file).toContain('    mavisNavigation.push(`/places/${id}`)')
      expect(file).toContain('@click="() => mavisNavigation.back()"')
    }
    expect(fromTsx.vue.get('Place.vue')).not.toContain('useMavisNavigation')
  })

  it('draws MLink and gives MButton and MCard an href, navigate and the link role', async () => {
    const { swift } = await compile(
      routedHome(
        [
          '      <MLink id="first" href="/places/garden" text="Garden" />',
          '      <MLink href="https://example.com" target="_blank" rel="noopener" inline :disabled="busy">Docs</MLink>',
          '      <MLink :href="next" :navigate="(href) => navigation.replace(href)" @click="busy = true" text="Next" />',
          '      <MButton text="Open" :href="next" variant="secondary" />',
          '      <MButton text="Both" href="/places/b" @click="busy = true" />',
          '      <MCard href="/places/c" accessibilityLabel="Open C"><MText>C</MText></MCard>',
        ].join('\n'),
        "import { ref } from 'vue'\nimport { MButton, MCard, MLink, useMavisNavigation } from '#mavis'\nconst navigation = useMavisNavigation()\nconst busy = ref(false)\nconst next = ref('/places/a')",
      ),
    )
    const view = swift.get('Home.swift')!
    expect(view).toContain(
      [
        '                MavisLink(',
        '                    text: "Garden",',
        '                    href: "/places/garden"',
        '                )',
        '                    .accessibilityIdentifier("first")',
      ].join('\n'),
    )
    expect(view).toContain(
      [
        '                MavisLink(',
        '                    text: "Docs",',
        '                    href: "https://example.com",',
        '                    blank: true,',
        '                    disabled: self.busy,',
        '                    inline: true',
        '                )',
      ].join('\n'),
    )
    expect(view).toContain(
      [
        '                MavisLink(',
        '                    text: "Next",',
        '                    href: self.next,',
        '                    navigate: { (href: String) in',
        '                        self.mavisNavigation.replace(href)',
        '                    },',
        '                    onClick: {',
        '                        self.busy = true',
        '                    }',
        '                )',
      ].join('\n'),
    )
    expect(view).toContain(
      [
        '                Button(action: {',
        '                    self.mavisNavigation.follow(self.next)',
        '                }) {',
        '                    Text(verbatim: "Open")',
        '                }',
        '                    .buttonStyle(MavisButtonStyle(variant: .secondary))',
      ].join('\n'),
    )
    expect(view).toContain(['                    .buttonStyle(MavisCardButtonStyle())'].join('\n'))
    expect(view).not.toContain('mavis-card')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisLink: View {')
    expect(controls).toContain(
      'NavigationStack(path: Binding(get: { navigator.pathEntries.map(MavisRouteVisit<Route>.init) }',
    )
  })

  it('passes the contract through to the Mavis components on the Web and NativeScript', async () => {
    const { vue: web, native } = await compile({
      'routes.ts':
        "import Home from './Home.lite'\n\nexport const routes = [{ path: '/', component: Home }]\n",
      'Home.lite.tsx': tsx(
        'Home',
        [
          '        <MLink href="/" text="Home" inline disabled={state.count > 1} onClick={() => (state.count += 1)} />',
          '        <MLink href="https://example.com" text="Docs" target="_blank" rel="noopener" />',
          '        <MButton text="Next" href="/" navigate={(href) => navigation.replace(href)} />',
          '        <MCard href="/" label="Open home" navigate={(href) => navigation.push(href)}>',
          '          <MText>Home</MText>',
          '        </MCard>',
        ].join('\n'),
        { before: '  const navigation = useMavisNavigation()\n' },
      ),
    })
    for (const output of [web, native]) {
      const file = output.get('Home.vue')!
      expect(file).toContain(
        '<MLink href="/" text="Home" :inline="true" :disabled="(state.count > 1)" @click="() => state.count += 1" />',
      )
      expect(file).toContain(
        '<MLink href="https://example.com" text="Docs" target="_blank" rel="noopener" />',
      )
      expect(file).toContain(
        '<MButton text="Next" href="/" :navigate="(href) => mavisNavigation.replace(href)" />',
      )
      expect(file).toContain(
        '<MCard href="/" accessibilityLabel="Open home" :navigate="(href) => mavisNavigation.push(href)">',
      )
    }
  })

  it.each([
    [
      '<MLink href="/gone" text="Gone" />',
      /Home\.vue:12:14: No route opens \/gone: the routes are \/, \/places\/:id\./,
    ],
    [
      '<MLink href="  " text="Blank" />',
      /Home\.vue:12:14: href is where the link goes: it cannot be empty\./,
    ],
    [
      '<MLink href="javascript:alert(1)" text="Run" />',
      /A link goes to a place, not to code: href cannot be a script or data\./,
    ],
    [
      '<MLink href="/places/a" target="_blank" text="Window" />',
      /Home\.vue:12:31: target="_blank" opens another window, which the Mac does for an address written out/,
    ],
    [
      '<MLink :href="next" target="_blank" text="Window" />',
      /target="_blank" opens another window/,
    ],
    ['<MLink text="Nowhere" />', /MLink needs href\./],
    ['<MLink href="/" />', /MLink needs text\./],
    ['<MButton text="Go" />', /MButton needs @click\./],
    [
      '<MButton text="Go" rel="next" @click="busy = true" />',
      /rel belongs to a link: give this one its href\./,
    ],
    [
      '<MButton text="Go" :navigate="(href) => navigation.push(href)" @click="busy = true" />',
      /navigate belongs to a link: give this one its href\./,
    ],
    ['<MCard href="/"><MText>Home</MText></MCard>', /MCard needs accessibilityLabel with href\./],
    [
      '<MCard href="/" accessibilityLabel="Home"><MButton text="In" @click="busy = true" /></MCard>',
      /A card with an href is one link and shows text only; put buttons and fields outside it\./,
    ],
    [
      '<MText>{{ navigation.push("/") }}</MText>',
      /Type 'void \| Promise<unknown>' is not assignable/,
    ],
    [
      '<MButton text="Go" @click="navigation.resolve(\'/\')" />',
      /resolve is for the links a host draws itself/,
    ],
    [
      '<MButton text="Go" @click="navigation.push()" />',
      /Expected 1 arguments|push takes the href to open\./,
    ],
    [
      '<MButton text="Go" @click="navigation.go(1)" />',
      /does not exist|Navigation has push\(href\), replace\(href\) and back\(\)\./,
    ],
  ])('fails on %s', async (element, message) => {
    expect(
      await failure(
        routedHome(
          `      ${element}`,
          "import { ref } from 'vue'\nimport { MButton, MCard, MLink, useMavisNavigation } from '#mavis'\nconst navigation = useMavisNavigation()\nconst busy = ref(false)\nconst next = ref('/places/a')",
        ),
      ),
    ).toMatch(message)
  })

  it('needs the route table to go anywhere in the app', async () => {
    expect(
      await failure({
        'Home.vue': screen(
          '      <MText>Home</MText>',
          "import { useMavisNavigation } from '#mavis'\nconst navigation = useMavisNavigation()",
        ),
      }),
    ).toMatch(
      /Home\.vue:3:7: useMavisNavigation\(\) moves between the screens of the route table, and this project has none: add shared\/routes\.ts/,
    )
    expect(
      await failure({
        'Home.vue': screen(
          '      <MLink href="/places" text="Places" />',
          "import { MLink } from '#mavis'",
        ),
      }),
    ).toMatch(/\/places is a screen of the app, and this project has no route table/)
    // An address outside the app needs none.
    const { swift } = await compile({
      'Home.vue': screen(
        '      <MLink href="https://example.com" text="Docs" />',
        "import { MLink } from '#mavis'",
      ),
    })
    expect(swift.get('Home.swift')).toContain('href: "https://example.com"')
    expect(
      await failure({
        'Home.vue': screen('      <MText>Home</MText>', 'const navigation = useMavisNavigation()'),
      }),
    ).toMatch(/Import useMavisNavigation from #mavis\./)
    expect(
      await failure({
        'Home.lite.tsx': tsx('Home', '        <MText>Home</MText>', {
          before: "  const navigation = useMavisNavigation('main')\n",
        }),
      }),
    ).toMatch(/Expected 0 arguments|Navigation is const navigation = useMavisNavigation\(\)\./)
  })
})

describe('navigation integrated with shared stores and wayfinding', () => {
  it('keeps the plain stack fallback and disables it for system or app reduced motion', async () => {
    const { swift } = await compile(routedHome('      <MLink href="/places/a" text="Place" />'))
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      '@Environment(\\.accessibilityReduceMotion) private var reduceMotion',
    )
    expect(controls).toContain('@Environment(\\.mavisReduceMotion) private var appReduceMotion')
    expect(controls).toContain(
      'if reduceMotion || appReduceMotion { transaction.disablesAnimations = true }',
    )
  })
  it('keeps a store, its host services and its generated app binding beside a route table', async () => {
    const files = await readShared(join(portable, 'notesVue'))
    files.set(
      'shared/Notes.vue',
      files
        .get('shared/Notes.vue')!
        .replace('<template>', '<template><MScreen>')
        .replace('</template>', '</MScreen></template>'),
    )
    files.set(
      'shared/routes.ts',
      "import Notes from './Notes.vue'\nexport const routes = [{ path: '/', component: Notes }]\n",
    )
    const output: Output = await compileProject(files, { root: 'Notes' })
    expect(output.model.navigation?.home).toBe('Notes')
    expect(output.swift.get('MavisStores.swift')).toContain('class NotesStore')
    expect(output.swift.get('MavisStores.swift')).toContain('protocol NotesStorage')
    expect(output.swift.get('MavisNavigation.swift')).toContain('Notes()')
    expect(output.swift.get('Notes.swift')).toContain(
      '@Environment(NotesStore.self) private var store',
    )
    expect(output.direct).toContain('shared/Notes.vue')
  })

  it('uses one MLink runtime and distinct route/visual destination models, with the host connecting them', async () => {
    const { swift } = await compile(
      routedHome(
        '      <MAppBar title="Places" back />\n      <MLink href="/places/a" text="Place" />',
      ),
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls.match(/struct MavisLink: View/g)).toHaveLength(1)
    expect(controls.match(/struct MavisLinkStyle: ButtonStyle/g)).toHaveLength(1)
    expect(controls.match(/struct MavisDestination:/g)).toHaveLength(1)
    expect(controls.match(/struct MavisRouteDestination:/g)).toHaveLength(1)
    expect(controls).toContain('.environment(\\.mavisWayfinding, MavisWayfinding { href in')
    expect(controls).toContain('navigator.push(href)')
    expect(controls).toContain('if let navigateBack { navigateBack() } else { navigation.back() }')
    expect(swift.get('Home.swift')).toContain('MavisAppBar(')
  })

  it('opens an external target in a new window without invoking a button navigate callback', async () => {
    const { swift } = await compile(
      routedHome(
        '      <MButton text="Docs" href="https://example.com" target="_blank" :navigate="(href) => navigation.push(href)" />',
        "import { useMavisNavigation } from '#mavis'\nconst navigation = useMavisNavigation()",
      ),
    )
    const source = swift.get('Home.swift')!
    expect(source).toContain('self.mavisNavigation.follow("https://example.com")')
    expect(source).not.toContain('self.mavisNavigation.push(href)')
  })

  it('keeps the navigation environment when an async action calls it inside try/finally', async () => {
    const { swift } = await compile(
      routedHome(
        '      <MButton text="Next" @click="open()" />',
        `import { ref } from 'vue'
import { useMavisNavigation } from '#mavis'
const navigation = useMavisNavigation()
const busy = ref(false)
async function open() {
  try {
    busy.value = true
    navigation.push('/places/a')
  } finally {
    busy.value = false
  }
}`,
      ),
    )
    const source = swift.get('Home.swift')!
    expect(source).toContain('@Environment(\\.mavisNavigation) private var mavisNavigation')
    expect(source).toContain('self.mavisNavigation.push("/places/a")')
  })
})
