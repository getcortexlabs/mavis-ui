// Creates a project with shared TSX sources from the packed CLI and checks every target it has:
//
//   node scripts/check-macos-creator.mjs --targets web,native,macos --web --mac
//   node scripts/check-macos-creator.mjs --targets web,native,macos --package-manager pnpm
//   node scripts/check-macos-creator.mjs --targets web,native,macos --example tasks --web --mac
//
// --targets  combination to create (default web,macos); with native, the NativeScript app's
//            JavaScript is bundled for Android and iOS and type-checked (no SDK needed)
//
// Every run then adds a shared screen written as a Vue file, with a named scoped slot, a
// fallback and a default slot, and makes it the entry: the Mac gets SwiftUI from it (compiled
// with --mac, not launched), and the Web and NativeScript apps are built again with the file as
// written.
// --example  welcome (default) or tasks
// --web      runs the Web app in Chromium and WebKit
// --mac      builds the Mac app and launches it from outside the build folder (macOS only)
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFile, cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    targets: { type: 'string', default: 'web,macos' },
    'package-manager': { type: 'string', default: 'npm' },
    example: { type: 'string', default: 'welcome' },
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
const tasks = values.example === 'tasks'
const entry = tasks ? 'Tasks' : 'Welcome'
const tag = `${targets.join('-')}${tasks ? '-tasks' : ''}`
const root = resolve(import.meta.dirname, '..')
const artifacts = join(root, 'artifacts/macos')
await mkdir(artifacts, { recursive: true })
const folder = await mkdtemp(join(artifacts, `consumer-${tag}-${values['package-manager']}-`))
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
  '--example',
  values.example,
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
assert.equal(config.example, values.example)
assert.equal(config.portability.entry, entry)

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
  web: `apps/web/src/generated/${entry}.vue`,
  native: `apps/mobile/src/generated/${entry}.vue`,
  macos: `apps/macos/Sources/MavisDesktop/Generated/${entry}.swift`,
}
for (const [target, file] of Object.entries(outputs))
  assert.equal(existsSync(join(project, file)), has(target), `${target} output ${file}`)
const source = await readFile(join(project, `shared/${entry}.lite.tsx`), 'utf8')
assert.doesNotMatch(source, /__MAVIS_/)
for (const host of [
  has('web') && 'apps/web/src/main.js',
  has('native') && 'apps/mobile/src/App.vue',
  has('macos') && 'apps/macos/Sources/MavisDesktop/App.swift',
].filter(Boolean))
  assert.doesNotMatch(await readFile(join(project, host), 'utf8'), /__MAVIS_/, host)
if (has('macos')) {
  const swift = await readFile(join(project, outputs.macos), 'utf8')
  if (tasks) {
    assert.match(swift, /MavisGrid\(minColumnWidth: 320\.0, columns: 2\.0/)
    assert.match(swift, /\.keyboardShortcut\(KeyEquivalent\("k"\), modifiers: \.command\)/)
    assert.match(swift, /\.joltLayout\(value: self\.visible\.map\(\\\.id\)\)/)
  } else {
    assert.match(swift, /@State private var sparks: Double/)
    assert.match(swift, /JoltPresence\(/)
  }
  assert.doesNotMatch(swift, /undefined|\[object Object\]/)
}
if (has('native')) {
  const vue = await readFile(join(project, outputs.native), 'utf8')
  if (tasks) assert.match(vue, /<MGrid gap="lg" :columns="2" :minColumnWidth="320">/)
  else assert.match(vue, /<MReveal :show=/)
  // Hardware keys are for the Web and the Mac.
  assert.doesNotMatch(vue, /tabindex|role="group"|mavisKey|useMavisShortcuts/)
}

const compiler = await import(pathToFileURL(join(project, 'scripts/portable/index.mjs')))
const shared = await compiler.readShared(project)
const edited = (text) => new Map([...shared, [`shared/${entry}.lite.tsx`, text]])
for (const theme of ['mavis', 'midnight']) {
  const generated = await compiler.compileProject(shared, { theme, root: entry })
  assert.match(generated.swift.get('MavisControls.swift'), /joltMotion/)
  assert.match(
    generated.vue.get(`${entry}.vue`),
    tasks ? /useMavisShortcuts\(\[/ : /state\.sparks = \(state\.sparks \+ 1\)/,
  )
}
for (const [from, to] of tasks
  ? [
      ['gap="lg" columns={2}', 'gap="unknown" columns={2}'],
      ['shortcut="mod+k"', 'shortcut="mod+d"'],
      ['shortcut="mod+k"', 'shortcut="k"'],
      ['variant="title"', 'variant="unknown"'],
    ]
  : [
      ['gap="xl"', 'gap="unknown"'],
      ['variant="display"', 'variant="unknown"'],
      ['tone="primary"', 'tone="unknown"'],
      ['variant="secondary"', 'variant="danger"'],
    ]) {
  assert.ok(source.includes(from), from)
  await assert.rejects(
    compiler.compileProject(edited(source.replace(from, to)), { root: entry }),
    new RegExp(`${entry}\\.lite\\.tsx:\\d+:\\d+:`),
  )
}
const report = {
  project,
  targets,
  example: values.example,
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
    join(artifacts, `validation-${tag}-${manager}.json`),
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
  if (!tasks) {
    const textSource = source.replace(
      'sparks: 0',
      'sparks: 0, caption: "Line\\nQuote \\" and \\\\n 🧚 \\u0085"',
    )
    const escaped = join(folder, 'escaped')
    await mkdir(escaped)
    for (const [name, text] of (await compiler.compileProject(edited(textSource))).swift)
      await writeFile(join(escaped, name), text)
  }
  run(process.execPath, ['scripts/macos.mjs', 'build'], project)
  const app = join(project, 'dist/first-light.app')
  // JoltSwiftUI keeps its motion definitions in code: the app must start wherever it is.
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
        if (tasks) await tasksSession(page, expect)
        else {
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
        }
        await page.screenshot({
          path: join(artifacts, `first-light-${tag}-${name}.png`),
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
await vueScreen()
console.log(`Shared-source project validated (${targets.join(', ')}, ${values.example}).`)

async function vueScreen() {
  await writeFile(
    join(project, 'shared/SparkRow.vue'),
    `<script setup lang="ts">
import { MButton, MColumn, MRow, MText } from '#mavis'

withDefaults(defineProps<{ label: string; count?: number }>(), { count: 0 })
defineEmits<{ add: [step: number] }>()
defineSlots<{ hint?(props: { total: number }): unknown; default?(): unknown }>()
</script>

<template>
  <MColumn gap="xs">
    <MRow gap="sm">
      <MText>{{ label }}: {{ count }}</MText>
      <MButton text="Add" @click="$emit('add', 1)" />
    </MRow>
    <slot name="hint" :total="count"><MText tone="muted">No hint yet</MText></slot>
    <slot />
  </MColumn>
</template>
`,
  )
  await writeFile(
    join(project, 'shared/Sparks.vue'),
    `<script setup lang="ts">
import { computed, ref } from 'vue'
import { MColumn, MInput, MReveal, MText, useMavisPlatform } from '#mavis'
import SparkRow from './SparkRow.vue'

const { isMacOS } = useMavisPlatform()
const name = ref('')
const sparks = ref(0)
const title = computed(() => (name.value.trim() === '' ? 'Sparks' : \`Sparks for \${name.value}\`))
function add(step: number) {
  sparks.value += step
}
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">{{ title }}</MText>
    <MText v-if="isMacOS" tone="muted">In a window of its own</MText>
    <MText v-else tone="muted">In a Vue app</MText>
    <MInput v-model="name" label="Name" />
    <SparkRow label="Collected" :count="sparks" @add="add">
      <template #hint="{ total }">
        <MText tone="muted">{{ total }} so far</MText>
      </template>
      <MText>Collected in this window.</MText>
    </SparkRow>
    <MReveal :show="sparks > 0">
      <MText tone="primary">Written once, as a Vue file.</MText>
    </MReveal>
  </MColumn>
</template>
`,
  )
  const configPath = join(project, 'mavis.config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  config.portability.entry = 'Sparks'
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  run(process.execPath, ['scripts/generate.mjs'], project)
  const generated = {
    web: 'apps/web/src/generated',
    native: 'apps/mobile/src/generated',
    macos: 'apps/macos/Sources/MavisDesktop/Generated',
  }
  for (const target of ['web', 'native'].filter(has)) {
    assert.match(
      await readFile(join(project, generated[target], 'entry.ts'), 'utf8'),
      /export \{ default \} from '#shared-ui\/Sparks\.vue'/,
    )
    // The Vue file runs as written; the TSX screen beside it is still generated.
    assert.equal(existsSync(join(project, generated[target], 'Sparks.vue')), false)
    assert.equal(existsSync(join(project, generated[target], `${entry}.vue`)), true)
  }
  if (has('macos')) {
    const swift = await readFile(join(project, generated.macos, 'Sparks.swift'), 'utf8')
    assert.match(swift, /Text\(verbatim: "In a window of its own"\)/)
    assert.doesNotMatch(swift, /In a Vue app|undefined|\[object Object\]/)
    const row = await readFile(join(project, generated.macos, 'SparkRow.swift'), 'utf8')
    assert.match(row, /struct SparkRow<Hint: View, Content: View>: View \{/)
    assert.match(row, /count: Double = 0\.0,\n\s+onAdd: @escaping \(Double\) -> Void,/)
    assert.match(row, /@ViewBuilder hint: @escaping \(Double\) -> Hint = \{ _ in MavisNoSlot\(\) \}/)
    assert.match(swift, /hint: \{ \(total: Double\) in/)
    assert.equal(existsSync(join(project, generated.macos, 'MavisSlots.swift')), true)
    assert.equal(existsSync(join(project, generated.macos, `${entry}.swift`)), true)
  }
  if (has('web'))
    run(
      process.execPath,
      [join(project, 'node_modules/vite/bin/vite.js'), 'build'],
      join(project, 'apps/web'),
    )
  if (has('native')) {
    const mobile = join(project, 'apps/mobile')
    run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'], mobile)
    for (const platform of ['android', 'ios'])
      run(process.execPath, ['node_modules/webpack-cli/bin/cli.js', '--env', platform], mobile)
  }
  if (values.mac) run('swift', ['build', '--package-path', 'apps/macos'], project)
  report.vue = true
  await save()
}

// The generated Tasks app as a person uses it; test/portable/tasksExample replays the full session.
async function tasksSession(page, expect) {
  const card = (name) => page.getByRole('button', { name, exact: true })
  const list = page.getByRole('group', { name: 'Tasks', exact: true })
  const detail = page.getByLabel('Task title', { exact: true })
  await expect(page.getByText('2 open · 1 done')).toBeVisible()
  // List and detail side by side on a wide page, one column on a narrow one.
  const beside = async () => {
    const [left, right] = [await list.boundingBox(), await detail.boundingBox()]
    return right.x > left.x + left.width
  }
  await expect.poll(beside).toBe(true)
  await page.setViewportSize({ width: 420, height: 850 })
  await expect.poll(beside).toBe(false)
  await page.setViewportSize({ width: 1000, height: 850 })
  await expect.poll(beside).toBe(true)
  await page.keyboard.press('ControlOrMeta+k')
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused()
  await page.keyboard.type('Write the changelog')
  await page.keyboard.press('Enter')
  await expect(card('Write the changelog, open, normal priority, selected')).toBeVisible()
  await expect(detail).toHaveValue('Write the changelog')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(card('Write the changelog, done, normal priority, selected')).toBeVisible()
  await expect(page.getByText('2 open · 2 done')).toBeVisible()
  await page.getByRole('button', { name: 'Open (2)', exact: true }).click()
  await expect(card('Write the changelog, done, normal priority, selected')).toHaveCount(0)
  await page.getByRole('button', { name: 'All (4)', exact: true }).click()
  await page.keyboard.press('ControlOrMeta+d')
  await expect(card('Sketch the launch page, open, high priority, selected')).toBeVisible()
  await expect(page.getByText('2 open · 1 done')).toBeVisible()
}
if (values.open && has('macos')) run('open', ['-n', join(project, 'dist/first-light.app')], project)
