import { componentContracts, type ContractProps } from '@getcortexlabs/mavis-core'
import type { MavisThemeScope } from './theme.js'

export type NativeComponentName = keyof typeof componentContracts
export type NativeComponentProps<N extends NativeComponentName> = ContractProps<
  (typeof componentContracts)[N]['props']
>
export type MBoxProps = NativeComponentProps<'MBox'>
export type MRowProps = NativeComponentProps<'MRow'>
export type MColumnProps = NativeComponentProps<'MColumn'>
export type MTextProps = NativeComponentProps<'MText'>
export type MButtonProps = NativeComponentProps<'MButton'>
export type MInputProps = NativeComponentProps<'MInput'>

export interface NativeComponentEvents {
  activate?(): void
  error?(error: unknown): void
  valueChange?(value: string): void
  submit?(value: string): void
  focus?(): void
  blur?(): void
  action?(): void
}

export interface NativeComponentOptions {
  theme?: MavisThemeScope
  events?: NativeComponentEvents
}

export function componentDefaults<N extends NativeComponentName>(name: N) {
  return Object.fromEntries(
    Object.entries(componentContracts[name].props).map(([key, definition]) => [
      key,
      'default' in definition ? definition.default : undefined,
    ]),
  )
}

export function normalizeComponentProps<N extends NativeComponentName>(
  name: N,
  props: NativeComponentProps<N>,
) {
  const result = componentDefaults(name)
  for (const [key, definition] of Object.entries(componentContracts[name].props)) {
    const value = (props as Record<string, unknown>)[key]
    if (value !== undefined) result[key] = value
    if (result[key] === undefined) {
      if ('required' in definition && definition.required)
        throw new TypeError(`${name}.${key} is required`)
      continue
    }
    const kinds: readonly string[] =
      typeof definition.kind === 'string' ? [definition.kind] : definition.kind
    if (!kinds.includes(typeof result[key]))
      throw new TypeError(`${name}.${key} must be ${kinds.join(' or ')}`)
    if ('values' in definition && !(definition.values as readonly unknown[]).includes(result[key]))
      throw new RangeError(`Invalid ${name}.${key}: ${String(result[key])}`)
  }
  return result as Required<NativeComponentProps<N>>
}
