import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import {
  defineTheme,
  mavis,
  midnight,
  pressMotion,
  revealMotion,
} from '../packages/core/src/index.js'

describe('shared component motion', () => {
  it('resolves theme scale without capturing an application base or sharing mutable press states', () => {
    const first = pressMotion(mavis.motion.pressScale)
    const custom = defineTheme({ name: 'compact', motion: { pressScale: 0.9 } }, midnight)
    const next = pressMotion(custom.motion.pressScale)
    expect(first.pressed[0].scale).toBe(0.97)
    expect(next.pressed[0].scale).toBe(0.9)
    expect(next.composition).toBe('multiply')
    expect(next.released[0].scale).toBe(1)
    expect(next.pressed[0]).not.toBe(first.pressed[0])
    expect(mavis.motion.pressScale).toBe(0.97)
    expect(pressMotion(1).pressed[0].scale).toBe(1)
  })

  it('rejects invalid scale consistently for themes and recipes', () => {
    for (const value of [0, -0.5, 1.1, Infinity, NaN, '0.97', null, undefined]) {
      const scale = value as number
      expect(() => pressMotion(scale)).toThrow(RangeError)
      expect(() => defineTheme({ name: 'invalid', motion: { pressScale: scale } })).toThrow(
        RangeError,
      )
    }
  })

  it('keeps identical spring and Reveal recipes for both Jolt renderers', () => {
    const motion = pressMotion(0.96)
    expect(motion.pressed[1]).toEqual({ type: 'spring', duration: 200, bounce: 0 })
    expect(motion.released[1]).toEqual({ type: 'spring', duration: 450, bounce: 0.35 })
    expect(revealMotion.enter).toEqual([{ opacity: [0, 1], y: [8, 0] }, { duration: 180 }])
    expect(revealMotion.leave).toEqual([{ opacity: 0 }, { duration: 120 }])
  })

  it('typechecks recipes without DOM libraries, framework types or platform dependencies', () => {
    const program = ts.createProgram(
      ['packages/core/src/motion.ts', 'packages/core/src/experimental.ts'],
      {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        lib: ['lib.es2022.d.ts'],
        types: [],
        strict: true,
        noEmit: true,
      },
    )
    expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => diagnostic.messageText)).toEqual(
      [],
    )
  })

  it('imports the built core package in Node without browser or native runtimes', () => {
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import { pressMotion, revealMotion } from '@getcortexlabs/mavis-core'
      console.log(JSON.stringify([pressMotion(0.9).pressed[0].scale, revealMotion.enter[1].duration]))
    `,
      ],
      { encoding: 'utf8' },
    )
    expect(JSON.parse(output)).toEqual([0.9, 180])
  })
})
