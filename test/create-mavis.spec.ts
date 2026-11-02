import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// The creator is a Node CLI; it intentionally ships native ESM without a build step.
// @ts-expect-error JavaScript CLI tested through its public functions.
import { projectFiles, scaffold } from '../packages/create-mavis/src/scaffold.mjs'

describe('project creator', () => {
  it('plans deterministic platform-specific projects using only published dependencies', async () => {
    for (const options of [
      { name: 'web', target: 'web' },
      { name: 'mobile', target: 'mobile' },
      { name: 'server', target: 'web', web: 'nuxt' },
      { name: 'static', target: 'web', web: 'nuxt', rendering: 'ssg' },
      { name: 'shared', target: 'both' },
      { name: 'shared-server', target: 'both', web: 'nuxt' },
    ]) {
      const a = await projectFiles(options),
        b = await projectFiles(options)
      expect([...a.files]).toEqual([...b.files])
      for (const content of a.files.values())
        expect(content).not.toMatch(/\{\{(?:NAME|SHARED|APPEARANCE|APPID)\}\}/)
      const manifests = [...a.files]
        .filter(([name]: [string, string]) => name.endsWith('package.json'))
        .map(([, content]: [string, string]) => JSON.parse(content))
      expect(
        manifests.some(
          (pkg: { dependencies?: Record<string, string> }) =>
            pkg.dependencies?.['@getcortexlabs/mavis-core'] === '0.1.0-alpha.5',
        ),
      ).toBe(true)
      if (options.target === 'web')
        expect([...a.files.keys()].some((name: string) => name.includes('App_Resources'))).toBe(
          false,
        )
      if (options.target === 'both') expect(a.files.has('shared/Welcome.vue')).toBe(true)
    }
  })
  it('does not write during preview or overwrite directories/symlinks', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'mavis-cli-test-'))
    try {
      await scaffold({ name: 'preview', dryRun: true }, cwd)
      expect(await readdir(cwd)).toEqual([])
      const plan = await scaffold({ name: 'created' }, cwd)
      await writeFile(join(plan.destination, 'personal.txt'), 'Keep this file')
      await expect(scaffold({ name: 'created' }, cwd)).rejects.toThrow('already exists')
      expect(await readFile(join(plan.destination, 'personal.txt'), 'utf8')).toBe('Keep this file')
      await symlink(plan.destination, join(cwd, 'linked'))
      await expect(scaffold({ name: 'linked' }, cwd)).rejects.toThrow('already exists')
      await expect(scaffold({ name: '../escape' }, cwd)).rejects.toThrow('project name')
      expect((await readdir(cwd)).some((name) => name.startsWith('.mavis-create-'))).toBe(false)
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })
  it('explains unavailable framework/compiler combinations before writing', async () => {
    await expect(projectFiles({ name: 'future', framework: 'react' })).rejects.toThrow('#145')
    await expect(projectFiles({ name: 'future', authoring: 'jsx' })).rejects.toThrow('#167')
    await expect(projectFiles({ name: 'future', rendering: 'ssr' })).rejects.toThrow('Vite')
  })
})
