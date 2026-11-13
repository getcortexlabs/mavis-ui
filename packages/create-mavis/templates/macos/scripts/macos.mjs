import { spawnSync } from 'node:child_process'
import { cp, mkdir, copyFile, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, isAbsolute } from 'node:path'
import { macAppSettings } from '@getcortexlabs/mavis-compiler'
import { macAppManifest } from './macos-manifest.mjs'

if (process.platform !== 'darwin')
  throw new Error(
    'The macOS app needs macOS 14+ and Xcode. Web and code generation work on other hosts.',
  )
const action = process.argv[2] ?? 'build'
if (!['build', 'run'].includes(action)) throw new Error('Expected build or run.')
const root = fileURLToPath(new URL('../', import.meta.url))
const config = JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
const settings = macAppSettings(config.macos, config.name ?? '__MAVIS_NAME__')
function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(
      `${command} failed (${result.status}). Check Xcode installation and command-line tools.`,
    )
  return result.stdout?.trim()
}
run(process.execPath, ['scripts/generate.mjs'])
run('swift', ['build', '--package-path', 'apps/macos', '-c', 'release'])
const bin = run(
  'swift',
  ['build', '--package-path', 'apps/macos', '-c', 'release', '--show-bin-path'],
  true,
)
const app = join(root, 'dist', settings.name + '.app')
await rm(app, { recursive: true, force: true })
await mkdir(join(app, 'Contents', 'MacOS'), { recursive: true })
await copyFile(join(bin, 'MavisDesktop'), join(app, 'Contents', 'MacOS', 'MavisDesktop'))
// Resource bundles of Swift packages travel inside the app: the app's own holds the Lucide font
// of MIcon. JoltSwiftUI has none.
for (const entry of await readdir(bin))
  if (entry.endsWith('.bundle'))
    await cp(join(bin, entry), join(app, 'Contents', 'Resources', entry), { recursive: true })
if (settings.icon) {
  if (
    isAbsolute(settings.icon) ||
    settings.icon.includes('\\') ||
    settings.icon.split('/').includes('..')
  )
    throw new Error('macos.icon must stay inside the project.')
  await mkdir(join(app, 'Contents', 'Resources'), { recursive: true })
  await copyFile(join(root, settings.icon), join(app, 'Contents', 'Resources', 'AppIcon.icns'))
}
await writeFile(join(app, 'Contents', 'Info.plist'), macAppManifest(settings))
console.log(`Built ${app}. Local unsigned development app; distribution/signing is not configured.`)
if (action === 'run') run('open', ['-n', app])
