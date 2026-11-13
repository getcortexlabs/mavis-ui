import { describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
// @ts-expect-error Native ESM orchestration helper.
import { portableSelection, nativeSmokeFixtures } from '../scripts/portable-selection.mjs'

const corpus = readdirSync(new URL('./portable', import.meta.url))
describe('portable CI selection', () => {
  it('compiles the complete corpus even though PR UI coverage is explicitly smoke', () => {
    const compile = portableSelection(corpus, { args: ['--native', '--build-only'] })
    const smoke = portableSelection(corpus, { args: ['--native', '--smoke'] })
    expect(compile.names).toEqual([...corpus].sort())
    expect(compile.scope).toBe('full')
    expect(compile.buildOnly).toBe(true)
    expect(smoke.scope).toBe('smoke')
    expect(smoke.names).toEqual(nativeSmokeFixtures)
    expect(smoke.names).toEqual(
      expect.arrayContaining(['calendar', 'calendarVue', 'motionImage', 'motionImageVue']),
    )
    expect(smoke.names.length).toBeLessThan(12)
  })
  it('partitions the full corpus exactly once, regardless of input ordering', () => {
    const parts = Array.from({ length: 8 }, (_, index) =>
      portableSelection([...corpus].reverse(), { args: ['--native', '--shard', `${index + 1}/8`] }),
    )
    expect(parts.every((part) => part.scope === 'shard')).toBe(true)
    expect(parts.flatMap((part) => part.names).sort()).toEqual([...corpus].sort())
    expect(new Set(parts.flatMap((part) => part.names)).size).toBe(corpus.length)
    const sizes = parts.map((part) => part.names.length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })
  it.each([
    ['--native', '--shard'],
    ['--native', '--shard', '0/8'],
    ['--native', '--shard', '9/8'],
    ['--native', '--smoke', '--build-only'],
    ['--smoke'],
    ['--native', '--smoke', '--web'],
  ])('rejects invalid selection %j before starting a build', (...args) => {
    expect(() => portableSelection(corpus, { args })).toThrow()
  })
  it('rejects unknown and overlapping filters rather than silently skipping coverage', () => {
    expect(() => portableSelection(corpus, { fixtures: 'not-a-fixture' })).toThrow(/Unknown/)
    expect(() => portableSelection(corpus, { fixtures: 'calendar,calendar' })).toThrow(/duplicates/)
    expect(() =>
      portableSelection(corpus, { fixtures: 'calendar', args: ['--native', '--smoke'] }),
    ).toThrow(/cannot be combined/)
    expect(portableSelection(corpus, { fixtures: 'calendar' }).scope).toBe('focused')
  })
})
