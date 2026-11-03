import { afterEach, describe, expect, it, vi } from 'vitest'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
// @ts-expect-error The creator ships native ESM without declarations.
import { projectFiles, scaffold, installProject } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships native ESM without declarations.
import { detectPackageManager } from '../packages/create-mavis/src/package-manager.mjs'
// @ts-expect-error The creator ships native ESM without declarations.
import { wizard, nextSteps } from '../packages/create-mavis/src/ui.mjs'

const cli = resolve('packages/create-mavis/src/cli.mjs')
const temporary: string[] = []
async function temp() {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'mavis-cli-')))
  temporary.push(cwd)
  return cwd
}
afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(temporary.splice(0).map((cwd) => rm(cwd, { recursive: true, force: true })))
})
const run = (cwd: string, args: string[], env: NodeJS.ProcessEnv = {}) =>
  execFileSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', CI: 'true', ...env },
  })

describe('creator package managers', () => {
  it.each(['npm', 'pnpm', 'yarn'])(
    'generates consistent %s commands for every target',
    async (packageManager) => {
      for (const target of ['web', 'mobile', 'both']) {
        for (const web of target === 'mobile' ? ['vite'] : ['vite', 'nuxt']) {
          const plan = await projectFiles({ name: 'example', target, web, packageManager })
          const readme = plan.files.get('README.md')
          expect(plan.preset.packageManager).toBe(packageManager)
          expect(readme).toContain(
            `${packageManager} ${target === 'both' && packageManager !== 'yarn' ? 'run install:apps' : 'install'}`,
          )
          expect(nextSteps(plan.preset)).toContain(
            `${packageManager} run ${target === 'mobile' ? 'ios' : target === 'both' ? 'dev:web' : 'dev'}`,
          )
          expect(nextSteps(plan.preset, true)).not.toContain('install')
          if (packageManager !== 'npm') expect(readme).not.toMatch(/(?<!p)npm (?:run|install)/)
          if (target === 'both') {
            const pkg = JSON.parse(plan.files.get('package.json'))
            for (const script of Object.values(pkg.scripts))
              expect(script).toMatch(new RegExp(`^${packageManager} `))
            if (packageManager === 'pnpm') {
              expect(pkg.workspaces).toBeUndefined()
              expect(plan.files.get('pnpm-workspace.yaml')).toContain('- apps/web')
              expect(plan.files.get('pnpm-workspace.yaml')).toContain('nodeLinker: hoisted')
              expect(plan.files.get('pnpm-workspace.yaml')).not.toContain('- apps/mobile')
              expect(plan.files.get('apps/mobile/pnpm-workspace.yaml')).toContain(
                'nodeLinker: hoisted',
              )
            } else expect(pkg.workspaces).toEqual(['apps/web'])
            if (packageManager === 'yarn') {
              expect(plan.files.get('apps/mobile/yarn.lock')).toBe('')
              expect(
                JSON.parse(plan.files.get('apps/mobile/package.json')).dependenciesMeta[
                  '@nativescript/core'
                ],
              ).toEqual({ built: true })
              expect(
                JSON.parse(plan.files.get('apps/mobile/package.json')).dependenciesMeta[
                  'core-js-pure'
                ],
              ).toEqual({ built: false })
              expect(plan.files.get('.yarnrc.yml')).toContain('nodeLinker: node-modules')
            }
          }
        }
      }
    },
  )

  it('detects the launcher and lets an explicit manager override it', async () => {
    expect(detectPackageManager('pnpm/12.16.1 npm/? node/v22')).toBe('pnpm')
    expect(detectPackageManager('yarn/4.18.1 npm/?')).toBe('yarn')
    expect(detectPackageManager('bun/1.0')).toBe('npm')
    const cwd = await temp()
    const output = run(cwd, ['detected', '--yes'], { npm_config_user_agent: 'pnpm/12.16.1' })
    expect(output).toContain('pnpm install')
    expect(output).not.toContain('\x1b[')
    expect(output).not.toContain('src/env.d.ts')
    run(cwd, ['explicit', '--yes', '--package-manager', 'yarn'], {
      npm_config_user_agent: 'pnpm/12.16.1',
    })
    expect(
      JSON.parse(await readFile(join(cwd, 'explicit/mavis.config.json'), 'utf8')).packageManager,
    ).toBe('yarn')
  })

  it('previews without writing, and rejects unsupported options before writing', async () => {
    const cwd = await temp()
    expect(run(cwd, ['preview', '--dry-run', '--package-manager', 'pnpm'])).toContain(
      'pnpm-workspace.yaml',
    )
    expect(await readdir(cwd)).toEqual([])
    expect(() => run(cwd, ['invalid', '--yes', '--package-manager', 'bun'])).toThrow()
    expect(() => run(cwd, ['invalid', '--yes', '--install', '--no-install'])).toThrow()
    expect(await readdir(cwd)).toEqual([])
  })

  it.skipIf(process.platform === 'win32')(
    'uses the selected installer in both roots and preserves files on failure',
    async () => {
      const cwd = await temp()
      const bin = join(cwd, 'bin')
      await mkdir(bin)
      await writeFile(
        join(bin, 'pnpm'),
        `#!${process.execPath}\nconst fs=require('node:fs'); fs.appendFileSync(process.env.MAVIS_INSTALL_LOG, process.cwd()+'\\n'); process.exit(process.cwd().endsWith('mobile') ? 7 : 0)\n`,
        { mode: 0o755 },
      )
      vi.stubEnv('PATH', `${bin}${delimiter}${process.env.PATH}`)
      vi.stubEnv('MAVIS_INSTALL_LOG', join(cwd, 'installs.txt'))
      const plan = await scaffold({ name: 'shared', target: 'both', packageManager: 'pnpm' }, cwd)
      await expect(installProject(plan)).rejects.toThrow('Project files were preserved')
      expect((await readFile(join(cwd, 'installs.txt'), 'utf8')).trim().split('\n')).toEqual([
        plan.destination,
        join(plan.destination, 'apps/mobile'),
      ])
      expect(await readFile(join(plan.destination, 'shared/Welcome.vue'), 'utf8')).toContain(
        '<m-button',
      )
    },
  )

  it.skipIf(process.platform === 'win32')(
    'cancels an active install and never starts the second host',
    async () => {
      const cwd = await temp()
      const bin = join(cwd, 'bin')
      await mkdir(bin)
      await writeFile(
        join(bin, 'yarn'),
        `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.MAVIS_INSTALL_LOG, process.cwd()); setInterval(()=>{}, 1000)\n`,
        { mode: 0o755 },
      )
      vi.stubEnv('PATH', `${bin}${delimiter}${process.env.PATH}`)
      vi.stubEnv('MAVIS_INSTALL_LOG', join(cwd, 'install.txt'))
      const plan = await scaffold({ name: 'shared', target: 'both', packageManager: 'yarn' }, cwd)
      const controller = new AbortController()
      const installed = installProject(plan, { signal: controller.signal })
      const result = installed.catch((error: Error) => error)
      try {
        await vi.waitFor(async () =>
          expect(await readFile(join(cwd, 'install.txt'), 'utf8')).toBe(plan.destination),
        )
      } finally {
        controller.abort()
      }
      expect(await result).toBeInstanceOf(Error)
      expect(await readFile(join(cwd, 'install.txt'), 'utf8')).toBe(plan.destination)
    },
  )

  it.skipIf(process.platform === 'win32')(
    'reports a missing manager before creating a destination',
    async () => {
      const cwd = await temp()
      const child = spawn(
        process.execPath,
        [cli, 'missing', '--yes', '--install', '--package-manager', 'pnpm'],
        { cwd, env: { ...process.env, PATH: cwd, CI: 'true' } },
      )
      let output = ''
      child.stderr.on('data', (chunk) => {
        output += chunk
      })
      expect(await new Promise((resolve) => child.on('close', resolve))).toBe(1)
      expect(output).toContain('pnpm is not available')
      expect(await readdir(cwd)).toEqual([])
    },
  )
})

type Prompt = {
  message: string
  options: { value: unknown; label: string }[]
  initialValue?: unknown
}
function scriptedUI(responses: Array<unknown | ((prompt: Prompt) => unknown)>) {
  const messages: string[] = []
  const answer = async (prompt: Prompt) => {
    messages.push(prompt.message)
    const next = responses.shift()
    if (typeof next === 'function') return next(prompt)
    if (next === undefined) throw new Error(`Unexpected prompt: ${prompt.message}`)
    return next === 'BACK'
      ? prompt.options.find((option) => option.label === '← Back')?.value
      : next
  }
  return {
    messages,
    text: answer,
    select: answer,
    isCancel: (value: unknown) => value === 'CANCEL',
    note: vi.fn(),
    log: { message: vi.fn() },
  }
}

describe('creator wizard', () => {
  it('preserves explicit flags, revisits answers and clears hidden rendering choices', async () => {
    const io = scriptedUI([
      'web',
      'nuxt',
      'ssg',
      'BACK',
      'BACK',
      'BACK',
      'mobile',
      'midnight',
      'pnpm',
      false,
      'create',
    ])
    const answers = await wizard({ name: 'example' }, undefined, io)
    expect(answers).toMatchObject({
      name: 'example',
      target: 'mobile',
      theme: 'midnight',
      packageManager: 'pnpm',
      install: false,
    })
    expect(answers.web).toBeUndefined()
    expect(answers.rendering).toBeUndefined()
    expect(io.messages).not.toContain('What is your project called?')
  })

  it('preselects the launching manager but allows a different selection', async () => {
    vi.stubEnv('npm_config_user_agent', 'yarn/4.18.1')
    const io = scriptedUI([
      (prompt: Prompt) => {
        expect(prompt.initialValue).toBe('yarn')
        return 'pnpm'
      },
      false,
      'create',
    ])
    const answers = await wizard(
      { name: 'example', target: 'web', web: 'vite', theme: 'mavis' },
      undefined,
      io,
    )
    expect(answers.packageManager).toBe('pnpm')
    expect(io.messages).toContain('Install dependencies with pnpm?')
  })

  it('can edit the summary or cancel without creating a project', async () => {
    const io = scriptedUI(['midnight', 'edit', 'mavis', 'create'])
    expect(
      await wizard(
        { name: 'example', target: 'web', web: 'vite', packageManager: 'npm', install: false },
        undefined,
        io,
      ),
    ).toMatchObject({ theme: 'mavis' })
    expect(await wizard({}, undefined, scriptedUI(['CANCEL']))).toBeNull()
  })
})
