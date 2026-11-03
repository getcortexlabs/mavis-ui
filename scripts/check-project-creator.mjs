import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
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
const output = resolve(root, 'artifacts/creator', `${name}-${manager}`)
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
    [cli, 'consumer', ...cases[name], '--package-manager', manager, '--no-install', '--yes'],
    temp,
  )
  const app = join(temp, 'consumer')
  const config = JSON.parse(readFileSync(join(app, 'mavis.config.json'), 'utf8'))
  if (process.argv.includes('--local-packages')) {
    // Local renderer packages need the source baseline; published templates keep their own pins.
    const jolt = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies[
      '@rafaelaugusto/jolt'
    ]
    const manifest = JSON.parse(
      readFileSync(join(root, 'artifacts/release/packages/manifest.json'), 'utf8'),
    )
    const hosts =
      config.target === 'both' ? [app, join(app, 'apps/web'), join(app, 'apps/mobile')] : [app]
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
      if (host === app || host === join(app, 'apps/mobile')) {
        // Renderer tarballs also depend on core. Resolve that edge from this build,
        // otherwise Yarn/pnpm install a second core from the registry.
        const overrides = Object.fromEntries(
          manifest.map((entry) => [
            `${entry.name}@${manager === 'yarn' ? 'npm:' : ''}${entry.version}`,
            `file:${join(root, 'artifacts/release/packages', entry.filename)}`,
          ]),
        )
        if (manager === 'yarn') pkg.resolutions = overrides
        if (manager === 'pnpm')
          appendFileSync(
            join(host, 'pnpm-workspace.yaml'),
            `overrides: ${JSON.stringify(overrides)}\n`,
          )
      }
      writeFileSync(filename, JSON.stringify(pkg, null, 2) + '\n')
    }
  }
  const { installProject } = await import(
    pathToFileURL(join(tool, 'node_modules/@getcortexlabs/create-mavis/src/scaffold.mjs'))
  )
  await installProject({ destination: app, preset: config })
  const runner = process.platform === 'win32' ? `${manager}.cmd` : manager
  const web = config.target === 'both' ? join(app, 'apps/web') : app
  const native = config.target === 'both' ? join(app, 'apps/mobile') : app
  if (config.target !== 'mobile') {
    run(runner, ['run', 'build'], web)
    if (config.web === 'nuxt') {
      run(runner, ['run', 'typecheck'], web)
      run(runner, ['run', 'generate'], web)
    }
  }
  if (config.target !== 'web') {
    run(runner, ['run', 'bundle:android'], native)
    run(runner, ['run', 'bundle:ios'], native)
  }
  writeFileSync(
    join(output, 'result.json'),
    JSON.stringify({ case: name, manager, config, packed: packed.filename, passed: true }, null, 2),
  )
  console.log(`Packed creator: ${name} / ${manager} passed.`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
