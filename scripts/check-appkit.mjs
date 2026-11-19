import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

if (process.platform !== 'darwin' || process.arch !== 'arm64')
  throw new Error('The published AppKit runtime requires macOS arm64.')
const source = resolve('examples/appkit')
for (const script of ['build.mjs', 'package.mjs'])
  execFileSync(process.execPath, [join(source, script)], { cwd: source, stdio: 'inherit' })
const outside = mkdtempSync(join(tmpdir(), 'mavis-appkit-installed-'))
const app = join(outside, 'Directory Demo.app')
cpSync(join(source, 'artifacts/Mavis AppKit.app'), app, { recursive: true, verbatimSymlinks: true })
const output = resolve('artifacts/appkit')
mkdirSync(output, { recursive: true })
writeFileSync(
  join(output, 'installation.json'),
  JSON.stringify({ app, outside, source }, null, 2) + '\n',
)
const hostOnly = process.argv.includes('--host-only')
try {
  const log = execFileSync(
    join(app, 'Contents/MacOS/MavisAppKit'),
    [hostOnly ? '--check-host' : '--check'],
    {
      cwd: outside,
      encoding: 'utf8',
      timeout: 90000,
      env: { ...process.env, MAVIS_APPKIT_STORAGE: join(outside, 'directory.json') },
    },
  )
  writeFileSync(join(output, 'run.log'), log)
  console.log(log)
  const filename = `appkit-${hostOnly ? 'host' : 'native'}-check.json`
  cpSync(join(outside, 'artifacts'), output, { recursive: true })
  const persisted = JSON.parse(readFileSync(join(outside, 'directory.json'), 'utf8'))
  if (!persisted.some((entry) => entry.name === 'AppKit community garden'))
    throw new Error('Packaged app did not persist the edit.')
  const restored = execFileSync(
    join(app, 'Contents/MacOS/MavisAppKit'),
    [hostOnly ? '--check-host' : '--check', '--expect-restored'],
    {
      cwd: outside,
      encoding: 'utf8',
      timeout: 90000,
      env: { ...process.env, MAVIS_APPKIT_STORAGE: join(outside, 'directory.json') },
    },
  )
  writeFileSync(join(output, 'restore.log'), restored)
  cpSync(join(outside, 'artifacts', filename), join(output, 'restored-check.json'))
} catch (error) {
  if (existsSync(join(outside, 'artifacts')))
    cpSync(join(outside, 'artifacts'), output, { recursive: true })
  writeFileSync(
    join(output, 'failure.log'),
    `${error.stdout ?? ''}\n${error.stderr ?? ''}\n${error.message}\n`,
  )
  throw error
}
console.log(`Validated the relocated app with its bundled Node/runtime: ${app}`)
