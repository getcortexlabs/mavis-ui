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
    if (key === 'upload') {
      values.upload = reader.asyncCallback(
        property.initializer,
        [{ k: 'opaque', name: 'FileUploadContext', swift: 'MavisFileUploadContext' }],
        T.void,
        within('action'),
      )
      continue
    }
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
      'Read controller snapshots inside an action; use subscribe to observe changes in reactive state.',
    )
  if (node.questionDotToken)
    reader.fail(node, 'An owned file selection controller is always present.')
  const field = node.name.text
  if (!['state', 'canUpload'].includes(field))
    reader.fail(
      node,
      'File selection exposes state and canUpload as values; call its methods from an action.',
    )
  return {
    e: 'controller-value',
    owner: 'MFilePicker',
    ref,
    field,
    type: field === 'state' ? reader.record('FileSelectionState') : T.boolean,
  }
}

export function fileSelectionReadCall({ node, ref, ctx, reader }) {
  if (ctx.mode !== 'action')
    reader.fail(
      node,
      'Read controller snapshots inside an action; use subscribe to observe changes in reactive state.',
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
  const method = node.expression.name.text
  if (method === 'subscribe') {
    if (node.arguments.length !== 1)
      reader.fail(node, 'subscribe takes one callback of the file selection snapshot.')
    const callback = reader.ownedCallback(
      node.arguments[0],
      [reader.record('FileSelectionState')],
      T.void,
      ctx,
    )
    if (callback.throws) reader.fail(node, 'Handle errors inside a file subscription callback.')
    return { s: 'call', owner: 'MFilePicker', ref, method, callback }
  }
  if (method === 'upload' || method === 'retry') {
    return {
      s: 'call',
      owner: 'MFilePicker',
      ref,
      method,
      args: reader.args(node, node.arguments, [T.string], ctx),
      async: true,
      type: T.void,
    }
  }
  const methods = {
    remove: [T.string],
    clear: [],
    cancel: [T.string],
    cancelSelection: [],
    pause: [],
    dispose: [],
    discardPreview: [T.string],
  }
  if (!methods[method])
    reader.fail(
      node,
      `${method} needs the platform file adapter or upload service on the Mac (#340). Selection itself belongs to MFilePicker.`,
    )
  return {
    s: 'call',
    owner: 'MFilePicker',
    ref,
    method,
    args: reader.args(node, node.arguments, methods[method], ctx),
  }
}

// The upload context is an opaque host resource. Its item is copied into the portable record;
// handles stay opaque and are forwarded only to host services.
export function fileOpaqueMember({ node, object, ctx, reader }) {
  const name = node.name.text
  const field = (name, type) => ({ e: 'field', object, name, type })
  if (object.type.name === 'FileUploadContext') {
    if (name === 'handle')
      return field(name, { k: 'opaque', name: 'FileHandle', swift: 'MavisFileHandle' })
    if (name === 'cancellation')
      return field(name, { k: 'opaque', name: 'FileCancellation', swift: 'MavisFileCancellation' })
    if (name === 'item') {
      const type = reader.record('FileItem')
      const item = field('item', {
        k: 'opaque',
        name: 'FileItemNative',
        swift: 'MavisFileDescriptor',
      })
      return {
        e: 'record',
        name: 'FileItem',
        type,
        fields: reader
          .fields('FileItem')
          .map((each) => ({
            name: each.name,
            value: { e: 'field', object: item, name: each.name, type: each.type },
          })),
      }
    }
  }
  if (object.type.name === 'FileCancellation' && name === 'cancelled') return field(name, T.boolean)
  reader.fail(
    node,
    `${object.type.name} stays opaque; use its published properties and host services.`,
  )
}

export function fileOpaqueEffect({ node, object, ctx, reader }) {
  const method = node.expression.name.text
  if (object.type.name === 'FileUploadContext' && method === 'progress') {
    if (node.arguments.length < 1 || node.arguments.length > 2)
      reader.fail(node, 'progress takes loaded bytes and an optional total.')
    const args = node.arguments.map((arg, index) =>
      reader.expr(arg, ctx, index ? T.optional(T.number) : T.number),
    )
    return { s: 'call', owner: 'MFilePicker', object, method, args, throws: true }
  }
  if (object.type.name === 'FileCancellation' && method === 'onCancel') {
    if (node.arguments.length !== 1) reader.fail(node, 'onCancel takes one cleanup callback.')
    return {
      s: 'call',
      owner: 'MFilePicker',
      object,
      method,
      callback: reader.ownedCallback(node.arguments[0], [], T.void, ctx),
      throws: true,
    }
  }
  reader.fail(node, `${object.type.name} has no supported ${method} action.`)
}
