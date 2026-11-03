import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const name = process.argv[2] ?? 'web-vite'
const cases = {
  'web-vite': ['--target', 'web', '--web', 'vite'],
  'web-nuxt': ['--target', 'web', '--web', 'nuxt', '--rendering', 'ssg'],
  'both-vite': ['--target', 'both', '--web', 'vite'],
  'both-nuxt': ['--target', 'both', '--web', 'nuxt', '--rendering', 'ssr'],
  mobile: ['--target', 'mobile'],
}
if (!cases[name]) throw new Error(`Unknown creator check: ${name}`)
const example = process.argv.includes('--directory') ? 'directory' : 'welcome'
const output = resolve(root, 'artifacts/creator', `${name}-${example}`)
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
  run(process.execPath, [cli, 'consumer', ...cases[name], '--example', example, '--no-install', '--yes'], temp)
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
      writeFileSync(filename, JSON.stringify(pkg, null, 2) + '\n')
    }
  }
  run(process.execPath, [cli, '--check-portability'], app)
  run(npm, ['install', '--no-audit', '--no-fund'], app)
  const web = config.target === 'both' ? join(app, 'apps/web') : app
  const native = config.target === 'both' ? join(app, 'apps/mobile') : app
  if (config.target !== 'mobile') {
    run(npm, ['run', 'build'], web)
    if (config.web === 'nuxt') {
      run(npm, ['run', 'typecheck'], web)
      if (process.argv.includes('--keep')) cpSync(join(web, '.output'), join(web, '.output-ssr'), { recursive: true })
      run(npm, ['run', 'generate'], web)
    }
  }
  if (config.target !== 'mobile' && existsSync(join(app, 'node_modules/@nativescript/core'))) throw new Error('NativeScript leaked into the Web dependency tree.')
  if (config.target !== 'web') {
    if (config.target === 'both') run(npm, ['install', '--no-audit', '--no-fund'], native)
    run(npm, ['run', 'typecheck'], native)
    run(npm, ['run', 'bundle:android'], native)
    run(npm, ['run', 'bundle:ios'], native)
  }
  writeFileSync(
    join(output, 'result.json'),
    JSON.stringify({ case: name, example, config, packed: packed.filename, passed: true, directory: app, web, native }, null, 2),
  )
  console.log(`Packed creator: ${name} passed.`)
} finally {
  if (!process.argv.includes('--keep')) rmSync(temp, { recursive: true, force: true })
  else console.log(`Preserved creator project: ${temp}`)
}
