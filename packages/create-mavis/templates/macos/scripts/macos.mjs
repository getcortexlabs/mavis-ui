import { spawnSync } from 'node:child_process'
import { cp, mkdir, copyFile, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

if (process.platform !== 'darwin')
  throw new Error(
    'The macOS app needs macOS 14+ and Xcode. Web and code generation work on other hosts.',
  )
const action = process.argv[2] ?? 'build'
if (!['build', 'run'].includes(action)) throw new Error('Expected build or run.')
const root = fileURLToPath(new URL('../', import.meta.url))
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
const app = join(root, 'dist', '__MAVIS_NAME__.app')
await rm(app, { recursive: true, force: true })
await mkdir(join(app, 'Contents', 'MacOS'), { recursive: true })
await copyFile(join(bin, 'MavisDesktop'), join(app, 'Contents', 'MacOS', 'MavisDesktop'))
// Resource bundles of Swift packages travel inside the app: the app's own holds the Lucide font
// of MIcon. JoltSwiftUI has none.
for (const entry of await readdir(bin))
  if (entry.endsWith('.bundle'))
    await cp(join(bin, entry), join(app, 'Contents', 'Resources', entry), { recursive: true })
await writeFile(
  join(app, 'Contents', 'Info.plist'),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>MavisDesktop</string>
<key>CFBundleIdentifier</key><string>com.mavis.experimental.__MAVIS_APPID__</string>
<key>CFBundleName</key><string>__MAVIS_NAME__</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.0.0</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>`,
)
console.log(`Built ${app}. Local unsigned development app; distribution/signing is not configured.`)
if (action === 'run') run('open', ['-n', app])
