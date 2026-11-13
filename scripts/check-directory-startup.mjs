// Builds the real Directory starter, then checks its generated startup in hidden hosting views.
// This never activates an app, orders a window front, or drives the user's keyboard/pointer.
// Run from an authorized terminal: node scripts/check-directory-startup.mjs
// --prepare-only writes and generates the project without invoking Swift.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'

const root = resolve(import.meta.dirname, '..')
const artifact = join(root, 'artifacts/directory-startup')
const project = join(artifact, 'project')
const { files } = await projectFiles({
  name: 'directory-startup',
  targets: 'web,native,macos',
  example: 'directory',
})
for (const [name, content] of files) {
  const target = join(project, name)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, content)
}
if (!existsSync(join(project, 'node_modules')))
  await symlink(join(root, 'node_modules'), join(project, 'node_modules'), 'dir')
const run = (command, args, cwd = project) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env })
run(process.execPath, ['scripts/generate.mjs'])
const mac = join(project, 'apps/macos')
const app = join(mac, 'Sources/MavisDesktop/App.swift')
const original = await readFile(app, 'utf8')
await writeFile(join(artifact, 'App.original.swift'), original)
const generated = await readFile(
  join(mac, 'Sources/MavisDesktop/Generated/MavisEntry.swift'),
  'utf8',
)
assert.ok(generated.includes('MavisEntryStartup(content: MavisNavigationHost())'))
assert.ok(original.includes('MavisServices(directoryStorage: UserDefaultsDirectoryStorage())'))
if (process.argv.includes('--prepare-only')) {
  console.log(`Prepared Directory startup validation: ${project}`)
} else {
  assert.equal(process.platform, 'darwin', 'SwiftUI startup validation requires macOS.')
  let report = { passed: false, project }
  try {
    run('swift', ['build'], mac)
    const page = original.slice(original.indexOf('/// The page around a screen'))
    assert.ok(page.startsWith('/// The page'), 'The generated app must preserve its page host.')
    await writeFile(
      app,
      `${await readFile(join(root, 'test/portable-startup/DirectoryStartup.swift'), 'utf8')}\n${page}`,
    )
    run('swift', ['build'], mac)
    run(join(mac, '.build/debug/MavisDesktop'), [], mac)
    report = {
      passed: true,
      project,
      checks: [
        'real-starter-build',
        'first-appearance',
        'body-update',
        'reappearance-same-identity',
        'independent-entry-identity',
      ],
    }
  } finally {
    await writeFile(app, original)
    await writeFile(join(artifact, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  }
  console.log(
    'Directory starter build and startup identity checks passed without showing a window.',
  )
}
