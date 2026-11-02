import type { PropType } from '@vue/runtime-core'
import type { Property, PropertyValue } from '../contracts.js'

type VueProperty<P extends Property> = { type: PropType<PropertyValue<P>> } & (P extends {
  default: infer D
}
  ? { default: D extends undefined ? undefined : PropertyValue<P> }
  : unknown) &
  (P extends { required: true } ? { required: true } : unknown)

const constructors = {
  string: String,
  number: Number,
  boolean: Boolean,
  object: Object,
  function: Function,
}

/** Vue owns coercion and warnings; portable metadata owns names, defaults and allowed values. */
export function vueProperty<P extends Property>(definition: P): VueProperty<P> {
  const kinds = Array.isArray(definition.kind) ? definition.kind : [definition.kind]
  const types = kinds.map((kind: keyof typeof constructors) => constructors[kind])
  return {
    type: types.length === 1 ? types[0] : types,
    ...('default' in definition ? { default: definition.default } : {}),
    ...(definition.required ? { required: true } : {}),
    ...(definition.values
      ? { validator: (value: unknown) => definition.values!.includes(value) }
      : {}),
  } as VueProperty<P>
}

export function vueProps<P extends Record<string, Property>>(properties: P) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, vueProperty(value)]),
  ) as {
    [K in keyof P]: VueProperty<P[K]>
  }
}
