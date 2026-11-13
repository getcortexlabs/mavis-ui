import { swiftType } from './swift-text.mjs'
import { components } from './components/index.mjs'
import { nodesWhere } from './tree.mjs'

/** Retained callbacks may live in props, controller options or action/effect statements. */
export function ownedCallbacks(component) {
  const found = new Set()
  const seen = new Set()
  function visit(value) {
    if (!value || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)
    if (value.owned && value.body && value.returns) found.add(value)
    for (const [key, child] of Object.entries(value))
      if (!['node', 'type', 'returns', 'params', 'captures'].includes(key)) visit(child)
  }
  visit(component.view)
  visit(component.refs.map((ref) => ref.options))
  visit(component.actions)
  visit(component.effects)
  return [...found]
}
export const asyncViewCallbacks = ownedCallbacks

export const ownsLifetime = (component) =>
  component.effects?.some((effect) => effect.on !== 'change' || effect.async) ||
  component.actions.some((action) => action.async) ||
  asyncViewCallbacks(component).length > 0 ||
  component.refs.some((ref) => ref.owner && components[ref.owner].composable.dispose)

export const lifetimeValuesName = (component) => `${component.name}MavisValues`
export const lifetimePropsName = (component) => `${component.name}MavisProps`
export const forwardedState = (state, pad) => [
  `${pad}var ${state.name}: ${swiftType(state.type)} {`,
  `${pad}    get { mavisValues.${state.name} }`,
  `${pad}    nonmutating set { mavisValues.${state.name} = newValue }`,
  `${pad}}`,
]

/** A snapshot of the component's bindings, not its View or StateObject lifetime owner. */
export function swiftContext(emit, component, indent, focus = false, navigation = false) {
  const pad = ' '.repeat(indent)
  const inner = `${pad}    `
  const fields = [
    ...(component.props.length ? [{ name: 'mavisProps', type: lifetimePropsName(component) }] : []),
    ...(component.state.length
      ? [{ name: 'mavisValues', type: lifetimeValuesName(component) }]
      : []),
    ...(component.stores ?? []).map((use) => ({ name: use.name, type: `${use.store}Store` })),
    ...component.refs
      .filter((ref) => ref.owner && components[ref.owner].composable.contextType)
      .map((ref) => ({ name: ref.name, type: components[ref.owner].composable.contextType })),
    ...component.refs
      .filter((ref) => ref.kind === 'list')
      .map((ref) => ({ name: ref.name, type: 'MavisListRequest', binding: true })),
  ]
  const name = `${component.name}MavisContext`
  if (navigation) fields.push({ name: 'mavisNavigation', type: 'MavisNavigation' })
  if (focus)
    fields.push({
      name: 'mavisFocusBinding',
      type: 'FocusState<String?>.Binding',
      argument: '$mavisFocus',
    })
  const property = [
    `${inner}private var mavisContext: ${name} {`,
    `${inner}    ${name}(${fields.map((field) => `${field.name}: ${field.argument ?? `${field.binding ? '$' : 'self.'}${field.name}`}`).join(', ')})`,
    `${inner}}`,
  ]
  const declaration = [
    `${pad}@MainActor struct ${name} {`,
    ...fields.map(
      (field) => `${inner}${field.binding ? '@Binding var' : 'let'} ${field.name}: ${field.type}`,
    ),
  ]
  if (focus)
    declaration.push(
      `${inner}var mavisFocus: String? {`,
      `${inner}    get { mavisFocusBinding.wrappedValue }`,
      `${inner}    nonmutating set { mavisFocusBinding.wrappedValue = newValue }`,
      `${inner}}`,
    )
  for (const state of component.state) declaration.push(...forwardedState(state, inner))
  for (const prop of component.props)
    declaration.push(
      `${inner}var ${prop.name}: ${swiftType(prop.type)} { mavisProps.${prop.name} }`,
    )
  for (const getter of component.getters) {
    declaration.push('', `${inner}var ${getter.name}: ${swiftType(getter.type)} {`)
    for (const local of getter.locals)
      declaration.push(
        `${inner}    let ${local.name}: ${swiftType(local.type)} = ${emit.expr(local.value)}`,
      )
    declaration.push(`${inner}    return ${emit.expr(getter.expr)}`, `${inner}}`)
  }
  const previous = emit.contextTasks
  emit.contextTasks = false
  for (const action of component.actions) {
    const params = action.params
      .map((param) => `_ ${param.name}: ${swiftType(param.type)}`)
      .join(', ')
    declaration.push(
      '',
      `${inner}${action.async ? '@MainActor ' : ''}func ${action.name}(${params})${action.async ? ' async' : ''}${action.throws ? ' throws' : ''} {`,
      emit.statements(action.body, indent + 8),
      `${inner}}`,
    )
  }
  for (const [callback, method] of emit.asyncCallbacks ?? []) {
    const params = [...callback.params, ...(callback.captures ?? [])]
      .map((param) => `_ ${param.unused ? '_' : param.name}: ${swiftType(param.type)}`)
      .join(', ')
    declaration.push(
      '',
      `${inner}@MainActor func ${method}(${params})${callback.async ? ' async' : ''}${callback.throws ? ' throws' : ''} -> ${swiftType(callback.returns)} {`,
      emit.statements(callback.body, indent + 8),
      `${inner}}`,
    )
  }
  const updates = component.refs.flatMap((ref) => {
    const update = ref.owner && components[ref.owner].composable.update
    return update ? [update(ref, emit)] : []
  })
  if (updates.length)
    declaration.push(
      '',
      `${inner}@MainActor func mavisUpdateControllers() {`,
      ...updates.map((line) => `${inner}    ${line}`),
      `${inner}}`,
    )
  for (const [index, effect] of (component.effects ?? []).entries()) {
    const params = (effect.params ?? [])
      .map((param) => `_ ${param.unused ? '_' : param.name}: ${swiftType(param.type)}`)
      .join(', ')
    declaration.push(
      '',
      `${inner}@MainActor func mavisEffect${index}(${params})${effect.async ? ' async' : ''} {`,
      emit.statements(effect.body, indent + 8),
      `${inner}}`,
    )
  }
  emit.contextTasks = previous
  declaration.push(`${pad}}`)
  if (component.state.length) {
    declaration.push(
      '',
      `${pad}@MainActor @Observable final class ${lifetimeValuesName(component)} {`,
    )
    for (const state of component.state)
      declaration.push(`${inner}var ${state.name}: ${swiftType(state.type)}`)
    declaration.push(
      `${inner}init(${component.state.map((state) => `${state.name}: ${swiftType(state.type)}`).join(', ')}) {`,
    )
    for (const state of component.state)
      declaration.push(`${inner}    self.${state.name} = ${state.name}`)
    declaration.push(`${inner}}`, `${pad}}`)
  }
  if (component.props.length) {
    declaration.push('', `${pad}@MainActor final class ${lifetimePropsName(component)} {`)
    for (const prop of component.props)
      declaration.push(`${inner}var ${prop.name}: ${swiftType(prop.type)}`)
    declaration.push(
      `${inner}init(${component.props.map((prop) => `${prop.name}: ${prop.type.k === 'function' ? '@escaping ' : ''}${swiftType(prop.type)}`).join(', ')}) {`,
    )
    for (const prop of component.props)
      declaration.push(`${inner}    self.${prop.name} = ${prop.name}`)
    declaration.push(`${inner}}`, `${pad}}`)
  }
  return { property, declaration }
}

export const lifetimeRuntime = `import SwiftUI
import AppKit

/// StateObject ownership follows component identity. Disappearance can merely be navigation
/// or a covered window; only releasing the identity runs onUnmounted.
final class MavisComponentLifetime: ObservableObject {
    private var mounted = false
    private var cleanup: (@MainActor () -> Void)?

    @MainActor func appear(_ start: () -> Void) {
        guard !mounted else { return }
        mounted = true
        start()
    }

    @MainActor func update(_ cleanup: @escaping @MainActor () -> Void) {
        self.cleanup = cleanup
    }

    deinit {
        guard mounted else { return }
        let finish = cleanup
        Task { @MainActor in finish?() }
    }
}

private struct MavisLifetimeAttachment: NSViewRepresentable {
    let lifetime: MavisComponentLifetime
    let update: @MainActor () -> Void
    let cleanup: @MainActor () -> Void

    func makeNSView(context: Context) -> NSView {
        update()
        lifetime.update(cleanup)
        return NSView(frame: .zero)
    }

    func updateNSView(_ view: NSView, context: Context) {
        update()
        // Keep current props/callbacks without starting another mount.
        lifetime.update(cleanup)
    }
}

extension View {
    func mavisComponentLifetime(_ lifetime: MavisComponentLifetime, update: @escaping @MainActor () -> Void = {}, cleanup: @escaping @MainActor () -> Void) -> some View {
        background(MavisLifetimeAttachment(lifetime: lifetime, update: update, cleanup: cleanup).frame(width: 0, height: 0).accessibilityHidden(true))
    }
}
`
