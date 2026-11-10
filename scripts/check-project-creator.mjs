import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const name = process.argv[2] ?? 'web-vite'
const managerIndex = process.argv.indexOf('--package-manager')
const manager = managerIndex < 0 ? 'npm' : process.argv[managerIndex + 1]
if (!['npm', 'pnpm', 'yarn'].includes(manager)) throw new Error('Unknown package manager')
const cases = {
  'web-vite': ['--target', 'web', '--web', 'vite'],
  'web-nuxt': ['--target', 'web', '--web', 'nuxt', '--rendering', 'ssg'],
  'both-vite': ['--target', 'both', '--web', 'vite'],
  'both-nuxt': ['--target', 'both', '--web', 'nuxt', '--rendering', 'ssr'],
  mobile: ['--target', 'mobile'],
}
if (!cases[name]) throw new Error(`Unknown creator check: ${name}`)
const exampleIndex = process.argv.indexOf('--example')
const example =
  exampleIndex < 0
    ? process.argv.includes('--directory')
      ? 'directory'
      : 'welcome'
    : process.argv[exampleIndex + 1]
if (!['welcome', 'directory'].includes(example)) throw new Error('Unknown example')
const adoption = process.argv.includes('--adopt')
const output = resolve(
  root,
  'artifacts/creator',
  `${name}-${example}-${manager}${adoption ? '-adopt' : ''}`,
)
mkdirSync(output, { recursive: true })
const temp = mkdtempSync(join(tmpdir(), 'mavis-creator-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env })
try {
  const packed = JSON.parse(
    execFileSync(npm, ['pack', '--json', '--pack-destination', temp], {
      cwd: join(root, 'packages/create-mavis'),
      encoding: 'utf8',
    }),
  )[0]
  const tool = join(temp, 'tool')
  mkdirSync(tool)
  run(
    npm,
    [
      'install',
      '--prefix',
      tool,
      '--no-audit',
      '--no-fund',
      '--ignore-scripts',
      join(temp, packed.filename),
    ],
    temp,
  )
  const cli = join(tool, 'node_modules/@getcortexlabs/create-mavis/src/cli.mjs')
  run(
    process.execPath,
    [
      cli,
      'consumer',
      ...cases[name],
      '--package-manager',
      manager,
      '--example',
      example,
      '--no-install',
      '--yes',
    ],
    temp,
  )
  const app = join(temp, 'consumer')
  // Schema 2 records targets; the checks below use the creator's layout name for them.
  const { normalizeConfig } = await import(
    pathToFileURL(join(root, 'packages/create-mavis/src/presets.mjs'))
  )
  const config = normalizeConfig(JSON.parse(readFileSync(join(app, 'mavis.config.json'), 'utf8')))
  let web = config.target === 'both' ? join(app, 'apps/web') : app
  let native = config.target === 'both' ? join(app, 'apps/mobile') : app
  if (adoption) {
    if (config.target === 'both') throw new Error('Adoption needs a standalone source host')
    const source = config.target
    const screen = `${config.web === 'nuxt' ? 'app' : 'src'}/shared/Portable.vue`
    writeFileSync(
      join(app, screen),
      `<script setup lang="ts">
import { ref } from 'vue'
import { useMavisPlatform } from '@getcortexlabs/mavis-core/vue'
const count = ref(0)
const { platform } = useMavisPlatform()
</script>
<template><MScreen><MColumn padding="lg"><MText>{{ platform }}: {{ count }}</MText><MButton text="Increment" @click="count++" /></MColumn></MScreen></template>
`,
    )
    // Check the auditor walks a .ts import containing valid non-TSX syntax.
    writeFileSync(join(app, 'identity.ts'), 'export const identity = <T>(value: T) => value\n')
    run(process.execPath, [cli, '--check-portability', '--path', 'identity.ts'], app)
    const original = readFileSync(join(app, screen), 'utf8')
    run(
      process.execPath,
      [
        cli,
        source === 'web' ? '--add-native' : '--add-web',
        ...(source === 'mobile' ? ['--web', 'nuxt'] : []),
        '--screen',
        screen,
        '--yes',
        '--no-install',
      ],
      app,
    )
    if (readFileSync(join(app, screen), 'utf8') !== original)
      throw new Error('Existing screen changed')
    if (source === 'web') native = join(app, 'apps/mobile')
    else web = join(app, 'apps/web')
    config.target = 'both'
    config.targets = ['web', 'native']
    if (source === 'mobile') config.web = 'nuxt'
  }
  if (process.argv.includes('--local-packages')) {
    // Local renderer packages need the source baseline; published templates keep their own pins.
    const jolt = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies[
      '@rafaelaugusto/jolt'
    ]
    const manifest = JSON.parse(
      readFileSync(join(root, 'artifacts/release/packages/manifest.json'), 'utf8'),
    )
    const hosts = [...new Set(config.target === 'both' ? [app, web, native] : [app])]
    for (const host of hosts) {
      const filename = join(host, 'package.json')
      const pkg = JSON.parse(readFileSync(filename, 'utf8'))
      if (pkg.dependencies?.['@rafaelaugusto/jolt']) pkg.dependencies['@rafaelaugusto/jolt'] = jolt
      for (const entry of manifest) {
        if (!pkg.dependencies?.[entry.name]) continue
        if (pkg.dependencies[entry.name] !== entry.version)
          throw new Error(`Creator version mismatch: ${entry.name}`)
        pkg.dependencies[entry.name] =
          `file:${join(root, 'artifacts/release/packages', entry.filename)}`
      }
      if (adoption || host === app || host === native) {
        // Renderer tarballs also depend on core. Resolve that edge from this build,
        // otherwise Yarn/pnpm install a second core from the registry.
        const overrides = Object.fromEntries(
          manifest.map((entry) => [
            `${entry.name}@${manager === 'yarn' ? 'npm:' : ''}${entry.version}`,
            `file:${join(root, 'artifacts/release/packages', entry.filename)}`,
          ]),
        )
        if (manager === 'yarn') pkg.resolutions = { ...pkg.resolutions, ...overrides }
        if (manager === 'pnpm')
          appendFileSync(
            join(host, 'pnpm-workspace.yaml'),
            `overrides: ${JSON.stringify(overrides)}\n`,
          )
      }
      writeFileSync(filename, JSON.stringify(pkg, null, 2) + '\n')
    }
  }
  run(process.execPath, [cli, '--check-portability'], app)
  const { installProject } = await import(
    pathToFileURL(join(tool, 'node_modules/@getcortexlabs/create-mavis/src/scaffold.mjs'))
  )
  if (adoption) {
    const { runInstall } = await import(
      pathToFileURL(join(tool, 'node_modules/@getcortexlabs/create-mavis/src/package-manager.mjs'))
    )
    for (const host of new Set([web, native])) await runInstall(manager, host)
  } else await installProject({ destination: app, preset: config })
  const runner = process.platform === 'win32' ? `${manager}.cmd` : manager
  if (config.target !== 'mobile') {
    const host = createRequire(join(web, 'package.json'))
    const vue = createRequire(host.resolve('vue'))
    const core = createRequire(host.resolve('@getcortexlabs/mavis-core/vue'))
    // The render context and effect scope must be shared. @vue/shared contains
    // stateless helpers and may also be installed by Nuxt's build-time tooling.
    for (const id of ['@vue/runtime-core', '@vue/reactivity']) {
      assert.equal(realpathSync(core.resolve(id)), realpathSync(vue.resolve(id)), id)
    }
    run(runner, ['run', 'build'], web)
    if (config.web === 'nuxt') {
      run(runner, ['run', 'typecheck'], web)
      if (process.argv.includes('--keep'))
        cpSync(join(web, '.output'), join(web, '.output-ssr'), { recursive: true })
      run(runner, ['run', 'generate'], web)
    }
  }
  if (config.target !== 'mobile' && existsSync(join(web, 'node_modules/@nativescript/core')))
    throw new Error('NativeScript leaked into the Web dependency tree.')
  if (config.target !== 'web') {
    run(runner, ['run', 'typecheck'], native)
    run(runner, ['run', 'bundle:android'], native)
    run(runner, ['run', 'bundle:ios'], native)
  }
  writeFileSync(
    join(output, 'result.json'),
    JSON.stringify(
      {
        case: name,
        adoption,
        example,
        manager,
        config,
        packed: packed.filename,
        passed: true,
        directory: app,
        web,
        native,
      },
      null,
      2,
    ),
  )
  console.log(`Packed creator: ${name} / ${example} / ${manager} passed.`)
} finally {
  if (!process.argv.includes('--keep')) rmSync(temp, { recursive: true, force: true })
  else console.log(`Preserved creator project: ${temp}`)
}
