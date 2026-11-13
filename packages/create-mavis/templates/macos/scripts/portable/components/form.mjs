// MFormGroup and MFormErrors, and what a shared screen says of a form's errors. The Mavis core
// keeps them in a form controller (useFormController), a service of the host. A Vue file uses
// it as written; the Mac reads the parts of it that need no service: the errors are a value of
// the screen, the fields are the ones registered with useFormField, and focus goes through the
// fields' own references.
import { jsString, js } from '../js-text.mjs'
import { T } from '../model.mjs'
import { swiftString } from '../swift-text.mjs'
import { flexRuntime } from './flex.mjs'
import { later } from './input-kit.mjs'
import { accessibility } from './shared.mjs'

const errorType = T.record('FormError')
const listType = T.array(errorType)

const service = (what) =>
  `${what} is async work of the form controller, which does not reach the Mac yet (#340). Check the fields in a function of the screen and hand the result to setErrors.`

/** The value of the screen that holds the errors of the controller of this name. */
export const formErrors = (name) => `${name}Errors`

/** form.setErrors(list): the errors become the value the summary reads. */
export const setErrors = (name, value) => ({
  s: 'assign',
  target: { name: formErrors(name), fields: [], type: listType },
  op: '=',
  value,
})

/**
 * form.focusFirstError(): focus goes to the field of the first error that has one, as the
 * controller walks its errors in order.
 */
export function focusFirstError(name, fields) {
  const error = { e: 'local', name: 'error', type: errorType }
  const first = {
    e: 'call',
    method: 'find',
    object: { e: 'state', name: formErrors(name), type: listType },
    args: [
      {
        e: 'arrow',
        params: ['error'],
        types: [errorType],
        body: {
          e: 'call',
          method: 'includes',
          object: {
            e: 'array',
            items: fields.map((field) => ({ e: 'lit', value: field.name, type: T.string })),
            type: T.array(T.string),
          },
          args: [{ e: 'field', object: error, name: 'field', optional: false, type: T.string }],
          type: T.boolean,
        },
        type: errorType,
      },
    ],
    type: T.optional(errorType),
  }
  const owner = { e: 'field', object: first, name: 'field', optional: true, type: T.optional(T.string) }
  return fields.reduceRight(
    (otherwise, field) => [
      {
        s: 'if',
        test: {
          e: 'binary',
          op: '===',
          left: owner,
          right: { e: 'lit', value: field.name, type: T.string },
          type: T.boolean,
        },
        then: [{ s: 'focus', ref: field.ref }],
        else: otherwise,
      },
    ],
    [],
  )[0]
}

/** What a call on a form controller is on the Mac, or why it is not there yet. */
export function formCall(name, method, { fields, args, fail, node }) {
  if (method === 'setErrors') return setErrors(name, args(listType))
  if (method === 'focusFirstError') {
    if (!fields.length)
      fail(node, `${name} has no fields yet: register them with useFormField(${name}, { … }).`)
    return focusFirstError(name, fields)
  }
  if (method === 'validate') fail(node, service(`${name}.validate`))
  if (method === 'invalidate')
    fail(
      node,
      `${name}.invalidate cancels a validation that is running, which is async work the Mac does not have yet (#340). Leave it out: setErrors replaces the errors at once.`,
    )
  fail(
    node,
    `${name}.${method} is not available to shared screens on the Mac: a form controller takes setErrors(errors) and focusFirstError() there.`,
  )
}

/**
 * The form controllers of a Vue script, for the Vue front end: what the script makes with
 * useFormController, registers with useFormField and calls on the controller.
 */
export function vueForms({ component, members, declare, pending, fail, expr, record, ts }) {
  component.forms = new Map()
  const controller = (node, ctx) =>
    ts.isIdentifier(node) && members.get(node.text) === 'Form' && !ctx?.locals.has(node.text)
      ? node.text
      : undefined
  return {
    /** const form = useFormController() */
    make(declaration) {
      const name = declaration.name.text
      if (declaration.initializer.arguments.length)
        fail(
          declaration.initializer,
          'useFormController() starts without errors on the Mac: hand them to setErrors.',
        )
      declare(declaration, name, 'Form')
      declare(declaration, formErrors(name), 'State')
      component.forms.set(name, { fields: [] })
      pending.push(() => {
        record('FormError')
        component.state.push({
          name: formErrors(name),
          type: listType,
          init: { e: 'array', items: [], type: listType },
        })
      })
    },
    /** useFormField(form, { name, label, target: () => fieldRef.value }) */
    field(call, ctx) {
      const example = "useFormField(form, { name: 'email', label: 'Email', target: () => emailRef.value })"
      const [owner, written] = call.arguments
      const name = owner && controller(owner)
      if (call.arguments.length !== 2 || !name || !ts.isObjectLiteralExpression(written))
        fail(call, `Register a field as ${example}.`)
      const parts = new Map()
      for (const property of written.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
          fail(property, `Register a field as ${example}.`)
        parts.set(property.name.text, property.initializer)
      }
      for (const key of parts.keys())
        if (!['name', 'label', 'target'].includes(key))
          fail(
            parts.get(key),
            `${key} is run by the form controller of the host, which does not reach the Mac yet (#340): a field has a name, a label and a target.`,
          )
      const [named, label, target] = ['name', 'label', 'target'].map((key) => parts.get(key))
      if (!named || !label || !target) fail(written, `Register a field as ${example}.`)
      if (!ts.isStringLiteral(named) || !named.text.trim())
        fail(named, 'The name of a field is written out, for example name: "email".')
      const reference =
        ts.isArrowFunction(target) &&
        !target.parameters.length &&
        ts.isPropertyAccessExpression(target.body) &&
        target.body.name.text === 'value'
          ? target.body.expression
          : fail(target, 'target returns the reference of the input: target: () => emailRef.value.')
      const fields = component.forms.get(name).fields
      if (fields.some((each) => each.name === named.text))
        fail(named, `The field ${named.text} is registered twice.`)
      fields.push({
        name: named.text,
        label: fieldLabel(label, (text) => expr(text, ctx, T.string), ts),
        ref: fieldRef(reference, { ctx, fail, ts }),
      })
    },
    /** form.setErrors(errors) and form.focusFirstError() as what they do on the Mac. */
    call(node, ctx) {
      const callee = node.expression
      const name = ts.isPropertyAccessExpression(callee) ? controller(callee.expression, ctx) : null
      if (!name) return undefined
      return formCall(name, callee.name.text, {
        fields: component.forms.get(name).fields,
        args(type) {
          if (node.arguments.length !== 1) fail(node, 'setErrors takes the list of errors.')
          return expr(node.arguments[0], ctx, type)
        },
        fail,
        node,
      })
    },
  }
}

/** One field of a form as written in an object: its name, its label and the field's reference. */
function field(node, read, { fail, ts }) {
  const example = "{ name: 'email', label: 'Email', ref: emailRef }"
  if (!ts.isObjectLiteralExpression(node)) fail(node, `Write each field out: ${example}.`)
  const parts = new Map()
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
      fail(property, `Write each field out: ${example}.`)
    parts.set(property.name.text, property.initializer)
  }
  for (const key of ['name', 'label', 'ref'])
    if (!parts.has(key)) fail(node, `A field of a form has a name, a label and a ref: ${example}.`)
  for (const key of parts.keys())
    if (!['name', 'label', 'ref'].includes(key))
      fail(parts.get(key), `A field of a form has a name, a label and a ref: ${key} is not one.`)
  const name = parts.get('name')
  if (!ts.isStringLiteral(name) || !name.text.trim())
    fail(name, 'The name of a field is written out, for example name: "email".')
  return { name: name.text, label: read.label(parts.get('label')), ref: read.ref(parts.get('ref')) }
}

/** The label of a field: text written out, or a value. */
export const fieldLabel = (node, value, ts) =>
  ts.isStringLiteral(node) ? { lit: node.text } : { expr: value(node) }

/** The reference of a field: one declared for an input, which the screen attaches with ref. */
export function fieldRef(node, { ctx, fail, ts }) {
  const known = ts.isIdentifier(node)
    ? ctx.component.refs.find((ref) => ref.name === node.text)
    : null
  if (!known || ctx.members.get(node.text) !== 'Ref' || known.kind)
    fail(node, 'A field of a form names the reference of its input: ref={emailRef} on the MInput.')
  return node.text
}

// form: the controller of a Vue file, or in TSX what it holds, written out.
function form(source) {
  const { value, attribute, ctx, expr, fail, record, ts } = source
  record('FormError')
  if (ts.isIdentifier(value) && ctx.members.get(value.text) === 'Form') {
    const known = ctx.component.forms.get(value.text)
    return {
      errors: { e: 'state', name: formErrors(value.text), type: listType },
      fields: known.fields,
    }
  }
  const example =
    "form={{ errors: state.errors, fields: [{ name: 'email', label: 'Email', ref: emailRef }] }}"
  if (!ts.isObjectLiteralExpression(value))
    fail(
      attribute,
      `form is the controller made with useFormController in a Vue file, or written out: ${example}.`,
    )
  const parts = new Map()
  for (const property of value.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
      fail(property, `Write the form out: ${example}.`)
    parts.set(property.name.text, property.initializer)
  }
  const list = parts.get('fields')
  if (!parts.has('errors') || !list || !ts.isArrayLiteralExpression(list))
    fail(attribute, `A form has its errors and its fields, written out: ${example}.`)
  const fields = list.elements.map((item) =>
    field(
      item,
      {
        label: (node) => fieldLabel(node, (text) => expr(text, ctx, T.string), ts),
        ref: (node) => fieldRef(node, source),
      },
      source,
    ),
  )
  const repeated = fields.find((each, index) =>
    fields.some((other, at) => at < index && other.name === each.name),
  )
  if (repeated) fail(attribute, `The field ${repeated.name} is in the form twice.`)
  return { errors: expr(parts.get('errors'), ctx, listType), fields }
}

// The controller a generated Vue file hands the Web and NativeScript components: made in its
// script, with the fields the source lists, and kept in step with the source's errors.
const controllers = new WeakMap()

const groupTypes =
  'declare function MFormGroup(props: { label: string; description?: string; id?: string; children?: unknown }): JSX.Element'

// formGroupProps: fields under a heading and an optional description, in a column of their own.
export const MFormGroup = {
  props: { id: 'string', label: 'string', description: 'string' },
  required: ['label'],
  children: 'elements',
  uses: [flexRuntime],
  declaration: groupTypes,
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `label: ${emit.value(props.label)}`,
      ...(props.description ? [`description: ${emit.value(props.description)}`] : []),
    ]
    return [
      `${pad}MavisFormGroup(${args.join(', ')}) {`,
      node.children.map((child) => emit.view(child, indent + 4, tokens)).join('\n') ||
        `${pad}    EmptyView()`,
      `${pad}}`,
      ...accessibility({ id: props.id }, context, { container: true }),
    ].join('\n')
  },
  swiftRuntime: ({ theme, font }) => `/// MFormGroup: a heading, an optional description and the fields under them, in a column.
struct MavisFormGroup<Content: View>: View {
    let label: String
    var description: String = ""
    @ViewBuilder var content: () -> Content

    var body: some View {
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(.h2)
            if !description.isEmpty {
                Text(verbatim: description)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            content()
        }
    }
}`,
}

const errorsTypes = 'title?: string; announce?: boolean'

// formErrorsProps: the errors of a form under a title, each one a button that moves focus to its
// field. It shows nothing while there are no errors. announce is for assistive technology on
// the Web.
export const MFormErrors = {
  props: {
    form,
    title: 'string',
    announce: 'boolean',
    onFocus: later(
      'focus hands its listener two values, the field and whether it took the focus, which an event of a shared screen cannot carry to the Mac yet (#349). The summary moves the focus itself.',
    ),
  },
  required: ['form'],
  control: true,
  uses: [flexRuntime],
  types: () => `/** One error of a form: the name of its field and what is wrong with it. */
type FormError = { field: string; message: string }`,
  records: { FormError: 'the Mavis form error type' },
  declaration: `declare function MFormErrors(props: { form: { errors: readonly FormError[]; fields: readonly { name: string; label: string; ref: MavisFieldRef }[] }; ${errorsTypes}; onFocus?: unknown }): JSX.Element`,
  focus: () => true,
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const fields = props.form.fields.map(
      (each) =>
        `MavisFormField(name: ${swiftString(each.name)}, label: ${emit.value(each.label)}, key: ${swiftString(each.ref)})`,
    )
    const args = [
      ...(props.title ? [`title: ${emit.value(props.title)}`] : []),
      `errors: ${emit.wrap(props.form.errors)}.map { MavisFormError(field: $0.field, message: $0.message) }`,
      `fields: [${fields.join(', ')}]`,
      'focus: $mavisFocus',
    ]
    return `${pad}MavisFormErrors(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
  },
  swiftRuntime: ({ theme, font }) => `/// One error of a form, without the shared record type so every project can use it.
struct MavisFormError: Hashable {
    let field: String
    let message: String
}

/// A field a form knows: its name, the label its errors are read with, and its focus key.
struct MavisFormField {
    let name: String
    let label: String
    let key: String
}

/// MFormErrors: the errors of a form under a title, on the theme's surface. An error whose field
/// the form knows is a button that moves the focus there; the others are shown and do nothing.
/// Jolt brings the summary in and takes it out; it shows nothing while there are no errors.
struct MavisFormErrors: View {
    var title: String = "Review these fields"
    let errors: [MavisFormError]
    let fields: [MavisFormField]
    let focus: FocusState<String?>.Binding

    private func field(_ error: MavisFormError) -> MavisFormField? {
        fields.first { $0.name == error.field }
    }

    var body: some View {
        JoltPresence(!errors.isEmpty) {
            MavisColumn(spacing: ${theme.space.sm}) {
                Text(verbatim: title)
                    .font(${font('heading')})
                    .foregroundStyle(MavisTokens.danger)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(.h2)
                ForEach(Array(errors.enumerated()), id: \\.offset) { entry in
                    let known = field(entry.element)
                    Button {
                        if let known { focus.wrappedValue = known.key }
                    } label: {
                        Text(verbatim: known.map { $0.label + ": " + entry.element.message } ?? entry.element.message)
                    }
                    .buttonStyle(MavisButtonStyle(variant: .ghost))
                    .disabled(known == nil)
                }
            }
            .padding(${theme.space.md})
            .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
        }
    }
}`,
  vue: {
    attribute(name, value) {
      if (name === 'form') return `:form="${controllers.get(value)}"`
    },
    script(nodes) {
      if (!nodes.length) return {}
      const setup = nodes.flatMap(({ props }, index) => {
        const controller = `mavisForm${index + 1}`
        controllers.set(props.form, controller)
        return [
          `const ${controller} = useFormController()`,
          ...props.form.fields.map(
            (each) =>
              `useFormField(${controller}, { name: ${jsString(each.name)}, label: ${'lit' in each.label ? jsString(each.label.lit) : js(each.label.expr)}, target: () => ${each.ref}.value })`,
          ),
          `watch(() => ${js(props.form.errors)}, (errors) => ${controller}.setErrors(errors), { immediate: true, deep: true })`,
        ]
      })
      return {
        core: ['useFormController', 'useFormField'],
        imports: { vue: ['watch'] },
        setup,
      }
    },
    source: {
      hidden: ['onFocus'],
      declaration: `(props: { form: __MavisForm; ${errorsTypes} }) => JSX.Element`,
      // What a Vue file imports beside the components: the controller, its fields and its errors.
      values: ['useFormController', 'useFormField'],
      types: ['FormError', 'FormController'],
      makes: { useFormController: 'form' },
      statements: ['useFormField'],
      ambient: {
        global: `interface __MavisForm {
  readonly state: { readonly errors: readonly FormError[]; readonly validating: boolean }
  setErrors(errors: readonly FormError[]): void
  focusFirstError(): Promise<boolean>
  focusError(field: string): Promise<boolean>
  invalidate(): void
  validate(task: (context: { readonly current: boolean }) => Promise<readonly FormError[]>): Promise<'valid' | 'invalid' | 'cancelled' | 'busy'>
}
type __MavisFormError = FormError`,
        values: `export function useFormController(initial?: readonly FormError[]): __MavisForm
  export function useFormField(form: __MavisForm, field: { name: string; label: string; target: () => __MavisInputHandle | null | undefined; enabled?: () => boolean; reveal?: () => void | Promise<void> }): () => void`,
        types: `export type FormError = __MavisFormError
  export type FormController = __MavisForm`,
      },
    },
  },
}
