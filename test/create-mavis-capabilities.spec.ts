import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { targetCapabilities } from '../packages/core/src/capabilities.js'
// @ts-expect-error The creator ships native ESM.
import { adapters } from '../packages/create-mavis/src/adapters.mjs'
import {
  ProjectError,
  availabilityOf,
  catalog,
  checkProject,
  combinations,
  configOf,
  describeCapabilities,
  formatCapabilities,
  migrateConfig,
  normalizeConfig,
  recommendation,
  requirements,
  resolvePreset,
  schemaVersion,
  versions,
  // @ts-expect-error The creator ships native ESM.
} from '../packages/create-mavis/src/capabilities.mjs'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error A repository script, native ESM.
import { creatorAdapters } from '../scripts/sync-creator-adapters.mjs'

const cli = new URL('../packages/create-mavis/src/cli.mjs', import.meta.url).pathname
const problem = (options: Record<string, unknown>) => {
  const result = checkProject({ name: 'app', ...options })
  expect(result.ok).toBe(false)
  return result as { ok: false; problem: Record<string, any>; message: string }
}

describe('creator capabilities', () => {
  it('takes frameworks and hosts that are not built yet from Mavis core', () => {
    expect(adapters).toEqual(creatorAdapters(targetCapabilities))
    const issue = (id: string) => targetCapabilities.planned.find((entry) => entry.id === id)!.issue
    expect(catalog.frameworks.react).toMatchObject({ status: 'planned', issue: issue('react-web') })
    expect(catalog.hosts.next).toMatchObject({ status: 'planned', issue: issue('next') })
    // Every target a project can have is rendered by an adapter core knows, or generated.
    for (const target of Object.values<{ adapter: string | null }>(catalog.targets))
      if (target.adapter)
        expect(adapters.available.map((adapter: { id: string }) => adapter.id)).toContain(
          target.adapter,
        )
  })

  it('resolves every declared combination without changing a choice', () => {
    for (const combination of combinations) {
      const hasWeb = combination.targets.includes('web')
      const vue = combination.authoring === 'vue'
      const hosts = hasWeb && vue ? ['vite', 'nuxt'] : [hasWeb ? 'vite' : undefined]
      for (const web of hosts)
        for (const rendering of web ? catalog.hosts[web as 'vite'].rendering : [undefined])
          for (const [example, entry] of Object.entries<{ authoring: string[] }>(
            catalog.examples,
          )) {
            if (!entry.authoring.includes(combination.authoring)) continue
            const preset = resolvePreset({
              name: 'app',
              targets: combination.targets,
              web,
              rendering,
              example,
              theme: 'midnight',
              packageManager: 'pnpm',
            })
            expect(preset).toMatchObject({
              schemaVersion,
              targets: combination.targets,
              framework: 'vue',
              authoring: combination.authoring,
              mode: vue ? 'direct' : 'portable',
              execution: vue ? 'components' : 'generated',
              example,
              web: hasWeb ? web : null,
              rendering: hasWeb ? rendering : null,
              theme: 'midnight',
              packageManager: 'pnpm',
            })
            expect(Object.keys(preset.apps)).toEqual(combination.targets)
            if (hasWeb)
              expect(preset.apps.web).toEqual({
                toolkit: 'mavis-web',
                framework: 'vue',
                host: web,
                rendering,
              })
            expect(preset.availability).toBe(
              availabilityOf({ targets: combination.targets, example }),
            )
          }
    }
  })

  it('tells validated combinations from the ones published as experiments', () => {
    expect(availabilityOf({ targets: ['web'], example: 'directory' })).toBe('published')
    expect(availabilityOf({ targets: ['web', 'native'], example: 'welcome' })).toBe('published')
    for (const targets of [
      ['macos'],
      ['web', 'macos'],
      ['native', 'macos'],
      ['web', 'native', 'macos'],
    ])
      for (const example of ['welcome', 'tasks'])
        expect(availabilityOf({ targets, example })).toBe('published-experimental')
    // Everything in the catalog carries the version it shipped in.
    expect(combinations.every((entry: { since: string | null }) => entry.since !== null)).toBe(true)
  })

  it('pins exact versions and declares the tools a project needs', async () => {
    const exact = /^\d+\.\d+\.\d+(-[a-z]+(\.\d+)*)?$/
    for (const [name, version] of Object.entries(versions)) expect(version, name).toMatch(exact)
    expect(requirements).toMatchObject({ node: '22.16', packageManagers: { pnpm: '10.26' } })
    // Generated manifests carry those pins, never a range or a tag.
    for (const combination of combinations) {
      const { files } = await projectFiles({ name: 'pins', targets: combination.targets })
      for (const [path, text] of files as Map<string, string>) {
        if (!path.endsWith('package.json')) continue
        const manifest = JSON.parse(text)
        for (const [name, version] of Object.entries({
          ...manifest.dependencies,
          ...manifest.devDependencies,
        }))
          expect(String(version), `${path} ${name}`).toMatch(exact)
        expect(manifest.engines.node).toBe(`>=${requirements.node}`)
      }
    }
  })

  it('explains what is planned with its issue and what is available instead', () => {
    const react = problem({ framework: 'react' })
    expect(react.problem).toMatchObject({ code: 'planned', option: '--framework', issue: 145 })
    expect(react.problem.alternatives).toEqual(['--framework vue'])
    expect(react.message).toContain('https://github.com/getcortexlabs/mavis-ui/issues/145')

    const next = problem({ web: 'next' })
    expect(next.problem).toMatchObject({ code: 'planned', option: '--web', issue: 159 })
    expect(next.problem.alternatives).toEqual(['--web vite', '--web nuxt'])

    // React-style JSX compiled for Vue: its compiler does not exist yet.
    const jsx = problem({ authoring: 'jsx' })
    expect(jsx.problem).toMatchObject({ code: 'planned', option: '--authoring', issue: 167 })
    expect(jsx.problem.alternatives).toEqual(['--authoring vue'])

    expect(problem({ framework: 'ember' }).problem).toMatchObject({ code: 'unknown' })
    expect(problem({ web: 'astro' }).problem).toMatchObject({ code: 'unknown', option: '--web' })
  })

  it('rejects choices that do not fit together, with alternatives', () => {
    const nuxtMac = problem({ targets: 'web,macos', web: 'nuxt' })
    expect(nuxtMac.problem).toMatchObject({ code: 'incompatible', option: '--web', issue: 157 })
    expect(nuxtMac.problem.alternatives).toEqual(['--web vite', '--targets web --web nuxt'])

    const rendering = problem({ targets: 'web', web: 'vite', rendering: 'ssr' })
    expect(rendering.problem).toMatchObject({ code: 'incompatible', option: '--rendering' })
    expect(rendering.problem.alternatives).toEqual(['--rendering client'])
    expect(problem({ web: 'nuxt', rendering: 'client' }).problem.alternatives).toEqual([
      '--rendering ssr',
      '--rendering ssg',
    ])

    // A mobile-only project has no Web host to configure.
    const mobile = problem({ targets: 'native', web: 'nuxt' })
    expect(mobile.problem).toMatchObject({ code: 'incompatible', option: '--web' })
    expect(mobile.problem.alternatives).toEqual(['--targets web,native'])
    expect(problem({ targets: 'native', rendering: 'ssg' }).problem.option).toBe('--rendering')

    expect(problem({ targets: 'web', example: 'tasks' }).problem.alternatives).toContain(
      '--targets web,macos',
    )
    expect(problem({ targets: 'web,macos', example: 'directory' }).problem.alternatives).toEqual([
      '--example welcome',
      '--example tasks',
    ])
    expect(problem({ targets: 'web,macos', authoring: 'vue' }).problem.alternatives).toEqual([
      '--authoring mitosis',
      '--targets web',
    ])
    expect(problem({ target: 'both', targets: 'web' }).problem.code).toBe('conflict')
    expect(() => resolvePreset({ name: 'app', targets: 'web,windows' })).toThrow(ProjectError)
  })

  it('creates a mobile-only project with no Web tooling', async () => {
    const { preset, files } = await projectFiles({ name: 'pocket', targets: 'native' })
    expect(preset).toMatchObject({ web: null, rendering: null })
    expect(preset.apps).toEqual({
      native: { toolkit: 'nativescript', framework: 'vue', platforms: ['ios', 'android'] },
    })
    const manifests = [...(files as Map<string, string>)]
      .filter(([path]) => path.endsWith('package.json'))
      .map(([, text]) => JSON.parse(text))
    for (const manifest of manifests)
      for (const name of ['vite', 'nuxt', '@getcortexlabs/mavis-web', '@vitejs/plugin-vue'])
        expect({ ...manifest.dependencies, ...manifest.devDependencies }).not.toHaveProperty(name)
    expect(JSON.parse(files.get('mavis.config.json'))).toMatchObject({
      schemaVersion: 2,
      targets: ['native'],
      apps: { native: { toolkit: 'nativescript' } },
      mode: 'direct',
      execution: 'components',
      web: null,
    })
  })

  it('treats what a developer already knows as advice, never as the framework', () => {
    const preset = resolvePreset({ name: 'app', targets: 'web,native', familiar: 'react' })
    expect(preset).toMatchObject({ framework: 'vue', authoring: 'vue', familiar: 'react' })
    expect(configOf(preset)).toMatchObject({ familiar: 'react', framework: 'vue' })
    expect(configOf(preset)).not.toHaveProperty('availability')
    expect(configOf(preset)).not.toHaveProperty('target')
    expect(recommendation('react', ['web'])).toContain('#145')
    expect(recommendation('react', ['web', 'macos'])).toContain('shared TSX')
    expect(recommendation('svelte', ['web'])).toContain('#153')
    expect(recommendation('vue', ['web'])).toBeUndefined()
    expect(recommendation(undefined, ['web'])).toBeUndefined()
    expect(problem({ familiar: 'cobol' }).problem.option).toBe('--familiar')
  })

  it('migrates configurations written by earlier creators', () => {
    const first = {
      schemaVersion: 1,
      name: 'old',
      target: 'both',
      framework: 'vue',
      authoring: 'vue',
      example: 'directory',
      web: 'nuxt',
      rendering: 'ssg',
      theme: 'mavis',
      packageManager: 'yarn',
      portability: { roots: ['shared'] },
    }
    const migrated = migrateConfig(first)
    expect(migrated).toMatchObject({
      schemaVersion: 2,
      targets: ['web', 'native'],
      apps: {
        web: { toolkit: 'mavis-web', framework: 'vue', host: 'nuxt', rendering: 'ssg' },
        native: { toolkit: 'nativescript', framework: 'vue', platforms: ['ios', 'android'] },
      },
      mode: 'direct',
      execution: 'components',
      example: 'directory',
      packageManager: 'yarn',
      portability: { roots: ['shared'] },
    })
    expect(migrated).not.toHaveProperty('target')
    // Migrating again changes nothing, and the result still resolves.
    expect(migrateConfig(migrated)).toEqual(migrated)
    expect(checkProject({ ...migrated, name: 'old' }).ok).toBe(true)
    expect(normalizeConfig(first).target).toBe('both')

    // RC.12.2's Web + Mac starter, and schema 2 files from before apps were recorded.
    expect(
      migrateConfig({ schemaVersion: 1, target: 'macos', authoring: 'mitosis' }),
    ).toMatchObject({
      targets: ['web', 'macos'],
      apps: { web: { host: 'vite', rendering: 'client' }, macos: { toolkit: 'swiftui' } },
      mode: 'portable',
      execution: 'generated',
    })
    expect(
      migrateConfig({ schemaVersion: 2, targets: ['native', 'macos'], authoring: 'mitosis' }),
    ).toMatchObject({ apps: { native: {}, macos: {} }, web: null, mode: 'portable' })
    expect(() => migrateConfig({ schemaVersion: 3, targets: ['web'] })).toThrow('newer creator')
    expect(migrateConfig({ name: 'not-a-project' })).toEqual({ name: 'not-a-project' })
  })

  it('prints the same catalog for people and for tools', () => {
    const data = describeCapabilities()
    expect(data).toMatchObject({ catalogVersion: 1, schemaVersion: 2, creator: versions.mavis })
    expect(data.combinations).toHaveLength(7)
    expect(data.combinations.map((entry: { targets: string[] }) => entry.targets.join())).toEqual(
      combinations.map((entry: { targets: string[] }) => entry.targets.join()),
    )
    const mac = data.combinations.find(
      (entry: { targets: string[] }) => entry.targets.join() === 'web,macos',
    )!
    expect(mac).toMatchObject({ label: 'Web + Mac', hosts: ['vite'] })
    expect(mac.examples).toEqual([
      { id: 'welcome', availability: 'published-experimental' },
      { id: 'tasks', availability: 'published-experimental' },
    ])
    expect(data.planned.map((entry: { issue: number }) => entry.issue)).toContain(145)

    const text = formatCapabilities()
    expect(text).toContain('--targets web,native,macos')
    expect(text).toContain('--framework react')
    expect(text).toContain('https://github.com/getcortexlabs/mavis-ui/issues/159')
    expect(text).toContain(`Needs Node.js ${requirements.node}+`)

    const run = (...args: string[]) =>
      execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8' })
    expect(JSON.parse(run('--capabilities', '--json'))).toEqual(JSON.parse(JSON.stringify(data)))
    expect(run('--capabilities').trim()).toBe(text)
  })
})
