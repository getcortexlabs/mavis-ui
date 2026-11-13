import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler's template implementation has no local declaration file.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname
const compile = (name: string) =>
  readShared(join(portable, name)).then((files: Map<string, string>) =>
    compileProject(files, { root: 'Home' }),
  )
const neutral = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (key, item) =>
      key === 'path' && typeof item === 'string' && item.startsWith('shared/')
        ? undefined
        : item instanceof Map
          ? [...item]
          : item,
    ),
  )

describe('navigation scroll restoration', () => {
  it('generates the same host probe and route identity wiring from TSX and unchanged Vue', async () => {
    const tsx = await compile('scrollHistory')
    const vue = await compile('scrollHistoryVue')
    expect(neutral(vue.model)).toEqual(neutral(tsx.model))
    const generated = (files: Map<string, string>) =>
      [...files].map(([name, code]) => [name, code.split('\n').slice(1).join('\n')])
    expect(generated(vue.swift)).toEqual(generated(tsx.swift))
    expect(vue.direct).toEqual(['shared/Home.vue'])
    const controls = vue.swift.get('MavisControls.swift') as string
    expect(controls).toContain('.navigationDestination(for: MavisRouteVisit<Route>.self)')
    expect(controls).toContain(
      '.environment(\\.mavisScrollRestoration, navigator.scrollRestoration(for: entry))',
    )
    expect(controls).toContain('.background(MavisScrollRestorer(restoration: restoration))')
    expect(controls).not.toContain('.id(navigator.root)')
    expect(controls).toContain(
      'if reduceMotion || appReduceMotion { transaction.disablesAnimations = true }',
    )
  })
})
