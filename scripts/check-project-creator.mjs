import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
const output = resolve(root, 'artifacts/creator', name)
mkdirSync(output, { recursive: true })
const temp = mkdtempSync(join(tmpdir(), 'mavis-creator-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env })
try {
  const packed = JSON.parse(execFileSync(npm, ['pack', '--json', '--pack-destination', temp], {
    cwd: join(root, 'packages/create-mavis'), encoding: 'utf8',
  }))[0]
  const tool = join(temp, 'tool')
  mkdirSync(tool)
  run(npm, ['install', '--prefix', tool, '--no-audit', '--no-fund', '--ignore-scripts', join(temp, packed.filename)], temp)
  const cli = join(tool, 'node_modules/@getcortexlabs/create-mavis/src/cli.mjs')
  run(process.execPath, [cli, 'consumer', ...cases[name], '--no-install', '--yes'], temp)
  const app = join(temp, 'consumer')
  const config = JSON.parse(readFileSync(join(app, 'mavis.config.json'), 'utf8'))
  run(npm, ['install', '--no-audit', '--no-fund'], app)
  const web = config.target === 'both' ? join(app, 'apps/web') : app
  const native = config.target === 'both' ? join(app, 'apps/mobile') : app
  if (config.target !== 'mobile') {
    run(npm, ['run', 'build'], web)
    if (config.web === 'nuxt') {
      run(npm, ['run', 'typecheck'], web)
      run(npm, ['run', 'generate'], web)
    }
  }
  if (config.target !== 'web') {
    if (config.target === 'both') run(npm, ['install', '--no-audit', '--no-fund'], native)
    run(npm, ['run', 'bundle:android'], native)
    run(npm, ['run', 'bundle:ios'], native)
  }
  writeFileSync(join(output, 'result.json'), JSON.stringify({ case: name, config, packed: packed.filename, passed: true }, null, 2))
  console.log(`Packed creator: ${name} passed.`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
