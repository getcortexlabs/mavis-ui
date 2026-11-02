import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

// Temporary, reproducible upstream validation. Never creates or publishes a Jolt version.
const config = JSON.parse(readFileSync('jolt-candidate.json', 'utf8'))
if (!config) process.exit(0)
if (!/^[a-f0-9]{40}$/.test(config.commit) || config.repository !== 'https://github.com/rafaelaugustos/jolt.git')
  throw new Error('Expected a pinned official Jolt commit.')
const folder = resolve('artifacts/jolt-candidate', config.commit)
const checkout = join(folder, 'source')
const run = (cwd, command, args) => execFileSync(command, args, { cwd, stdio: 'inherit' })
mkdirSync(folder, { recursive: true })
let manifest
const manifestFile = join(folder, 'manifest.json')
if (existsSync(manifestFile)) manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
if (!manifest || !existsSync(manifest.tarball)) {
  if (!existsSync(checkout)) {
    run(folder, 'git', ['clone', '--filter=blob:none', '--no-checkout', '--depth=1', config.repository, checkout])
    run(checkout, 'git', ['sparse-checkout', 'set', 'src', 'platforms'])
  }
  run(checkout, 'git', ['fetch', '--depth=1', 'origin', config.commit])
  run(checkout, 'git', ['checkout', '--detach', config.commit])
  run(checkout, 'npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'])
  run(checkout, 'npm', ['run', 'build'])
  const result = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', folder], { cwd: checkout, encoding: 'utf8' }))
  manifest = { commit: config.commit, tarball: join(folder, result[0].filename) }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
}
writeFileSync('artifacts/jolt-candidate.json', JSON.stringify(manifest, null, 2) + '\n')
run(process.argv.includes('--native') ? 'examples/catalog' : '.', 'npm', ['install', '--no-save', '--package-lock=false', '--ignore-scripts', '--no-audit', '--no-fund', manifest.tarball])
console.log(`Testing Jolt commit ${manifest.commit}; not the published RC.7 contents.`)
