// Links: MLink, and the navigation contract MButton and MCard share with it (href, navigate,
// target, rel). On the Mac a link asks the window's navigation for a screen of the app, and
// the system for any other address.
import { expression, handlerJs } from '../js-text.mjs'
import { isAppDestination, noteLink } from '../navigation/links.mjs'
import { navigationRuntime } from '../navigation/runtime.mjs'
import { MLink as visualLink, callback } from './wayfinding.mjs'

// href: a destination written out is checked against the route table once every screen is
// read (see readNavigation).
function href({ value, ctx, expr, T, ts }) {
  if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
  return { lit: value.text }
}

// navigate: what follows the link in place of the app's navigation; it is handed the href.
const navigate = callback('navigate', ['string'])

function target({ attribute, value, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(attribute, 'target is written as a literal: _self or _blank.')
  return { lit: value.text }
}

/** navigationContract: what MLink, MButton and MCard take to go somewhere. */
export const linkProps = { href, navigate, target, rel: 'string' }

/** The rules of the navigation contract, for a component's check. */
export function checkLink({ props, attrs, fail, ctx }) {
  if (props.href && 'lit' in props.href) {
    const href = props.href.lit.trim()
    if (!props.navigate) noteLink(ctx.component, attrs.get('href'), href)
    if (!href || /[\u0000-\u001f\u007f]/.test(href))
      fail(attrs.get('href'), 'href is where the link goes: it cannot be empty.')
    if (/^(?:javascript|data|vbscript):/i.test(href))
      fail(
        attrs.get('href'),
        'A link goes to a place, not to code: href cannot be a script or data.',
      )
  }
  for (const key of ['navigate', 'target', 'rel'])
    if (props[key] && !props.href)
      fail(attrs.get(key), `${key} belongs to a link: give this one its href.`)
  // Another window for a screen of the app is not something a Mac app of one window does.
  if (props.target?.lit === '_blank' && !('lit' in props.href && !isAppDestination(props.href.lit)))
    fail(
      attrs.get('target'),
      'target="_blank" opens another window, which the Mac does for an address written out, such as href="https://…", and not for a screen of the app yet (#341). Leave target out.',
    )
}

/** What a control with an href does when it is activated, as the closure SwiftUI calls. */
export function followAction(props, { emit, indent }) {
  const pad = ' '.repeat(indent + 4)
  const lines = [
    ...(props.onClick ? [`${pad}(${emit.handler(props.onClick, indent + 4)})()`] : []),
    props.navigate && props.target?.lit !== '_blank'
      ? `${pad}(${emit.handler(props.navigate, indent + 4)})(${emit.value(props.href)})`
      : `${pad}self.mavisNavigation.follow(${emit.value(props.href)})`,
  ]
  return `{\n${lines.join('\n')}\n${' '.repeat(indent)}}`
}

/** How generated Vue passes navigate: a property that holds a function, not an event. */
export const navigateAttribute = (name, value) =>
  name === 'navigate' ? `:navigate="${expression(handlerJs(value))}"` : undefined

// The wayfinding component owns the visual contract and its click/error events. This wrapper
// connects destinations to the route table without replacing those behaviors.
export const MLink = {
  ...visualLink,
  props: { ...visualLink.props, ...linkProps },
  uses: [...visualLink.uses, { swiftRuntime: navigationRuntime }],
  check: checkLink,
  types:
    () => `/** What useMavisNavigation() answers: the app's navigation, which each host installs. */
type MavisNavigationApi = { push(href: string): void | Promise<unknown>; replace(href: string): void | Promise<unknown>; back(): void | Promise<unknown>; resolve(href: string): string }
declare function useMavisNavigation(): MavisNavigationApi
/** Where a link goes, as MLink, MButton and MCard take it. */
type MavisLinkProps = { href?: string; navigate?: (href: string) => void; target?: '_self' | '_blank'; rel?: string }
type MavisNavigationItem = NavigationItem
type MavisRouteLocation = { path: string; fullPath: string; params: Record<string, string>; query: Record<string, string> }
type MavisRouteRecord = { path: string; name?: string; component?: unknown; props?: boolean | ((route: MavisRouteLocation) => object); meta?: Record<string, unknown>; [later: string]: unknown }
declare module '@getcortexlabs/mavis-core' {
  export type NavigationItem = MavisNavigationItem
  export type MavisNavigation = MavisNavigationApi
}
declare module 'vue-router' {
  export type RouteRecordRaw = MavisRouteRecord
}
declare module 'vue-router-ns' {
  export type RouteRecordRaw = MavisRouteRecord
}
declare module '*.vue' {
  const component: unknown
  export default component
}`,
  declaration: visualLink.declaration,
}
