import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mode = process.argv[2]
assert(['web', 'native'].includes(mode))
const root = resolve('artifacts/release/packages')
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
const names = [
  '@getcortexlabs/mavis-core',
  mode === 'web' ? '@getcortexlabs/mavis-web' : '@getcortexlabs/mavis',
]
const entries = names.map((name) => manifest.find((entry) => entry.name === name))
assert(entries.every(Boolean))
const cwd = mode === 'web' ? resolve('.') : resolve('examples/catalog')
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
  { cwd, stdio: 'inherit' },
)
for (const name of names) {
  const path = resolve(cwd, 'node_modules', name)
  assert(
    realpathSync(path).startsWith(resolve(cwd, 'node_modules') + '/'),
    `${name} must be installed from a tarball, not linked to the checkout`,
  )
}
writeFileSync(resolve(root, `installed-${mode}.json`), JSON.stringify(entries, null, 2))
