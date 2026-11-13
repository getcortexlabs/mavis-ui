import { afterEach, describe, expect, it, vi } from 'vitest'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
// @ts-expect-error The creator ships native ESM without declarations.
import { projectFiles, scaffold, installProject } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships native ESM without declarations.
import * as pm from '../packages/create-mavis/src/package-manager.mjs'
const { checkPackageManager, detectPackageManager } = pm
// @ts-expect-error The creator ships native ESM without declarations.
import { wizard, nextSteps, prepareInstallation } from '../packages/create-mavis/src/ui.mjs'

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
      expect(output).toContain("pnpm was not found on this terminal's PATH")
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
    multiselect: answer,
    isCancel: (value: unknown) => value === 'CANCEL',
    note: vi.fn(),
    log: { message: vi.fn(), warn: vi.fn() },
  }
}

describe('creator wizard', () => {
  it('preserves explicit flags, revisits answers and clears hidden rendering choices', async () => {
    const io = scriptedUI([
      ['web'],
      'nuxt',
      'ssg',
      'BACK',
      'BACK',
      'BACK',
      ['native'],
      'directory',
      'midnight',
      'pnpm',
      false,
      'create',
    ])
    const answers = await wizard({ name: 'example' }, undefined, io)
    expect(answers).toMatchObject({
      name: 'example',
      targets: ['native'],
      example: 'directory',
      theme: 'midnight',
      packageManager: 'pnpm',
      install: false,
    })
    expect(answers.web).toBeUndefined()
    expect(answers.rendering).toBeUndefined()
    expect(io.messages).not.toContain('What is your project called?')
    expect(io.note).toHaveBeenCalledWith(
      expect.stringContaining('Search, details and editing'),
      'Your project',
    )
  })

  it('offers Tasks and Directory with Mac and keeps Vue examples without it', async () => {
    const examples: string[][] = []
    const choose = (value: string) => (prompt: Prompt) => {
      examples.push(prompt.options.map((option) => String(option.value)))
      return value
    }
    const io = scriptedUI([
      ['web', 'macos'],
      choose('tasks'),
      'mavis',
      'npm',
      false,
      'edit',
      // Without Mac the earlier answer no longer exists: the question starts from the default.
      ['web'],
      'vite',
      (prompt: Prompt) => {
        expect(prompt.initialValue).toBe('welcome')
        return choose('directory')(prompt)
      },
      'mavis',
      'npm',
      false,
      'create',
    ])
    const answers = await wizard({ name: 'example' }, undefined, io)
    expect(examples.map((values) => values.filter((value) => typeof value === 'string'))).toEqual(
      [
        ['welcome', 'directory', 'tasks'],
        ['welcome', 'directory'],
      ].map((values) => expect.arrayContaining(values)),
    )
    expect(examples[0]).toContain('directory')
    expect(examples[1]).not.toContain('tasks')
    expect(answers).toMatchObject({ targets: ['web'], example: 'directory' })
    expect(io.note).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('shared/Tasks.lite.tsx'),
      'Your project',
    )
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
      { name: 'example', target: 'web', web: 'vite', theme: 'mavis', example: 'welcome' },
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
        {
          name: 'example',
          target: 'web',
          web: 'vite',
          packageManager: 'npm',
          install: false,
          example: 'welcome',
        },
        undefined,
        io,
      ),
    ).toMatchObject({ theme: 'mavis' })
    expect(await wizard({}, undefined, scriptedUI(['CANCEL']))).toBeNull()
  })

  it('changes the example through the summary without losing an explicit manager', async () => {
    const io = scriptedUI(['directory', 'edit', 'welcome', 'create'])
    const result = await wizard(
      {
        name: 'example',
        target: 'both',
        web: 'vite',
        theme: 'mavis',
        packageManager: 'yarn',
        install: false,
      },
      undefined,
      io,
    )
    expect(result).toMatchObject({ example: 'welcome', packageManager: 'yarn' })
    expect(io.note).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Search, details and editing'),
      'Your project',
    )
    expect(io.note).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('Basic project'),
      'Your project',
    )
  })
})

describe('package manager recovery', () => {
  const options = {
    name: 'my-mavis-cli',
    target: 'both',
    web: 'vite',
    theme: 'mavis',
    example: 'directory',
    packageManager: 'pnpm',
    install: true,
  }
  const missing = { ok: false, detail: "pnpm was not found on this terminal's PATH." }

  it('keeps every project choice when installation is deferred', async () => {
    const io = scriptedUI(['skip'])
    const check = vi.fn().mockReturnValue(missing)
    const result = await prepareInstallation(options, undefined, io, check)
    expect(result).toEqual({ ...options, install: false })
    expect(options.install).toBe(true)
    expect(io.log.warn).toHaveBeenCalledWith(missing.detail)
    const plan = await projectFiles(result)
    expect(nextSteps(plan.preset)).toContain('pnpm run install:apps')
  })

  it('allows an explicit manager change and checks it before the final summary', async () => {
    const io = scriptedUI(['change', 'yarn', 'create'])
    const check = vi.fn((name: string) =>
      name === 'yarn' ? { ok: true, detail: '4.18.1' } : missing,
    )
    const result = await wizard(options, undefined, io, check)
    expect(result).toEqual({ ...options, packageManager: 'yarn' })
    expect(check.mock.calls.map(([name]) => name)).toEqual(['pnpm', 'yarn'])
    expect(io.note).toHaveBeenCalledWith(
      expect.stringContaining('yarn · install now'),
      'Your project',
    )
    expect(io.messages.indexOf('How would you like to continue?')).toBeLessThan(
      io.messages.indexOf('Ready to create?'),
    )
    expect(io.messages).not.toContain('What is your project called?')
    const plan = await projectFiles(result)
    expect(JSON.parse(plan.files.get('package.json')).scripts['dev:web']).toBe(
      'yarn --cwd apps/web run dev',
    )
  })

  it('rechecks a command without restarting the wizard', async () => {
    const io = scriptedUI(['retry'])
    const check = vi
      .fn()
      .mockReturnValueOnce(missing)
      .mockReturnValue({ ok: true, detail: '12.16.1' })
    expect(await prepareInstallation(options, undefined, io, check)).toEqual(options)
    expect(check).toHaveBeenCalledTimes(2)
  })

  it('can return from the manager menu or cancel recovery', async () => {
    const check = vi.fn().mockReturnValue(missing)
    expect(
      await prepareInstallation(options, undefined, scriptedUI(['change', 'back', 'skip']), check),
    ).toEqual({ ...options, install: false })
    expect(await prepareInstallation(options, undefined, scriptedUI(['cancel']), check)).toBeNull()
    expect(
      await prepareInstallation(options, undefined, scriptedUI(['change', 'CANCEL']), check),
    ).toBeNull()
  })

  it('does not check tools when installation was skipped', async () => {
    const check = vi.fn()
    expect(
      await prepareInstallation({ ...options, install: false }, undefined, scriptedUI([]), check),
    ).toEqual({ ...options, install: false })
    expect(check).not.toHaveBeenCalled()
  })

  it.skipIf(process.platform === 'win32')(
    'distinguishes a missing command, a failing command and an old version',
    async () => {
      const cwd = await temp()
      vi.stubEnv('PATH', cwd)
      expect(checkPackageManager('pnpm').detail).toContain("was not found on this terminal's PATH")
      await writeFile(
        join(cwd, 'pnpm'),
        `#!${process.execPath}\nconsole.error('Corepack: project manager mismatch'); process.exit(1)\n`,
        { mode: 0o755 },
      )
      expect(checkPackageManager('pnpm').detail).toContain('Corepack: project manager mismatch')
      expect(checkPackageManager('pnpm').detail).not.toContain('was not found')
      await writeFile(join(cwd, 'pnpm'), `#!${process.execPath}\nconsole.log('10.21.0')\n`)
      expect(checkPackageManager('pnpm')).toMatchObject({
        ok: false,
        detail: 'pnpm 10.26+ is required (found 10.21.0).',
      })
      await writeFile(join(cwd, 'pnpm'), `#!${process.execPath}\nconsole.log('12.16.1')\n`)
      expect(checkPackageManager('pnpm')).toMatchObject({ ok: true, detail: '12.16.1' })
    },
  )
})
