import { describe, expect, it } from 'vitest'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler is JavaScript.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname
const unqualifiedConcurrency = /(?<![\w.])Task(?:<|\.(?:isCancelled|sleep|yield)|\s+\{)/
const concurrencyLines = (text: string) =>
  text.split('\n').filter((line) => !/^\s*struct Task\b/.test(line) && !/: Task \{$/.test(line))

describe('Swift concurrency names alongside user records', () => {
  it('preserves the Tasks starter model without shadowing runtime concurrency', async () => {
    const { files } = await projectFiles({
      name: 'task-names',
      targets: 'web,macos',
      example: 'tasks',
    })
    const shared = new Map<string, string>(
      [...files].filter(([path]: [string, string]) => path.startsWith('shared/')),
    )
    const output = await compileProject(shared, { root: 'Tasks' })
    expect(output.swift.get('MavisTypes.swift')).toContain('struct Task:')
    expect(output.swift.get('Tasks.swift')).toContain('[Task]')
    const controls = output.swift.get('MavisControls.swift')!
    expect(controls).toContain('_Concurrency.Task<Void, Never>')
    expect(controls).toContain('_Concurrency.Task.isCancelled')
    for (const [path, source] of output.swift)
      expect(
        concurrencyLines(source).filter((line) => unqualifiedConcurrency.test(line)),
        path,
      ).toEqual([])
  })

  it.each(['waitingVue', 'lifetimeVue', 'fileUploadVue'])(
    'qualifies concurrency created by actions, effects and resource ownership in %s',
    async (fixture) => {
      const files = await readShared(`${portable}/${fixture}`)
      const roots = { waitingVue: 'Waiting', lifetimeVue: 'Lifetime', fileUploadVue: 'Uploads' }
      const output = await compileProject(files, { root: roots[fixture as keyof typeof roots] })
      for (const [path, source] of output.swift)
        expect(
          concurrencyLines(source).filter((line) => unqualifiedConcurrency.test(line)),
          path,
        ).toEqual([])
    },
  )
})
