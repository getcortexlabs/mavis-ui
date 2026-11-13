// Public type-only contracts opt in through their owning component's composable metadata.
import { components, componentComposables } from './components/index.mjs'

export const contractTypes = () =>
  Object.assign(
    {},
    ...Object.values(components).flatMap((component) =>
      componentComposables(component).map((made) => made.types ?? {}),
    ),
  )
export function contractImports() {
  const modules = new Map()
  for (const component of Object.values(components))
    for (const made of componentComposables(component))
      for (const [from, names] of Object.entries(made.typeImports ?? {}))
        modules.set(from, [...new Set([...(modules.get(from) ?? []), ...names])])
  return modules
}
export function contractAmbient() {
  const modules = contractImports()
  const names = [...new Set([...modules.values()].flat())]
  return [
    ...names.map((name) => `type __MavisPublic${name} = ${name}`),
    ...[...modules].map(
      ([from, names]) =>
        `declare module '${from}' {\n${names.map((name) => `  export type ${name} = __MavisPublic${name}`).join('\n')}\n}`,
    ),
  ].join('\n')
}
