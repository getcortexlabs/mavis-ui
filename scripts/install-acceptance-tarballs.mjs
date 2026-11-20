import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const mode = process.argv[2]
assert(['web', 'native', 'adapters'].includes(mode))
const root = resolve('artifacts/release/packages')
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
const names = [
  '@getcortexlabs/mavis-core',
  mode === 'web' ? '@getcortexlabs/mavis-web' : '@getcortexlabs/mavis',
]
if (mode === 'adapters') names.push(...['react', 'angular', 'svelte', 'solid'].map(framework => `@getcortexlabs/mavis-${framework}-nativescript`))
const entries = names.map((name) => manifest.find((entry) => entry.name === name))
assert(entries.every(Boolean))
const cwd = mode === 'web' ? resolve('.') : resolve(mode === 'adapters' ? 'examples/native-adapters' : 'examples/catalog')
// npm preserves workspace symlinks even with --workspaces=false. Install Web
// packages outside the workspace, then replace only the two links used by the
// shared catalog. Vue and Jolt retain the checkout's pinned dependency versions.
const installRoot = mode === 'web' ? mkdtempSync(resolve(tmpdir(), 'mavis-packed-web-')) : cwd
if (mode === 'web') writeFileSync(resolve(installRoot, 'package.json'), '{"private":true}')
execFileSync(
  'npm',
  [
    'install',
    '--no-save',
    '--package-lock=false',
    '--no-audit',
    '--no-fund',
    ...(mode === 'web' ? ['--workspaces=false'] : []),
    ...entries.map((entry) => resolve(root, entry.filename)),
  ],
  { cwd: installRoot, stdio: 'inherit' },
)
if (mode === 'web') {
  for (const name of names) {
    const destination = resolve(cwd, 'node_modules', name)
    rmSync(destination, { recursive: true, force: true })
    cpSync(resolve(installRoot, 'node_modules', name), destination, { recursive: true })
  }
  rmSync(installRoot, { recursive: true, force: true })
}
for (const name of names) {
  const path = resolve(cwd, 'node_modules', name)
  assert(
    realpathSync(path).startsWith(resolve(cwd, 'node_modules') + '/'),
    `${name} must be installed from a tarball, not linked to the checkout`,
  )
}
writeFileSync(resolve(root, `installed-${mode}.json`), JSON.stringify(entries, null, 2))
