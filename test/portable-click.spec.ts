import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'

const harness = readFileSync(
  new URL('../scripts/check-portable-conformance.mjs', import.meta.url),
  'utf8',
)
// Exercise the runner's actual dispatch without compiling fixtures or starting any platform.
const source = ts.createSourceFile(
  'conformance.mjs',
  harness,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
)
const declaration = source.statements.find(
  (node): node is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(node) && node.name?.text === 'swiftStep',
)!
const step = new Function(
  'swiftString',
  'navigationStep',
  `return (${declaration.getText(source)})`,
)(JSON.stringify, () => false)

describe('portable disabled action probes', () => {
  it('dispatches only explicit force probes away from normal actions', () => {
    expect(step({ click: 'Unavailable', force: true }, 3)).toBe(
      'probeDisabled(app, "Unavailable", 0, link: false, step: 3)',
    )
    expect(step({ click: 'Available' }, 4)).toBe('click(app, "Available", 0, link: false, step: 4)')
    expect(step({ click: 'Available', force: false }, 5)).toBe(
      'click(app, "Available", 0, link: false, step: 5)',
    )
  })
  it('preserves link roles and repeated controls when probing disabled guards', () => {
    expect(step({ click: 'Guide', role: 'link', nth: 1, force: true }, 6)).toBe(
      'probeDisabled(app, "Guide", 1, link: true, step: 6)',
    )
  })
})
