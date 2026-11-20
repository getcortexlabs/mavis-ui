import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const base = process.env.MAVIS_CREATOR_CONSUMERS ?? resolve(root, 'artifacts/native-creator')
const manager = process.env.MAVIS_CREATOR_MANAGER ?? 'npm'
const frameworks = process.argv[2]
  ? [process.argv[2]]
  : ['plain', 'react', 'angular', 'svelte', 'solid']
const report = []
for (const framework of frameworks) {
  const cwd = resolve(base, framework)
  const run = (args) =>
    execFileSync(manager, args, {
      cwd,
      stdio: 'inherit',
      timeout: 240000,
      shell: process.platform === 'win32',
    })
  run(['install'])
  for (const peer of [
    'vue',
    'nativescript-vue',
    ...['react', 'svelte', 'solid-js', '@angular/core'].filter(
      (name) =>
        !(
          { react: ['react'], svelte: ['svelte'], solid: ['solid-js'], angular: ['@angular/core'] }[
            framework
          ] ?? []
        ).includes(name),
    ),
  ])
    assert(
      !existsSync(resolve(cwd, 'node_modules', peer)),
      `${framework} installed unrelated peer ${peer}`,
    )
  for (const script of ['typecheck', 'bundle:ios', 'bundle:android']) run(['run', script])
  const pkg = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'))
  report.push({
    framework,
    manager,
    dependencies: pkg.dependencies,
    checks: [
      'isolated installation',
      'typecheck',
      'iOS bundle without Vue',
      'Android bundle without Vue',
    ],
  })
}
mkdirSync(resolve(root, 'artifacts/native-creator'), { recursive: true })
writeFileSync(
  resolve(root, 'artifacts/native-creator/consumer-report.json'),
  JSON.stringify(report, null, 2) + '\n',
)
