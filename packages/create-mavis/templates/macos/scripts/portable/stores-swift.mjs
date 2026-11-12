// Swift for stores and the host services they take: a protocol for each service, an @Observable
// class for each store, and the scope that creates the stores once for the views inside.
import { swiftType } from './swift-text.mjs'

const field = (name) => name.charAt(0).toLowerCase() + name.slice(1)

/** MavisStores.swift, or null for a project without stores. */
export function swiftStores(emit, model, header, namespace) {
  const stores = model.modules.flatMap((module) => module.stores)
  if (!stores.length) return null
  const pad = namespace ? '    ' : ''
  const inner = `${pad}    `
  const lines = [`// ${header}`, 'import SwiftUI', 'import Observation', '']
  if (namespace) lines.push(`extension ${namespace} {`)
  for (const service of model.services) {
    lines.push(
      `${pad}/// A host service: the app gives an implementation, as the Web and NativeScript apps give theirs.`,
      `${pad}@MainActor protocol ${service.name} {`,
    )
    for (const method of service.methods)
      lines.push(
        `${inner}func ${method.name}(${method.params.map((param) => `_ ${param.name}: ${swiftType(param.type)}`).join(', ')})${method.async ? ' async throws' : ''}${method.returns.k === 'void' ? '' : ` -> ${swiftType(method.returns)}`}`,
      )
    lines.push(`${pad}}`, '')
  }
  for (const store of stores) {
    emit.failing = new Set(store.actions.filter((each) => each.throws).map((each) => each.name))
    emit.asyncActions = new Set(store.actions.filter((each) => each.async).map((each) => each.name))
    lines.push(
      `${pad}/// ${store.name}: state its screens share. The app creates one (see MavisStoreScope).`,
      `${pad}@MainActor @Observable final class ${store.name}Store {`,
    )
    for (const dep of store.deps)
      lines.push(`${inner}@ObservationIgnored private let ${dep.name}: any ${dep.service}`)
    for (const value of store.state)
      lines.push(`${inner}var ${value.name}: ${swiftType(value.type)}`)
    lines.push(
      '',
      `${inner}init(${store.deps.map((dep) => `${dep.name}: any ${dep.service}`).join(', ')}) {`,
      ...store.deps.map((dep) => `${inner}    self.${dep.name} = ${dep.name}`),
      ...store.state.map((value) => `${inner}    self.${value.name} = ${emit.expr(value.init)}`),
      `${inner}}`,
    )
    for (const getter of store.getters)
      lines.push(
        '',
        `${inner}var ${getter.name}: ${swiftType(getter.type)} {`,
        ...getter.locals.map(
          (local) =>
            `${inner}    let ${local.name}: ${swiftType(local.type)} = ${emit.expr(local.value)}`,
        ),
        `${inner}    return ${emit.expr(getter.expr)}`,
        `${inner}}`,
      )
    for (const action of store.actions) {
      const params = action.params
        .map((param) => `_ ${param.name}: ${swiftType(param.type)}`)
        .join(', ')
      const body = emit.statements(action.body, inner.length + 4)
      lines.push(
        '',
        `${inner}func ${action.name}(${params})${action.async ? ' async' : ''}${action.throws ? ' throws' : ''} {`,
        ...(body ? [body] : []),
        `${inner}}`,
      )
    }
    lines.push(`${pad}}`, '')
  }
  lines.push(
    `${pad}/// The host services the stores of this app take: one implementation of each.`,
    `${pad}struct MavisServices {`,
    ...model.services.map((service) => `${inner}var ${field(service.name)}: any ${service.name}`),
    `${pad}}`,
    '',
    `${pad}/// Creates each store once for the views inside.`,
    `${pad}struct MavisStoreScope: ViewModifier {`,
    ...stores.map((store) => `${inner}@State private var ${field(store.name)}: ${store.name}Store`),
    '',
    `${inner}@MainActor init(_ services: MavisServices) {`,
    ...stores.map(
      (store) =>
        `${inner}    _${field(store.name)} = State(initialValue: ${store.name}Store(${store.deps.map((dep) => `${dep.name}: services.${field(dep.service)}`).join(', ')}))`,
    ),
    `${inner}}`,
    '',
    `${inner}func body(content: Content) -> some View {`,
    `${inner}    content${stores.map((store) => `.environment(${field(store.name)})`).join('')}`,
    `${inner}}`,
    `${pad}}`,
  )
  if (namespace) lines.push('}')
  const scope = namespace ? `${namespace}.` : ''
  lines.push(
    '',
    'extension View {',
    "    /// Installs the app's stores with the host services they take, around the screens that use them.",
    `    @MainActor func mavisServices(_ services: ${scope}MavisServices) -> some View {`,
    `        modifier(${scope}MavisStoreScope(services))`,
    '    }',
    '}',
    '',
  )
  return lines.join('\n')
}
