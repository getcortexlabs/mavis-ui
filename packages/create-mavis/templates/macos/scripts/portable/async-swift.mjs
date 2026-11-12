// Swift for what an async function of a component does while it waits: awaiting another one,
// a refresh context's commit, and try with catch and finally.

/** The statements emit-swift.mjs leaves to this file, or undefined for one it does not know. */
export function swiftAsync(emit, s, indent) {
  const pad = ' '.repeat(indent)
  const block = (list, by) => emit.statements(list, indent + by) || `${pad}${' '.repeat(by)}`
  switch (s.s) {
    case 'action': {
      if (!emit.asyncActions?.has(s.name)) return undefined
      const call = `self.${s.name}(${s.args.map((arg) => emit.expr(arg)).join(', ')})`
      // Not awaited, it runs on its own, as a promise nobody waits for does.
      if (!s.await) return `${pad}Task { @MainActor in await ${call} }`
      return `${pad}${emit.failing?.has(s.name) ? 'try ' : ''}await ${call}`
    }
    case 'commit':
      return `${pad}${s.into ? `let ${s.into}: Bool = ` : '_ = '}${s.ref}.commit {\n${block(s.body, 4)}\n${pad}}`
    case 'try': {
      // finally is a defer around the rest: it runs after the body and after what catches it.
      const lines = [`${pad}do {`]
      const by = s.finally.length && s.catch ? 8 : 4
      if (s.finally.length) lines.push(`${pad}    defer {`, block(s.finally, 8), `${pad}    }`)
      if (s.finally.length && s.catch) lines.push(`${pad}    do {`)
      lines.push(block(s.body, by))
      if (s.catch) lines.push(`${' '.repeat(indent + by - 4)}} catch {`, block(s.catch, by))
      if (s.finally.length && s.catch) lines.push(`${pad}    }`)
      lines.push(`${pad}}`)
      return lines.join('\n')
    }
  }
  return undefined
}
