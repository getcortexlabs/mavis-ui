import { PortableError } from './model.mjs'

const readsSetup = (value) =>
  value &&
  typeof value === 'object' &&
  (value.e === 'getter' || value.e === 'store' || Object.values(value).some(readsSetup))

/**
 * A SwiftUI environment is not available in init. Read setup-dependent initial values in an
 * outer view, then hand them to an inner view's State initializer. SwiftUI keeps that State
 * for the same component identity, so a store/prop update cannot overwrite an edited draft.
 */
export function initialState(component) {
  const deferred = component.state.filter((state) => readsSetup(state.init))
  if (!deferred.length) return undefined
  const expand = (value, chain = []) => {
    if (!value || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map((entry) => expand(entry, chain))
    if (value.e === 'getter' || value.e === 'state') {
      if (chain.includes(value.name))
        throw new PortableError(
          `${component.path}: Initial state has a circular dependency through ${value.name}.`,
        )
      const next = [...chain, value.name]
      if (value.e === 'state') {
        const index = component.state.findIndex((state) => state.name === value.name)
        const initialized = component.state.findIndex((state) => state.name === chain[0])
        if (index >= initialized)
          throw new PortableError(
            `${component.path}: Initial state cannot read ${value.name} before it is initialized.`,
          )
        return expand(component.state[index].init, next)
      }
      const getter = component.getters.find((getter) => getter.name === value.name)
      return {
        e: 'initial-getter',
        type: getter.type,
        locals: expand(getter.locals, next),
        expr: expand(getter.expr, next),
      }
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, expand(item, chain)]),
    )
  }
  const seeds = deferred.map((state) => ({
    name: `mavisInitial${state.name[0].toUpperCase()}${state.name.slice(1)}`,
    state: state.name,
    type: state.type,
    value: expand(state.init, [state.name]),
  }))
  return { seeds, name: `${component.name}MavisState` }
}
