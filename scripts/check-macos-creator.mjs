// Creates a project with shared TSX sources from the packed CLI and checks every target it has:
//
//   node scripts/check-macos-creator.mjs --targets web,native,macos --web --mac
//   node scripts/check-macos-creator.mjs --targets web,native,macos --package-manager pnpm
//
// --targets  combination to create (default web,macos); with native, the NativeScript app's
//            JavaScript is bundled for Android and iOS and type-checked (no SDK needed)
// --web      runs the Web app in Chromium and WebKit
// --mac      builds the Mac app and launches it from outside the build folder (macOS only)
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFile, cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    targets: { type: 'string', default: 'web,macos' },
    'package-manager': { type: 'string', default: 'npm' },
    web: { type: 'boolean' },
    mac: { type: 'boolean' },
    open: { type: 'boolean' },
  },
})
const targets = values.targets.split(',')
const manager = values['package-manager']
const classicYarn =
  manager === 'yarn' &&
  execFileSync('yarn', ['--version'], { encoding: 'utf8' }).trim().startsWith('1.')
const has = (target) => targets.includes(target)
const root = resolve(import.meta.dirname, '..')
const artifacts = join(root, 'artifacts/macos')
await mkdir(artifacts, { recursive: true })
const folder = await mkdtemp(
  join(artifacts, `consumer-${targets.join('-')}-${values['package-manager']}-`),
)
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
  '--targets',
  values.targets,
  '--package-manager',
  manager,
  '--yes',
  '--no-install',
])
const project = join(folder, 'first-light')
const config = JSON.parse(await readFile(join(project, 'mavis.config.json'), 'utf8'))
assert.equal(config.schemaVersion, 2)
assert.deepEqual(config.targets, targets)
assert.equal(config.authoring, 'mitosis')

// Install the checkout's packages, as a release would publish them.
async function useLocal(directory, names) {
  const file = join(project, directory, 'package.json')
  const pkg = JSON.parse(await readFile(file, 'utf8'))
  for (const name of names) pkg.dependencies[name] = `file:${packagePath(name)}`
  // Renderer tarballs depend on core too; Yarn and pnpm would otherwise fetch it from the registry.
  if (directory !== 'apps/web') {
    const overrides = Object.fromEntries(
      packages.map((entry) => [
        // Yarn Classic resolves by name; modern Yarn and pnpm by name and version.
        classicYarn
          ? entry.name
          : `${entry.name}@${manager === 'yarn' ? 'npm:' : ''}${entry.version}`,
        `file:${packagePath(entry.name)}`,
      ]),
    )
    if (manager === 'yarn') pkg.resolutions = { ...pkg.resolutions, ...overrides }
    if (manager === 'pnpm')
      await appendFile(
        join(project, directory, 'pnpm-workspace.yaml'),
        `overrides: ${JSON.stringify(overrides)}\n`,
      )
  }
  await writeFile(file, JSON.stringify(pkg, null, 2))
}
await useLocal('', ['@getcortexlabs/mavis-core'])
if (has('web'))
  await useLocal('apps/web', ['@getcortexlabs/mavis-core', '@getcortexlabs/mavis-web'])
if (has('native'))
  await useLocal('apps/mobile', ['@getcortexlabs/mavis-core', '@getcortexlabs/mavis'])
const install = manager === 'npm' ? ['install', '--no-audit', '--no-fund'] : ['install']
run(manager, install, project)
if (has('native')) run(manager, install, join(project, 'apps/mobile'))

run(process.execPath, ['scripts/generate.mjs'], project)
// The editor setup (tsconfig.json + generated mavis-env.d.ts) checks the same sources.
run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], project)
const outputs = {
  web: 'apps/web/src/generated/Welcome.vue',
  native: 'apps/mobile/src/generated/Welcome.vue',
  macos: 'apps/macos/Sources/MavisDesktop/Generated/Welcome.swift',
}
for (const [target, file] of Object.entries(outputs))
  assert.equal(existsSync(join(project, file)), has(target), `${target} output ${file}`)
const source = await readFile(join(project, 'shared/Welcome.lite.tsx'), 'utf8')
assert.doesNotMatch(source, /__MAVIS_/)
if (has('macos')) {
  const swift = await readFile(join(project, outputs.macos), 'utf8')
  assert.match(swift, /@State private var sparks: Double/)
  assert.match(swift, /JoltPresence\(/)
  assert.doesNotMatch(swift, /undefined|\[object Object\]/)
}
if (has('native')) {
  const vue = await readFile(join(project, outputs.native), 'utf8')
  assert.match(vue, /<MReveal :show=/)
  assert.doesNotMatch(vue, /tabindex|role="group"|mavisKey/)
}

const compiler = await import(pathToFileURL(join(project, 'scripts/portable/index.mjs')))
const welcome = (text) => new Map([['shared/Welcome.lite.tsx', text]])
for (const theme of ['mavis', 'midnight']) {
  const generated = await compiler.compileProject(welcome(source), { theme })
  assert.match(generated.swift.get('MavisTokens.swift'), /joltMotion/)
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
const report = {
  project,
  targets,
  manager,
  version: packages[0].version,
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  compiler: true,
  webBuild: false,
  browsers: [],
  nativeBundles: [],
  mac: false,
}
const save = () =>
  writeFile(
    join(artifacts, `validation-${targets.join('-')}-${manager}.json`),
    JSON.stringify(report, null, 2) + '\n',
  )
await save()

if (has('web')) {
  run(
    process.execPath,
    [join(project, 'node_modules/vite/bin/vite.js'), 'build'],
    join(project, 'apps/web'),
  )
  report.webBuild = true
  await save()
}
if (has('native')) {
  const mobile = join(project, 'apps/mobile')
  run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'], mobile)
  for (const platform of ['android', 'ios']) {
    run(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--env', platform], mobile)
    report.nativeBundles.push(platform)
    await save()
  }
}
if (values.mac) {
  assert(has('macos'), '--mac needs macos in --targets.')
  assert.equal(process.platform, 'darwin', '--mac requires macOS/Xcode.')
  const textSource = source.replace(
    'sparks: 0',
    'sparks: 0, caption: "Line\\nQuote \\" and \\\\n 🧚 \\u0085"',
  )
  const escaped = join(folder, 'escaped')
  await mkdir(escaped)
  for (const [name, text] of (await compiler.compileProject(welcome(textSource))).swift)
    await writeFile(join(escaped, name), text)
  run(process.execPath, ['scripts/macos.mjs', 'build'], project)
  const app = join(project, 'dist/first-light.app')
  assert.ok(
    (await readdir(join(app, 'Contents/Resources'))).some((name) => name.endsWith('.bundle')),
    'Jolt resources are copied into the app',
  )
  // The app must find its resources wherever it is, not only next to the build folder.
  const moved = join(folder, 'elsewhere', 'first-light.app')
  await cp(app, moved, { recursive: true })
  const child = spawn(join(moved, 'Contents/MacOS/MavisDesktop'), [], { stdio: 'ignore' })
  const exited = await new Promise((done) => {
    const timer = setTimeout(() => done(null), 4000)
    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      done(signal ?? code)
    })
  })
  child.kill()
  assert.equal(exited, null, `The moved app stopped right after launch (${exited}).`)
  report.mac = true
  await save()
}
if (values.web) {
  assert(has('web'), '--web needs web in --targets.')
  const require = createRequire(join(project, 'package.json'))
  const { preview } = await import(
    pathToFileURL(
      require.resolve('vite/package.json').replace(/package\.json$/, 'dist/node/index.js'),
    )
  )
  const { chromium, webkit, expect } = await import('@playwright/test')
  const server = await preview({
    root: join(project, 'apps/web'),
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
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        await page.goto(url)
        const count = page.getByText('0', { exact: true })
        const shine = page.getByText('Motion runs through Jolt on every target.')
        await expect(count).toBeVisible()
        const add = page.getByRole('button', { name: 'Add a spark', exact: true })
        await add.click()
        await expect(page.getByText('1', { exact: true })).toBeVisible()
        await expect(shine).toBeVisible()
        await add.focus()
        await page.keyboard.press('Enter')
        await expect(page.getByText('2', { exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Start again', exact: true }).click()
        await expect(count).toBeVisible()
        await expect(shine).toHaveCount(0)
        await page.screenshot({
          path: join(artifacts, `first-light-${targets.join('-')}-${name}.png`),
          fullPage: true,
        })
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
console.log(`Shared-source project validated (${targets.join(', ')}).`)
if (values.open && has('macos')) run('open', ['-n', join(project, 'dist/first-light.app')], project)
