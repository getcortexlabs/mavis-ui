import { PortableError } from './model.mjs'

/** Explicit Mac entry startup. Hosts that run Vue keep their own bootstrap code. */
export function startupPlan(model, requested) {
  if (requested === undefined) return []
  if (!Array.isArray(requested))
    throw new PortableError('portability.startup must be a list of { store, action }.')
  const stores = model.modules.flatMap((module) => module.stores)
  const seen = new Set()
  return requested.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Object.keys(item).some((key) => !['store', 'action'].includes(key)) ||
      typeof item.store !== 'string' ||
      typeof item.action !== 'string'
    )
      throw new PortableError(
        'Each portability.startup entry names a store and an action, without other options.',
      )
    const store = stores.find((store) => store.name === item.store)
    const action = store?.shares.some(
      (share) => share.kind === 'action' && share.name === item.action,
    )
      ? store.actions.find((action) => action.name === item.action)
      : undefined
    if (!action)
      throw new PortableError(
        `portability.startup: ${item.store}.${item.action} is not a shared store action.`,
      )
    if (action.params.length || action.returns || action.throws)
      throw new PortableError(
        `portability.startup: ${item.store}.${item.action} must take no arguments, return no value and handle its own errors.`,
      )
    const key = `${item.store}.${item.action}`
    if (seen.has(key)) throw new PortableError(`portability.startup repeats ${key}.`)
    seen.add(key)
    return { store: item.store, action: item.action, async: Boolean(action.async) }
  })
}

/** A window owns its startup guard. Ordinary body updates and route changes do not restart it. */
export function swiftStartup(plan) {
  if (!plan.length) return ''
  const stores = [...new Set(plan.map((item) => item.store))]
  const names = new Map(stores.map((store, index) => [store, `store${index}`]))
  const run = plan
    .map(
      (item) =>
        `                    ${item.async ? 'await ' : ''}${names.get(item.store)}.${item.action}()`,
    )
    .join('\n')
  return `
/// One startup for this entry identity, after its content has entered the window.
@MainActor private final class MavisEntryStartupState: ObservableObject {
    private var started = false
    func run(_ start: () -> Void) {
        guard !started else { return }
        started = true
        start()
    }
}

private struct MavisEntryStartup<Content: View>: View {
    let content: Content
    @StateObject private var startup = MavisEntryStartupState()
${stores.map((store) => `    @Environment(${store}Store.self) private var ${names.get(store)}`).join('\n')}
    var body: some View {
        content.onAppear {
            startup.run {
                Task { @MainActor [${[...names.values()].join(', ')}] in
${run}
                }
            }
        }
    }
}
`
}
