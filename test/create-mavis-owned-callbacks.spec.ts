import { describe, expect, it } from 'vitest'
import { mavis } from '../packages/core/src/theme/themes'
// @ts-expect-error The compiler ships in the experimental template.
import { createProgram } from '../packages/create-mavis/templates/macos/scripts/portable/program.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { createReader } from '../packages/create-mavis/templates/macos/scripts/portable/frontends/typescript.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { SwiftEmitter } from '../packages/create-mavis/templates/macos/scripts/portable/emit-swift.mjs'
import {
  ownedCallbacks,
  swiftContext,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/lifetime-swift.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { handlerJs } from '../packages/create-mavis/templates/macos/scripts/portable/js-text.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { T } from '../packages/create-mavis/templates/macos/scripts/portable/model.mjs'

function callback(source: string, async = false, returns = T.string) {
  const program = createProgram(
    new Map([
      [
        'shared/callback.ts',
        `declare const prefix: string; declare const host: { send(value: string): Promise<void> }; const callback = ${source}`,
      ],
    ]),
    mavis,
  )
  expect(program.diagnostics).toEqual([])
  const reader = createReader(program)
  const component = {
    name: 'Home',
    props: [],
    state: [],
    getters: [],
    refs: [],
    stores: [],
    effects: [],
    slots: [],
    actions: [],
    view: { v: 'text', parts: [] },
  }
  const ctx = reader.scope(component, new Map(), 'action', {
    effect(node: any, ctx: any) {
      if (node.expression.getText() !== 'host.send') return
      return {
        s: 'service',
        dep: 'host',
        method: 'send',
        args: node.arguments.map((arg: any) => reader.expr(arg, ctx, T.string)),
        type: T.void,
        async: true,
      }
    },
  })
  ctx.locals.set('prefix', T.string)
  const arrow = program.sourceFile('shared/callback.ts').statements.at(-1).declarationList
    .declarations[0].initializer
  const value = async
    ? reader.asyncCallback(arrow, [T.string], returns, ctx)
    : reader.ownedCallback(arrow, [T.string], returns, ctx)
  return { value, component }
}

describe('retained callbacks', () => {
  it('captures local values and uses the detached component context in synchronous retained callbacks', () => {
    const { value, component } = callback('(value: string) => prefix + value')
    expect(value.captures).toEqual([{ name: 'prefix', type: T.string }])
    const emit = new SwiftEmitter({ records: [], components: [] })
    emit.asyncCallbacks = new Map([[value, 'mavisAsyncCallback1']])
    emit.contextTasks = true
    expect(emit.ownedCallback(value, 0)).toContain(
      '[mavisOwner = self.mavisContext, mavisCapture0 = prefix]',
    )
    expect(emit.ownedCallback(value, 0)).toContain(
      'mavisOwner.mavisAsyncCallback1(mavisArgument0, mavisCapture0)',
    )
    const generated = swiftContext(emit, component, 0).declaration.join('\n')
    expect(generated).toContain(
      'func mavisAsyncCallback1(_ value: String, _ prefix: String) -> String',
    )
    expect(generated).toContain('return (prefix + value)')
    emit.contextTasks = false
    expect(emit.ownedCallback(value, 0)).toContain('[mavisOwner = self, mavisCapture0 = prefix]')
    expect(emit.ownedCallback(value, 0)).not.toContain('self.mavisContext')
  })

  it.each([
    'async (value: string) => { await host.send(value); return }',
    'async (value: string) => await host.send(value)',
  ])('keeps void async callbacks and host failures: %s', (source) => {
    const { value } = callback(source, true, T.void)
    expect(value.async).toBe(true)
    expect(value.throws).toBe(true)
    expect(value.returns).toEqual(T.void)
    expect(handlerJs(value)).toContain('async (value) =>')
    expect(handlerJs(value)).toContain('await host.send(value)')
  })

  it('finds callbacks retained in controller options and action subscriptions exactly once', () => {
    const { value, component } = callback('(value: string) => prefix + value')
    expect(
      ownedCallbacks({
        ...component,
        refs: [{ options: { upload: value } }],
        actions: [{ body: [{ s: 'call', callback: value }] }],
      }),
    ).toEqual([value])
  })
})
