// File controller emission. These helpers depend only on the format-neutral model.
import { swiftRecord } from './components/choices.mjs'

export function fileSelectionSwiftInit({ emit, reference }) {
  const args = ['initial', 'multiple', 'accept', 'maxCount', 'maxSize'].flatMap((key) => {
    const value = reference.options[key]
    if (!value) return []
    const text =
      key === 'initial'
        ? `${emit.wrap(value)}.map { MavisFileDescriptor(id: $0.id, name: $0.name, size: $0.size, type: $0.type, status: $0.status, progress: $0.progress, error: $0.error) }`
        : emit.expr(value)
    return [`${key}: ${text}`]
  })
  return `_${reference.name} = StateObject(wrappedValue: MavisFileSelection(${args.join(', ')}))`
}

export function fileSelectionSwiftValue({ emit, value, owner = 'self' }) {
  const target = `${owner}.${value.ref}`
  if (value.field === 'canUpload') return `${target}.canUpload`
  const item = swiftRecord(emit, 'FileItem', {
    id: '$0.id',
    name: '$0.name',
    size: '$0.size',
    type: '$0.type',
    status: '$0.status',
    progress: '$0.progress',
    error: '$0.error',
  })
  const error = swiftRecord(emit, 'FileSelectionFailure', {
    code: '$0.code',
    message: '$0.message',
  })
  return swiftRecord(emit, 'FileSelectionState', {
    items: `${target}.items.map { ${item} }`,
    picking: `${target}.picking`,
    error: `${target}.error.map { ${error} }`,
  })
}

export function fileSelectionVueScript({ reference, js }) {
  return {
    core: ['useFileSelection'],
    setup: [
      `const ${reference.name} = useFileSelection({ ${Object.entries(reference.options)
        .map(([key, value]) => `${key}: ${js(value)}`)
        .join(', ')} })`,
    ],
  }
}
