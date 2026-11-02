import { consumerJolt } from './consumer-jolt.mjs'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const directory = mkdtempSync(join(tmpdir(), 'mavis-nuxt-'))
cpSync('test/consumers/nuxt', directory, { recursive: true })
for (const file of ['AfterglowScene.vue', 'afterglow-motion.ts'])
  cpSync(`examples/catalog/shared/${file}`, join(directory, 'app/components', file))
mkdirSync(join(directory, 'app/components/locale'), { recursive: true })
for (const file of ['index.ts', 'messages.ts'])
  cpSync(`examples/catalog/shared/locale/${file}`, join(directory, 'app/components/locale', file))
cpSync('examples/catalog-web/src/HorizonsScene.vue', join(directory, 'app/components/HorizonsScene.vue'))
const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
pkg.dependencies['@rafaelaugusto/jolt'] = consumerJolt(pkg.dependencies['@rafaelaugusto/jolt'])
const manifest = JSON.parse(readFileSync('artifacts/release/packages/manifest.json', 'utf8'))
for (const entry of manifest.filter(({ name }) => name !== '@getcortexlabs/mavis')) {
  pkg.dependencies[entry.name] = `file:${resolve('artifacts/release/packages', entry.filename)}`
}
writeFileSync(join(directory, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
mkdirSync('artifacts/ssr', { recursive: true })
writeFileSync(
  'artifacts/ssr/nuxt.json',
  `${JSON.stringify({ directory, nuxt: pkg.dependencies.nuxt }, null, 2)}\n`,
)
for (const args of [
  ['install', '--no-audit', '--no-fund'],
  ['exec', 'nuxt', 'prepare'],
  ['run', 'typecheck'],
  ['run', 'build'],
]) {
  execFileSync('npm', args, {
    cwd: directory,
    stdio: 'inherit',
    env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
  })
}
console.log(`Nuxt consumer built: ${directory}`)

const lock = readFileSync(join(directory, 'package-lock.json'), 'utf8')
if (/node_modules\/(?:@nativescript\/|nativescript-vue|react-dom|react\/)/.test(lock))
  throw new Error('Nuxt consumer installed an unrelated renderer')
writeFileSync(
  join(directory, 'singleton.cjs'),
  `
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { realpathSync } = require('node:fs')
const web = createRequire(require.resolve('@getcortexlabs/mavis-web'))
const core = createRequire(require.resolve('@getcortexlabs/mavis-core/vue'))
for (const id of ['@vue/runtime-core', '@vue/reactivity', '@vue/shared']) {
  assert.equal(realpathSync(web.resolve(id)), realpathSync(require.resolve(id)), id)
  assert.equal(realpathSync(core.resolve(id)), realpathSync(require.resolve(id)), id)
}
`,
)
execFileSync(process.execPath, ['singleton.cjs'], { cwd: directory, stdio: 'inherit' })
