import type { MotionSurface, MotionRegion } from './experimental.js'
import type { Dimension } from './layout.js'
import type { InputAction, InputHandle } from './input.js'
import type { IconName } from './icon.js'
import type { LinkNavigate, LinkTarget } from './link.js'
import type { FontWeight, Palette, Radius, Spacing } from './theme/types.js'

type PropertyKind = 'string' | 'number' | 'boolean' | 'object' | 'function'
declare const propertyValue: unique symbol

/** Plain metadata; the symbol carries a TypeScript type and is never emitted. */
export interface Property<T = unknown> {
  readonly kind: PropertyKind | readonly PropertyKind[]
  readonly default?: T
  readonly required?: boolean
  readonly values?: readonly T[]
  readonly token?: 'space' | 'radius' | 'palette' | 'fontWeight' | 'icon'
  readonly units?: 'layout' | 'dimension'
  readonly runtimeOnly?: boolean
  readonly [propertyValue]?: T
}

function property<T>() {
  return <const D extends Property<T>>(definition: D) => definition as D & Property<T>
}

export type PropertyValue<P> = P extends Property<infer T> ? T : never
export type ContractProps<P extends Record<string, Property>> = {
  [K in keyof P as P[K] extends { required: true } ? K : never]: PropertyValue<P[K]>
} & {
  [K in keyof P as P[K] extends { required: true } ? never : K]?: PropertyValue<P[K]>
}

const text = property<string>()
const number = property<number>()
const boolean = property<boolean>()
const optionalText = text({ kind: 'string', default: undefined })
const flag = boolean({ kind: 'boolean', default: false })

export const spacingProperty = property<Spacing>()({
  kind: ['string', 'number'],
  default: undefined,
  token: 'space',
  units: 'layout',
})
export const radiusProperty = property<Radius | number>()({
  kind: ['string', 'number'],
  default: undefined,
  token: 'radius',
  units: 'layout',
})
export const dimensionProperty = property<Dimension>()({
  kind: ['number', 'string'],
  default: undefined,
  units: 'dimension',
})
export const weightProperty = property<FontWeight>()({
  kind: 'string',
  default: undefined,
  token: 'fontWeight',
})
const icon = property<IconName>()({ kind: 'string', default: undefined, token: 'icon' })

export const viewContract = {
  id: optionalText,
  accessibilityLabel: optionalText,
  accessibilityHidden: boolean({ kind: 'boolean', default: undefined }),
}
export const flexContract = {
  grow: number({ kind: 'number', default: 0 }),
  shrink: number({ kind: 'number', default: undefined }),
}
export const boxContract = {
  ...viewContract,
  ...flexContract,
  padding: spacingProperty,
  paddingX: spacingProperty,
  paddingY: spacingProperty,
  radius: radiusProperty,
  width: dimensionProperty,
  height: dimensionProperty,
  backgroundColor: text({ kind: 'string' }),
}
export const motionBoxContract = {
  ...boxContract,
  motionSurface: property<MotionSurface>()({
    kind: 'object',
    default: undefined,
    runtimeOnly: true,
  }),
  motionRegion: property<MotionRegion>()({ kind: 'object', default: undefined, runtimeOnly: true }),
}
export type Align = 'start' | 'center' | 'end' | 'stretch'
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around'
const layout = {
  ...boxContract,
  gap: spacingProperty,
  justify: property<Justify>()({
    kind: 'string',
    values: ['start', 'center', 'end', 'between', 'around'],
    default: 'start',
  }),
  wrap: flag,
}
export const rowContract = {
  ...layout,
  align: property<Align>()({
    kind: 'string',
    values: ['start', 'center', 'end', 'stretch'],
    default: 'center',
  }),
}
export const columnContract = {
  ...layout,
  align: property<Align>()({
    kind: 'string',
    values: ['start', 'center', 'end', 'stretch'],
    default: 'stretch',
  }),
}

export const navigationContract = {
  href: optionalText,
  target: property<LinkTarget>()({ kind: 'string', values: ['_self', '_blank'], default: '_self' }),
  rel: optionalText,
  navigate: property<LinkNavigate>()({ kind: 'function', default: undefined, runtimeOnly: true }),
}

export const buttonContract = {
  ...navigationContract,
  /** Experimental retained-reorder handle; native keyboard input belongs to Jolt. */
  reorderHandle: flag,
  motionSurface: property<MotionSurface>()({
    kind: 'object',
    default: undefined,
    runtimeOnly: true,
  }),
  ...viewContract,
  ...flexContract,
  text: optionalText,
  type: property<'button' | 'submit' | 'reset'>()({
    kind: 'string',
    values: ['button', 'submit', 'reset'],
    default: 'button',
  }),
  name: optionalText,
  value: optionalText,
  form: optionalText,
  variant: property<'primary' | 'secondary' | 'ghost'>()({
    kind: 'string',
    values: ['primary', 'secondary', 'ghost'],
    default: 'primary',
  }),
  size: property<'sm' | 'md' | 'lg'>()({
    kind: 'string',
    values: ['sm', 'md', 'lg'],
    default: 'md',
  }),
  disabled: flag,
  loading: flag,
  loadingIndicator: property<'none' | 'dots' | 'bars' | 'ring'>()({
    kind: 'string',
    values: ['none', 'dots', 'bars', 'ring'],
    default: 'none',
  }),
  loadingText: text({ kind: 'string', default: 'Loading…' }),
  icon,
  trailingIcon: icon,
}

export const paletteTones: readonly (keyof Palette)[] = [
  'background',
  'surface',
  'elevated',
  'text',
  'muted',
  'primary',
  'onPrimary',
  'primarySoft',
  'accent',
  'onAccent',
  'accentSoft',
  'border',
  'warning',
  'success',
  'danger',
]
export const textContract = {
  motionSurface: property<MotionSurface>()({
    kind: 'object',
    default: undefined,
    runtimeOnly: true,
  }),
  weight: weightProperty,
  ...viewContract,
  ...flexContract,
  text: optionalText,
  as: property<'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>()({
    kind: 'string',
    values: ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    default: 'p',
  }),
  variant: property<'display' | 'title' | 'heading' | 'body' | 'caption' | 'overline'>()({
    kind: 'string',
    values: ['display', 'title', 'heading', 'body', 'caption', 'overline'],
    default: 'body',
  }),
  tone: property<keyof Palette>()({
    kind: 'string',
    values: paletteTones,
    default: 'text',
    token: 'palette',
  }),
  align: property<'left' | 'center' | 'right'>()({
    kind: 'string',
    values: ['left', 'center', 'right'],
    default: 'left',
  }),
  wrap: boolean({ kind: 'boolean', default: true }),
}
export const inputContract = {
  id: viewContract.id,
  accessibilityHidden: viewContract.accessibilityHidden,
  ...flexContract,
  width: dimensionProperty,
  modelValue: text({ kind: 'string', default: '' }),
  label: text({ kind: 'string', required: true }),
  placeholder: text({ kind: 'string', default: '' }),
  helperText: text({ kind: 'string', default: '' }),
  error: text({ kind: 'string', default: '' }),
  type: property<'text' | 'email' | 'password' | 'tel' | 'url' | 'search'>()({
    kind: 'string',
    values: ['text', 'email', 'password', 'tel', 'url', 'search'],
    default: 'text',
  }),
  name: optionalText,
  autocomplete: optionalText,
  required: flag,
  inputmode: property<
    'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  >()({ kind: 'string', default: undefined }),
  form: optionalText,
  disabled: flag,
  readonly: flag,
  multiline: flag,
  rows: number({ kind: 'number', default: 3 }),
  maxLength: number({ kind: 'number', default: undefined }),
  autocapitalize: property<'none' | 'sentences' | 'words' | 'characters'>()({
    kind: 'string',
    values: ['none', 'sentences', 'words', 'characters'],
    default: undefined,
  }),
  autocorrect: boolean({ kind: 'boolean', default: undefined }),
  returnKey: property<'done' | 'next' | 'go' | 'search' | 'send'>()({
    kind: 'string',
    values: ['done', 'next', 'go', 'search', 'send'],
    default: 'done',
  }),
  trailingAction: property<InputAction>()({ kind: 'object', default: undefined }),
  icon,
  trailingIcon: icon,
}

/** Value changes are requests to the owner, not mutations of parent state. */
export interface InputEvents {
  valueChange(value: string): void
  submit(value: string): void
  focus(): void
  blur(): void
  action(): void
}
export interface ButtonEvents {
  activate(): void
  error(error: unknown): void
}
export type TextInputHandle = InputHandle

export const componentContracts = {
  MBox: { version: 1, props: motionBoxContract, slots: ['default'], events: {} },
  MRow: { version: 1, props: rowContract, slots: ['default'], events: {} },
  MColumn: { version: 1, props: columnContract, slots: ['default'], events: {} },
  MText: { version: 1, props: textContract, slots: ['text', 'spans'], events: {} },
  MButton: {
    version: 1,
    props: buttonContract,
    slots: ['text', 'leading-decoration', 'trailing-decoration'],
    events: { activate: 'none', error: 'unknown' },
  },
  MInput: {
    version: 1,
    props: inputContract,
    slots: [],
    events: {
      valueChange: 'string',
      submit: 'string',
      focus: 'none',
      blur: 'none',
      action: 'none',
    },
    binding: { prop: 'modelValue', event: 'valueChange', owner: 'parent' },
    handles: ['focus', 'blur'],
  },
} as const

/** JSON-compatible descriptions; unset defaults remain distinct from no default. */
export function describeContract(name: keyof typeof componentContracts) {
  const contract = componentContracts[name]
  return {
    ...contract,
    props: Object.fromEntries(
      Object.entries(contract.props).map(([name, definition]) => [
        name,
        {
          ...definition,
          ...('default' in definition && definition.default === undefined
            ? { default: { unset: true } }
            : {}),
        },
      ]),
    ),
  }
}
