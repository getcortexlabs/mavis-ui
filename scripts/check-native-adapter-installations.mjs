// Independent package consumers: no workspace, only the selected framework's peers.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const base = process.env.MAVIS_ADAPTER_CONSUMERS || mkdtempSync(join(tmpdir(), 'mavis-adapter-consumers-'))
const example = JSON.parse(readFileSync(join(root, 'examples/native-adapters/package.json'), 'utf8'))
const version = JSON.parse(readFileSync(join(root, 'packages/nativescript/package.json'), 'utf8')).version
const groups = {
  plain: [], vue: ['vue', 'nativescript-vue'],
  react: ['react', 'react-nativescript'],
  angular: ['@angular/core', '@angular/common', '@angular/compiler', '@angular/animations', '@angular/forms', '@angular/router', '@angular/platform-browser', '@nativescript/angular'],
  svelte: ['svelte', '@nativescript-community/svelte-native'],
  solid: ['solid-js', '@nativescript-community/solid-js', 'dominative', '@solidjs/universal'],
}
const packed = name => `file:${join(root, 'artifacts/release/packages', `${name.slice(1).replace('/', '-')}-${version}.tgz`)}`
for (const [framework, peers] of Object.entries(groups)) {
  const folder = join(base, framework)
  if (!process.argv.includes('--verify')) {
    mkdirSync(folder, { recursive: true })
    const dependencies = {
      '@getcortexlabs/mavis-core': packed('@getcortexlabs/mavis-core'),
      '@getcortexlabs/mavis': packed('@getcortexlabs/mavis'),
      '@nativescript/core': '9.1.4', '@rafaelaugusto/jolt': '0.1.0-rc.18',
      ...Object.fromEntries(peers.map(name => [name, name === 'vue' ? '3.5.44' : name === 'nativescript-vue' ? '3.1.3' : (example.dependencies[name] ?? example.devDependencies[name])])),
    }
    if (!['plain', 'vue'].includes(framework)) {
      const name = `@getcortexlabs/mavis-${framework}-nativescript`
      dependencies[name] = packed(name)
    }
    const overrides = framework === 'react' ? { 'react-nativescript': { '@nativescript/core': '$@nativescript/core' } }
      : framework === 'svelte' ? { '@nativescript-community/svelte-native': { '@nativescript/core': '$@nativescript/core' } } : {}
    writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: `mavis-${framework}-consumer`, private: true, dependencies, overrides }, null, 2))
    if (process.argv.includes('--prepare')) continue
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: folder, stdio: 'pipe', timeout: 180000 })
  }
  for (const other of Object.keys(groups).filter(name => !['plain', framework].includes(name))) {
    const forbidden = other === 'vue' ? 'vue' : other === 'angular' ? '@angular/core' : other === 'solid' ? 'solid-js' : other
    assert(!existsSync(join(folder, 'node_modules', forbidden)), `${framework} unexpectedly installed ${forbidden}`)
  }
  const installed = JSON.parse(readFileSync(join(folder, 'node_modules/@getcortexlabs/mavis/package.json'), 'utf8'))
  assert.equal(installed.version, version)
  console.log(`${framework}: isolated installation passed`)
}
console.log(`Consumers: ${base}`)
