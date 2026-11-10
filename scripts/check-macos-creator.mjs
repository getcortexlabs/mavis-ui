import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(import.meta.dirname, '..')
const artifacts = join(root, 'artifacts/macos')
await mkdir(artifacts, { recursive: true })
const folder = await mkdtemp(join(artifacts, 'consumer-'))
const run = (command, args, cwd = folder) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env })
const packages = JSON.parse(
  await readFile(join(root, 'artifacts/release/packages/manifest.json'), 'utf8'),
)
const packagePath = (name) =>
  join(root, 'artifacts/release/packages', packages.find((p) => p.name === name).filename)
const packed = join(folder, 'creator')
await mkdir(packed)
run('tar', [
  '-xzf',
  packagePath('@getcortexlabs/create-mavis'),
  '--strip-components=1',
  '-C',
  packed,
])
run(process.execPath, [
  join(packed, 'src/cli.mjs'),
  'first-light',
  '--target',
  'macos',
  '--yes',
  '--no-install',
])
const project = join(folder, 'first-light')
const pkg = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'))
for (const name of ['@getcortexlabs/mavis-core', '@getcortexlabs/mavis-web'])
  pkg.dependencies[name] = `file:${packagePath(name)}`
await writeFile(join(project, 'package.json'), JSON.stringify(pkg, null, 2))
run('npm', ['install', '--no-audit', '--no-fund'], project)
run(process.execPath, ['scripts/generate.mjs'], project)
// The editor setup (tsconfig.json + generated mavis-env.d.ts) checks the same sources.
run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], project)
const source = await readFile(join(project, 'shared/Welcome.lite.tsx'), 'utf8')
const swift = await readFile(
  join(project, 'native/Sources/MavisDesktop/Generated/Welcome.swift'),
  'utf8',
)
assert.match(swift, /@State private var sparks: Double/)
assert.match(swift, /self\.sparks = \(self\.sparks \+ 1\.0\)/)
assert.doesNotMatch(swift, /undefined|\[object Object\]/)
const compiler = await import(pathToFileURL(join(project, 'scripts/portable/index.mjs')))
const welcome = (text) => new Map([['shared/Welcome.lite.tsx', text]])
for (const theme of ['mavis', 'midnight']) {
  const generated = await compiler.compileProject(welcome(source), { theme })
  assert.match(generated.swift.get('MavisTokens.swift'), /accessibilityReduceMotion/)
  assert.match(generated.vue.get('Welcome.vue'), /state\.sparks = \(state\.sparks \+ 1\)/)
}
for (const [from, to] of [
  ['gap="xl"', 'gap="unknown"'],
  ['variant="display"', 'variant="unknown"'],
  ['tone="primary"', 'tone="unknown"'],
  ['variant="secondary"', 'variant="ghost"'],
]) {
  await assert.rejects(
    compiler.compileProject(welcome(source.replace(from, to))),
    /Welcome\.lite\.tsx:\d+:\d+:/,
  )
}
const textSource = source.replace(
  'sparks: 0',
  'sparks: 0, caption: "Line\\nQuote \\\" and \\\\n 🧚 \\u0085"',
)
const textFixture = await compiler.compileProject(welcome(textSource))
const escaped = join(folder, 'escaped')
await mkdir(escaped)
for (const [name, text] of textFixture.swift) await writeFile(join(escaped, name), text)
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], project)
const report = {
  project,
  version: packages[0].version,
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  compiler: true,
  webBuild: true,
  browsers: [],
  native: false,
  nativeInteraction: 'manual verification required',
}
const save = () =>
  writeFile(join(artifacts, 'validation.json'), JSON.stringify(report, null, 2) + '\n')
await save()
if (process.argv.includes('--native')) {
  assert.equal(process.platform, 'darwin', '--native requires macOS/Xcode.')
  const escapedSources = [...textFixture.swift.keys()].map((name) => join(escaped, name))
  run(
    'xcrun',
    ['swiftc', '-typecheck', '-target', 'arm64-apple-macos14', ...escapedSources],
    project,
  )
  run(process.execPath, ['scripts/macos.mjs', 'build'], project)
  report.native = true
  await save()
}
if (process.argv.includes('--web')) {
  const require = createRequire(join(project, 'package.json'))
  const { preview } = await import(
    pathToFileURL(
      require.resolve('vite/package.json').replace(/package\.json$/, 'dist/node/index.js'),
    )
  )
  const { chromium, webkit, expect } = await import('@playwright/test')
  const server = await preview({
    root: project,
    preview: { host: '127.0.0.1', port: 4197, strictPort: false },
  })
  try {
    const url = server.resolvedUrls.local[0]
    for (const [name, engine] of [
      ['chromium', chromium],
      ['webkit', webkit],
    ]) {
      const browser = await engine.launch()
      try {
        const page = await browser.newPage({ viewport: { width: 1000, height: 850 } })
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.goto(url)
        const count = page.getByText('0', { exact: true })
        await expect(count).toBeVisible()
        const add = page.getByRole('button', { name: 'Add a spark', exact: true })
        await add.click()
        await expect(page.getByText('1', { exact: true })).toBeVisible()
        await add.focus()
        await page.keyboard.press('Enter')
        await expect(page.getByText('2', { exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Start again', exact: true }).click()
        await expect(count).toBeVisible()
        await page.screenshot({ path: join(artifacts, `first-light-${name}.png`), fullPage: true })
        assert.deepEqual(errors, [])
        report.browsers.push(name)
        await save()
      } finally {
        await browser.close()
      }
    }
  } finally {
    await new Promise((done) => server.httpServer.close(done))
  }
}
await save()
console.log(`Experimental starter validated. Report: ${join(artifacts, 'validation.json')}`)
if (process.argv.includes('--open'))
  run('open', ['-n', join(project, 'dist/first-light.app')], project)
