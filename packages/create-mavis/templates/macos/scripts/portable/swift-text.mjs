// Swift source text shared by the SwiftUI emitter and the component modules.

export function swiftString(text) {
  if (!text.isWellFormed()) throw new Error('Text must contain well-formed Unicode.')
  return `"${Array.from(text, (char) => {
    if (char === '\\') return '\\\\'
    if (char === '"') return '\\"'
    const code = char.codePointAt(0)
    // Control characters and invisible separators stay readable and unambiguous in the source.
    return code < 0x20 ||
      (code >= 0x7f && code <= 0x9f) ||
      code === 0x2028 ||
      code === 0x2029 ||
      code === 0xfeff
      ? `\\u{${code.toString(16)}}`
      : char
  }).join('')}"`
}

export const swiftNumber = (value) => {
  const text = String(Math.abs(value))
  const literal = /[.e]/.test(text) ? text : `${text}.0`
  return value < 0 || Object.is(value, -0) ? `-${literal}` : literal
}

export function swiftType(type) {
  switch (type.k) {
    case 'string':
      return 'String'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Bool'
    case 'record':
      return type.name
    case 'array':
      return `[${swiftType(type.of)}]`
    case 'optional':
      return `${swiftType(type.of)}?`
    case 'function':
      return `(${type.params.map(swiftType).join(', ')}) -> Void`
    case 'refresh':
      return 'MavisRefreshContext'
  }
  throw new Error(`No Swift type for ${type.k}`)
}
