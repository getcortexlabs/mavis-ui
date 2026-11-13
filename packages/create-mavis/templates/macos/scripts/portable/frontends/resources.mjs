// Source readers for the owned file controller. Registered through MFilePicker.composable,
// the same composable metadata used by useToast; there is no parallel controller registry.
import ts from 'typescript'
import { T } from '../model.mjs'

export function fileSelectionOpen({ call, reader, within }) {
  if (call.typeArguments?.length || call.arguments.length > 1)
    reader.fail(call, 'useFileSelection takes one options object, without type arguments.')
  const options = call.arguments[0]
  if (options && !ts.isObjectLiteralExpression(options))
    reader.fail(options, 'Write the file selection options where its owner is created.')
  const values = {}
  for (const property of options?.properties ?? []) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
      reader.fail(property, 'Write each file selection option as name: value.')
    const key = property.name.text
    if (key in values) reader.fail(property, `${key} is set twice.`)
    if (key === 'upload')
      reader.fail(
        property,
        'File upload needs an opaque file handle and the host upload service on the Mac (#340); do not replace it with a file path or serializable record.',
      )
    const types = {
      initial: () => T.array(reader.record('FileItem')),
      multiple: () => T.boolean,
      accept: () => T.array(T.string),
      maxCount: () => T.number,
      maxSize: () => T.number,
    }
    if (!types[key]) reader.fail(property, `${key} is not a FileSelectionOptions property.`)
    values[key] = reader.expr(property.initializer, within('initializer'), types[key]())
    const value = values[key]
    if (
      value.e === 'lit' &&
      key === 'maxCount' &&
      (!Number.isInteger(value.value) || value.value < 1)
    )
      reader.fail(property, 'File maxCount must be a positive integer.')
    if (
      value.e === 'lit' &&
      key === 'maxSize' &&
      (!Number.isFinite(value.value) || value.value < 0)
    )
      reader.fail(property, 'File maxSize must be finite and nonnegative.')
  }
  return values
}

export function fileSelectionMember({ node, ref, ctx, reader }) {
  if (ctx.mode !== 'action')
    reader.fail(
      node,
      'Read controller values inside an action; observing changes on the Mac needs the published subscribe contract (#340).',
    )
  if (node.questionDotToken)
    reader.fail(node, 'An owned file selection controller is always present.')
  const field = node.name.text
  if (field === 'state')
    reader.fail(
      node,
      'File selection state changes through subscribe; portable subscriptions must preserve the controller snapshot and ownership before using state on the Mac (#340).',
    )
  if (field !== 'canUpload')
    reader.fail(
      node,
      'File selection exposes canUpload as a value; call its methods from an action.',
    )
  return {
    e: 'controller-value',
    owner: 'MFilePicker',
    ref,
    field,
    type: T.boolean,
  }
}

export function fileSelectionReadCall({ node, ref, ctx, reader }) {
  if (ctx.mode !== 'action')
    reader.fail(
      node,
      'Read controller values inside an action; observing changes on the Mac needs the published subscribe contract (#340).',
    )
  if (node.expression.name.text !== 'hasFile')
    reader.fail(
      node,
      'Only hasFile returns a portable value; preview handles stay in the platform renderer.',
    )
  return {
    e: 'controller-call',
    ref,
    method: 'hasFile',
    args: reader.args(node, node.arguments, [T.string], ctx),
    type: T.boolean,
  }
}

export function fileSelectionCall({ node, ref, ctx, reader }) {
  const methods = {
    remove: [T.string],
    clear: [],
    cancel: [T.string],
    cancelSelection: [],
    pause: [],
    dispose: [],
    discardPreview: [T.string],
  }
  const method = node.expression.name.text
  if (!methods[method])
    reader.fail(
      node,
      `${method} needs the platform file adapter or upload service on the Mac (#340). Selection itself belongs to MFilePicker.`,
    )
  return { s: 'call', ref, method, args: reader.args(node, node.arguments, methods[method], ctx) }
}
