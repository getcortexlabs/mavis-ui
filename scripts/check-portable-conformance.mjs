// Runs every fixture in test/portable through the portable compiler, then replays its
// steps.json on the generated Vue (Chromium and WebKit) and the generated SwiftUI app
// (XCUITest on macOS). Both outputs must show the same texts after every step, and hold the
// same layout relations where a step asserts them (see test/portable-native/layout.ts).
//
// A fixture whose shared sources are .vue files runs those files as written on the Web and on
// NativeScript, and the SwiftUI generated from them on the Mac. "replays" in its steps.json
// names the fixture whose steps it repeats: one script for the same screen in two formats.
// "touch" lists the keys its format has no handler for (a Vue file cannot listen to Escape and
// still run on NativeScript): those steps run as their touch equivalent on every target.
//
//   node scripts/check-portable-conformance.mjs --web --native
//   MAVIS_FIXTURES=form node scripts/check-portable-conformance.mjs --native
//   node scripts/check-portable-conformance.mjs --offscreen
//   MAVIS_IOS_SIMULATOR=<udid> node scripts/check-portable-conformance.mjs --nativescript ios
//   MAVIS_ANDROID_DEVICE=emulator-5586 node scripts/check-portable-conformance.mjs --nativescript android
//
// --native drives the real desktop with XCUITest: mouse, keyboard and window focus. It is meant
// for the macOS CI runner; on a Mac in use it gets in the way and other windows break the run.
//
// --offscreen builds the same SwiftUI as a Swift package and replays, inside one process and
// without showing a window, the fixtures whose steps are clicks, texts and layout: the views are
// laid out in a hosting view and read through their own accessibility tree. It needs no screen,
// keyboard or permission, so it also runs on a Mac in use. Typing and focus stay with --native.
//
// --nativescript runs the generated NativeScript Vue on a simulator or emulator. Steps that need
// a hardware keyboard name their touch equivalent with "native" (null skips the step).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
// One implementation of the layout relations for the Web runner and the NativeScript probe.
const { default: ts } = await import('typescript')
const { layoutFailures, layoutIds } = await import(
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(readFileSync(join(root, 'test/portable-native/layout.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  ).toString('base64')}`
)
const compilerDir = join(root, 'packages/create-mavis/templates/macos/scripts/portable')
const { compileProject } = await import(pathToFileURL(join(compilerDir, 'index.mjs')))
const { swiftString, joltSwift } = await import(pathToFileURL(join(compilerDir, 'emit-swift.mjs')))
const artifacts = join(root, 'artifacts/portable')
mkdirSync(artifacts, { recursive: true })
const pascal = (name) => name[0].toUpperCase() + name.slice(1)

const webKeys = { Return: 'Enter', Escape: 'Escape', Tab: 'Tab', 'Shift+Tab': 'Shift+Tab' }

// A field by its visible label: the editor, checkbox or select button.
const webField = (page, label) =>
  page
    .locator('#app')
    .getByLabel(label, { exact: true })
    .and(page.locator(':not([role="listbox"])'))

const functionKeys = Array.from({ length: 12 }, (_, index) => `F${index + 1}`)
const swiftKeys = {
  ...Object.fromEntries(functionKeys.map((key) => [key, [`.${key}`, '[]']])),
  Return: ['.return', '[]'],
  Escape: ['.escape', '[]'],
  Tab: ['.tab', '[]'],
  'Shift+Tab': ['.tab', '.shift'],
  ArrowUp: ['.upArrow', '[]'],
  ArrowDown: ['.downArrow', '[]'],
  ArrowLeft: ['.leftArrow', '[]'],
  ArrowRight: ['.rightArrow', '[]'],
}

// MAVIS_FIXTURES=form,tasks runs only those fixtures; MAVIS_THEME=midnight uses the dark theme.
const only = process.env.MAVIS_FIXTURES?.split(',')
const theme = process.env.MAVIS_THEME ?? 'mavis'
const fixtures = []
for (const name of readdirSync(join(root, 'test/portable')).sort()) {
  if (only && !only.includes(name)) continue
  const folder = join(root, 'test/portable', name)
  const own = JSON.parse(readFileSync(join(folder, 'steps.json'), 'utf8'))
  const script = own.replays
    ? {
        ...JSON.parse(readFileSync(join(root, 'test/portable', own.replays, 'steps.json'), 'utf8')),
        ...own,
      }
    : own
  if (own.touch)
    script.steps = script.steps.flatMap((step) =>
      own.touch.includes(step.press) ? (step.native ? [step.native] : []) : [step],
    )
  // A fixture can replay a creator example's own sources instead of a copy.
  const shared = resolve(folder, own.shared ?? 'shared')
  const files = new Map(
    readdirSync(shared).map((file) => [`shared/${file}`, readFileSync(join(shared, file), 'utf8')]),
  )
  const output = await compileProject(files, {
    theme,
    root: script.root,
    namespace: `${pascal(name)}Fixture`,
  })
  assert.ok(
    !output.direct.length || !output.vue.size,
    `${name}: a fixture is written in one format.`,
  )
  fixtures.push({ name, ...script, output, files })
}
// What a Vue host runs for a fixture: the generated components, or its own files as written.
const hosted = (fixture, generated) =>
  fixture.output.direct.length
    ? [...fixture.files].map(([path, text]) => [path.slice('shared/'.length), text])
    : [...generated]
const report = {
  theme,
  fixtures: fixtures.map(({ name, root: component, steps, covers, replays, output }) => ({
    name,
    root: component,
    covers,
    steps: steps.length,
    ...(replays ? { replays } : {}),
    source: output.direct.length ? 'vue' : 'tsx',
  })),
  web: {},
  native: null,
}
const save = () =>
  writeFileSync(join(artifacts, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
save()
console.log(`Compiled ${fixtures.length} fixtures.`)

if (process.argv.includes('--web')) await runWeb()
if (process.argv.includes('--offscreen')) runOffscreen()
if (process.argv.includes('--native')) runNative()
const nativescript = process.argv.indexOf('--nativescript')
if (nativescript >= 0) await runNativeScript(process.argv[nativescript + 1])
save()
console.log(`Portable conformance passed. Report: ${join(artifacts, 'report.json')}`)

async function runWeb() {
  const dir = join(artifacts, 'web')
  rmSync(dir, { recursive: true, force: true })
  for (const fixture of fixtures) {
    const target = join(dir, 'fixtures', fixture.name)
    mkdirSync(target, { recursive: true })
    for (const [file, text] of hosted(fixture, fixture.output.vue))
      writeFileSync(join(target, file), text)
  }
  // Shared Vue files import Mavis from #mavis; this host resolves it to Mavis Web.
  writeFileSync(join(dir, 'mavis.js'), "export * from '@getcortexlabs/mavis-web'\n")
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><title>Mavis conformance</title></head><body><main id="app"></main><script type="module" src="/main.js"></script></body></html>\n',
  )
  writeFileSync(
    join(dir, 'main.js'),
    [
      "import { createApp } from 'vue'",
      "import { createMavisServices } from '@getcortexlabs/mavis-web/services'",
      `import { MColumn, MRow, MGrid, MCard, MText, MButton, MInput, MCheckbox, MSelect, MReveal, ${theme} } from '@getcortexlabs/mavis-web'`,
      "import '@getcortexlabs/mavis-web/style.css'",
      ...fixtures.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      `const roots = { ${fixtures.map((fixture) => `${fixture.name}: ${pascal(fixture.name)}`).join(', ')} }`,
      'const app = createApp(roots[location.hash.slice(1)])',
      'for (const [name, component] of Object.entries({ MColumn, MRow, MGrid, MCard, MText, MButton, MInput, MCheckbox, MSelect, MReveal })) app.component(name, component)',
      `app.use(createMavisServices({ theme: ${theme}, appearance: '${theme === 'midnight' ? 'dark' : 'light'}' })).mount('#app')`,
      '',
    ].join('\n'),
  )
  const { build, preview } = await import('vite')
  const { default: vue } = await import('@vitejs/plugin-vue')
  await build({
    root: dir,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias: { '#mavis': join(dir, 'mavis.js') } },
    build: { outDir: join(dir, 'dist'), emptyOutDir: true, chunkSizeWarningLimit: 4096 },
  })
  const server = await preview({
    root: dir,
    logLevel: 'warn',
    build: { outDir: join(dir, 'dist') },
    preview: { host: '127.0.0.1', port: 4231, strictPort: false },
  })
  const { chromium, webkit } = await import('@playwright/test')
  try {
    const url = server.resolvedUrls.local[0]
    for (const [engineName, engine] of [
      ['chromium', chromium],
      ['webkit', webkit],
    ]) {
      const browser = await engine.launch()
      try {
        for (const { fixture, reduced } of runs()) {
          const page = await browser.newPage({ viewport: { width: 900, height: 1200 } })
          if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
          const errors = []
          let current = 'load'
          page.on('pageerror', (error) => errors.push(`step ${current}: ${error.message}`))
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning')
              errors.push(`step ${current}: ${message.text()}`)
          })
          await page.goto(`${url}#${fixture.name}`)
          for (const [index, step] of fixture.steps.entries()) {
            const where = `${fixture.name}${reduced ? ' (reduced motion)' : ''} step ${index} (${engineName})`
            current = index
            if (step.layout) {
              const deadline = Date.now() + 5000
              let failures = await webLayout(page, step.layout)
              while (failures.length && Date.now() < deadline) {
                await page.waitForTimeout(50)
                failures = await webLayout(page, step.layout)
              }
              assert.deepEqual(failures, [], where)
            } else if (step.expect) {
              const deadline = Date.now() + 5000
              let actual = await webState(page, step)
              const expected = expectation(step)
              while (JSON.stringify(actual) !== JSON.stringify(expected) && Date.now() < deadline) {
                await page.waitForTimeout(50)
                actual = await webState(page, step)
              }
              assert.deepEqual(actual, expected, where)
            } else await webStep(page, step)
          }
          assert.deepEqual(errors, [], `${fixture.name} (${engineName}) logged errors`)
          await page.close()
          report.web[`${fixture.name}${reduced ? '/reduced-motion' : ''}/${engineName}`] = 'passed'
          save()
        }
      } finally {
        await browser.close()
      }
    }
  } finally {
    await new Promise((done) => server.httpServer.close(done))
  }
  console.log(`Web conformance passed in Chromium and WebKit (${fixtures.length} fixtures).`)
}

// Each fixture once, and again with reduced motion when its steps.json asks for it.
function runs() {
  return fixtures.flatMap((fixture) => [
    { fixture, reduced: false },
    ...(fixture.reducedMotion ? [{ fixture, reduced: true }] : []),
  ])
}

// The parts of the screen a step checks: the texts as assistive technology reads them, and
// optionally headings, cards, fields and focus. A text with an accessibilityLabel is read by
// that name. A card with onClick is one button: its name is checked with "cards", not its texts.
function expectation(step) {
  return {
    texts: step.expect,
    ...(step.headings ? { headings: step.headings } : {}),
    ...(step.cards ? { cards: step.cards } : {}),
    ...(step.fields ? { fields: step.fields } : {}),
    ...('focused' in step ? { focused: step.focused } : {}),
  }
}

async function webStep(page, step) {
  if (step.click) {
    // "force" clicks a control that is expected not to respond: disabled, or loading.
    await page
      .getByRole('button', { name: step.click, exact: true })
      .nth(step.nth ?? 0)
      .click({ timeout: 5000, force: Boolean(step.force) })
  } else if (step.type !== undefined || step.replace !== undefined) {
    const field = webField(page, step.type ?? step.replace)
    if (!(await field.evaluate((element) => element === document.activeElement)))
      await field.click()
    // Type at the end, or over everything for replace, like a person would.
    await field.evaluate((element, replace) => {
      element.setSelectionRange(replace ? 0 : element.value.length, element.value.length)
    }, step.replace !== undefined)
    // An empty type only puts the caret at the end; an empty replace clears the field.
    if (step.text) await page.keyboard.type(step.text)
    else if (step.replace !== undefined) await page.keyboard.press('Backspace')
  } else if (step.press) {
    // Mod is Command on Apple keyboards and Control elsewhere.
    await page.keyboard.press(
      step.press.startsWith('Mod+')
        ? `ControlOrMeta+${webKeys[step.press.slice(4)] ?? step.press.slice(4)}`
        : (webKeys[step.press] ?? step.press),
    )
  } else if (step.toggle) {
    await page.getByRole('checkbox', { name: step.toggle, exact: true }).click()
  } else if (step.choose) {
    await webField(page, step.choose).click()
    await page.getByRole('option', { name: step.option, exact: true }).click()
    await page
      .locator('dialog[open]')
      .waitFor({ state: 'detached', timeout: 5000 })
      .catch(() => {})
    await page.waitForFunction(() => !document.querySelector('dialog[open]'))
  } else if (step.focus) {
    await page.getByRole('group', { name: step.focus, exact: true }).focus()
  } else throw new Error(`Unknown step ${JSON.stringify(step)}`)
}

// Where each element a step's layout relations name is, in CSS pixels.
async function webLayout(page, relations) {
  const frames = await page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => {
          const rect = document.getElementById(id)?.getBoundingClientRect()
          return [id, rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height }]
        }),
      ),
    [...new Set(relations.flatMap(layoutIds))],
  )
  return layoutFailures(relations, (id) => frames[id] ?? undefined)
}

async function webState(page, step) {
  const read = await page.locator('#app .m-text').evaluateAll((elements) =>
    elements
      // Field messages and select sheets belong to their field; leaving content is hidden.
      .filter(
        (element) =>
          !element.id.endsWith('-message') &&
          !element.closest('dialog') &&
          !element.closest('[aria-hidden="true"]') &&
          !element.closest('[role="button"]'),
      )
      .map((element) => ({
        text: element.getAttribute('aria-label') ?? element.textContent,
        heading: /^H[1-6]$/.test(element.tagName),
      })),
  )
  const state = { texts: read.map((item) => item.text) }
  if (step.headings) state.headings = read.filter((item) => item.heading).map((item) => item.text)
  if (step.cards)
    state.cards = await page
      .locator('#app .m-card[role="button"]')
      .evaluateAll((elements) =>
        elements
          .filter((element) => !element.closest('[aria-hidden="true"]'))
          .map((element) => element.getAttribute('aria-label')),
      )
  if (step.fields) {
    state.fields = {}
    for (const [label, expected] of Object.entries(step.fields)) {
      const actual = await webField(page, label).evaluate((element) => {
        const ids = element.getAttribute('aria-describedby')?.split(/\s+/) ?? []
        const message = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
        if (element.type === 'checkbox')
          return {
            checked: element.getAttribute('aria-checked') === 'mixed' ? 'mixed' : element.checked,
            message,
          }
        if (element.tagName === 'BUTTON')
          return {
            value: document.getElementById(`${element.id}-value`)?.textContent ?? '',
            message,
          }
        return { value: element.value, message }
      })
      state.fields[label] = Object.fromEntries(
        Object.keys(expected).map((key) => [key, actual[key]]),
      )
    }
  }
  if ('focused' in step)
    state.focused = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body) return null
      const label = element.labels?.[0]?.textContent ?? element.getAttribute('aria-label')
      return (label ?? element.textContent).trim()
    })
  return state
}

function swiftList(items) {
  return `[${items.map(swiftString).join(', ')}]`
}

// One Swift value per relation of test/portable-native/layout.ts; a relation that places and
// sizes an element becomes two.
function swiftRelations(relations) {
  const number = (value) => (value === undefined ? 'nil' : String(value))
  const edge = (value) => (value ? `.${value}` : 'nil')
  return relations.flatMap((relation) => {
    const vertical = relation.axis === 'y'
    const inset =
      typeof relation.inset === 'number'
        ? { x: relation.inset, y: relation.inset }
        : (relation.inset ?? {})
    return [
      ...(relation.of && relation.in
        ? [
            `.place(${swiftString(relation.of)}, in: ${swiftString(relation.in)}, x: ${edge(relation.x)}, y: ${edge(relation.y)}, insetX: ${inset.x ?? 0}, insetY: ${inset.y ?? 0})`,
          ]
        : []),
      ...(relation.of && (relation.width !== undefined || relation.height !== undefined)
        ? [
            `.size(${swiftString(relation.of)}, width: ${number(relation.width)}, height: ${number(relation.height)})`,
          ]
        : []),
      ...(relation.order ? [`.order(${swiftList(relation.order)}, vertical: ${vertical})`] : []),
      ...(relation.equal
        ? [
            `.equal(${swiftList(relation.equal)}, width: ${relation.size !== 'height'}, height: ${relation.size !== 'width'})`,
          ]
        : []),
      ...(relation.gap
        ? [
            `.gap(${swiftString(relation.gap[0])}, ${swiftString(relation.gap[1])}, vertical: ${vertical}, is: ${relation.is})`,
          ]
        : []),
      ...(relation.sameRow ? [`.sameRow(${swiftList(relation.sameRow)})`] : []),
      ...(relation.nextRow
        ? [`.nextRow(${swiftString(relation.nextRow[0])}, ${swiftString(relation.nextRow[1])})`]
        : []),
    ]
  })
}

function swiftStep(step, index) {
  if (step.layout) return `layout(app, [${swiftRelations(step.layout).join(', ')}], step: ${index})`
  if (step.click) return `click(app, ${swiftString(step.click)}, ${step.nth ?? 0}, step: ${index})`
  if (step.type !== undefined)
    return `type(app, ${swiftString(step.type)}, ${swiftString(step.text)}, replace: false, step: ${index})`
  if (step.replace !== undefined)
    return `type(app, ${swiftString(step.replace)}, ${swiftString(step.text)}, replace: true, step: ${index})`
  if (step.press?.startsWith('Mod+')) {
    const key = step.press.slice(4)
    return key.length === 1
      ? `app.typeKey(${swiftString(key)}, modifierFlags: .command)`
      : `press(app, XCUIKeyboardKey${swiftKeys[key === 'Enter' ? 'Return' : key][0]}, .command, step: ${index})`
  }
  if (step.press) {
    const [key, modifiers] = swiftKeys[step.press]
    return `press(app, XCUIKeyboardKey${key}, ${modifiers}, step: ${index})`
  }
  if (step.toggle) return `field(app, ${swiftString(step.toggle)}, step: ${index}).click()`
  if (step.choose)
    return `choose(app, ${swiftString(step.choose)}, ${swiftString(step.option)}, step: ${index})`
  if (step.focus) return `focusGroup(app, ${swiftString(step.focus)}, step: ${index})`
  const fields = Object.entries(step.fields ?? {}).map(
    ([label, expected]) =>
      `(${swiftString(label)}, [${Object.entries(expected)
        .map(([key, value]) => `${swiftString(key)}: ${swiftString(String(value))}`)
        .join(', ')}])`,
  )
  const focused =
    'focused' in step
      ? step.focused === null
        ? '.some(nil)'
        : `.some(${swiftString(step.focused)})`
      : 'nil'
  const cards = step.cards ? swiftList(step.cards) : 'nil'
  return `expect(app, ${swiftList(step.expect)}, cards: ${cards}, fields: [${fields.join(', ')}], focused: ${focused}, step: ${index})`
}

// The layout relations in Swift, for both Mac runners. Frames have their origin at the top left.
function swiftLayout() {
  return `enum LayoutEdge { case start, center, end, fill }

enum LayoutRelation {
    case place(String, in: String, x: LayoutEdge?, y: LayoutEdge?, insetX: Double, insetY: Double)
    case size(String, width: Double?, height: Double?)
    case order([String], vertical: Bool)
    case equal([String], width: Bool, height: Bool)
    case gap(String, String, vertical: Bool, is: Double)
    case sameRow([String])
    case nextRow(String, String)
}

/// What does not hold, in words; empty when every relation does.
func layoutFailures(_ relations: [LayoutRelation], _ frame: (String) -> CGRect?) -> [String] {
    let tolerance = 1.5
    func near(_ a: Double, _ b: Double) -> Bool { abs(a - b) <= tolerance }
    func start(_ rect: CGRect, _ vertical: Bool) -> Double { vertical ? rect.minY : rect.minX }
    func end(_ rect: CGRect, _ vertical: Bool) -> Double { vertical ? rect.maxY : rect.maxX }
    func describe(_ rects: [CGRect]) -> String {
        rects.map { "(\\($0.minX), \\($0.minY), \\($0.width), \\($0.height))" }.joined(separator: " ")
    }
    var failures: [String] = []
    for relation in relations {
        var ids: [String]
        switch relation {
        case .place(let inner, let outer, _, _, _, _): ids = [inner, outer]
        case .size(let id, _, _): ids = [id]
        case .order(let list, _), .equal(let list, _, _), .sameRow(let list): ids = list
        case .gap(let before, let after, _, _), .nextRow(let before, let after): ids = [before, after]
        }
        let missing = ids.filter { frame($0) == nil }
        guard missing.isEmpty else {
            failures.append("\\(relation): no element with id \\(missing.joined(separator: ", "))")
            continue
        }
        let rects = ids.map { frame($0)! }
        var held = true
        switch relation {
        case .place(_, _, let x, let y, let insetX, let insetY):
            for (edge, vertical, inset) in [(x, false, insetX), (y, true, insetY)] {
                guard let edge else { continue }
                let atStart = near(start(rects[0], vertical), start(rects[1], vertical) + inset)
                let atEnd = near(end(rects[0], vertical), end(rects[1], vertical) - inset)
                let centered = near((start(rects[0], vertical) + end(rects[0], vertical)) / 2, (start(rects[1], vertical) + end(rects[1], vertical)) / 2)
                switch edge {
                case .start: held = held && atStart
                case .end: held = held && atEnd
                case .fill: held = held && atStart && atEnd
                case .center: held = held && centered
                }
            }
        case .size(_, let width, let height):
            held = (width == nil || near(rects[0].width, width!)) && (height == nil || near(rects[0].height, height!))
        case .order(_, let vertical):
            held = zip(rects, rects.dropFirst()).allSatisfy { end($0, vertical) <= start($1, vertical) + tolerance }
        case .equal(_, let width, let height):
            held = rects.allSatisfy { (!width || near($0.width, rects[0].width)) && (!height || near($0.height, rects[0].height)) }
        case .gap(_, _, let vertical, let expected):
            held = near(start(rects[1], vertical) - end(rects[0], vertical), expected)
        case .sameRow:
            held = rects.allSatisfy { a in rects.allSatisfy { b in a.minY < b.maxY - tolerance && b.minY < a.maxY - tolerance } }
        case .nextRow:
            held = rects[1].minY >= rects[0].maxY - tolerance
        }
        if !held { failures.append("\\(relation): \\(describe(rects))") }
    }
    return failures
}
`
}

async function runNativeScript(platform) {
  assert.ok(['ios', 'android'].includes(platform), '--nativescript ios or --nativescript android')
  const device =
    platform === 'ios' ? process.env.MAVIS_IOS_SIMULATOR : process.env.MAVIS_ANDROID_DEVICE
  assert.ok(device, `Set ${platform === 'ios' ? 'MAVIS_IOS_SIMULATOR' : 'MAVIS_ANDROID_DEVICE'}.`)
  const dir = join(artifacts, 'nativescript')
  const id = 'org.nativescript.portablecheck'
  // The creator's NativeScript app, with this checkout's packages.
  const { projectFiles } = await import(
    pathToFileURL(join(root, 'packages/create-mavis/src/scaffold.mjs'))
  )
  const { files } = await projectFiles({ name: 'portable-check', targets: 'native,macos' })
  const packages = JSON.parse(
    readFileSync(join(root, 'artifacts/release/packages/manifest.json'), 'utf8'),
  )
  const tarball = (name) =>
    `file:${join(root, 'artifacts/release/packages', packages.find((p) => p.name === name).filename)}`
  mkdirSync(dir, { recursive: true })
  for (const [file, text] of files) {
    if (!file.startsWith('apps/mobile/') || file.startsWith('apps/mobile/src/')) continue
    const target = join(dir, file.slice('apps/mobile/'.length))
    mkdirSync(join(target, '..'), { recursive: true })
    let content = text
    if (file === 'apps/mobile/package.json') {
      const pkg = JSON.parse(text)
      for (const name of ['@getcortexlabs/mavis', '@getcortexlabs/mavis-core'])
        pkg.dependencies[name] = tarball(name)
      content = `${JSON.stringify(pkg, null, 2)}\n`
    }
    writeFileSync(target, content)
  }
  const installed = join(dir, 'node_modules/.mavis-install')
  const stamp = createHash('sha256')
    .update(readFileSync(join(dir, 'package.json')))
    .update(packages.map((p) => p.integrity ?? p.shasum ?? p.filename).join())
    .digest('hex')
  if (!existsSync(installed) || readFileSync(installed, 'utf8') !== stamp) {
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit' })
    writeFileSync(installed, stamp)
  }
  rmSync(join(dir, 'src'), { recursive: true, force: true })
  mkdirSync(join(dir, 'src/fixtures'), { recursive: true })
  for (const file of ['App.vue', 'app.ts', 'probe.ts', 'layout.ts'])
    cpSync(join(root, 'test/portable-native', file), join(dir, 'src', file))
  // mavis.ts is what #mavis resolves to in this host (see the template's webpack.config.js).
  for (const file of ['app.css', 'env.d.ts', 'mavis.ts'])
    cpSync(join(root, 'packages/create-mavis/templates/mobile/src', file), join(dir, 'src', file))
  for (const fixture of fixtures) {
    const target = join(dir, 'src/fixtures', fixture.name)
    mkdirSync(target, { recursive: true })
    for (const [file, text] of hosted(fixture, fixture.output.native))
      writeFileSync(join(target, file), text)
  }
  writeFileSync(
    join(dir, 'src/fixtures.ts'),
    [
      ...fixtures.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      `export const fixtures = [`,
      ...fixtures.map(
        (fixture) =>
          `  { name: ${JSON.stringify(fixture.name)}, component: ${pascal(fixture.name)}, steps: ${JSON.stringify(fixture.steps)} },`,
      ),
      ']',
      '',
    ].join('\n'),
  )
  const run = (command, args) =>
    execFileSync(command, args, { cwd: dir, stdio: 'inherit', env: process.env })
  const read = (command, args) =>
    execFileSync(command, args, { cwd: dir, encoding: 'utf8', env: process.env })
  run('ns', ['build', platform, ...(platform === 'ios' ? ['--emulator'] : []), '--no-hmr'])
  let outcome
  const poll = async (get) => {
    const deadline = Date.now() + 10 * 60 * 1000
    while (Date.now() < deadline) {
      await new Promise((done) => setTimeout(done, 2000))
      try {
        outcome = JSON.parse(get())
        if (outcome.done) return
      } catch {}
    }
    throw new Error(`No complete NativeScript report: ${JSON.stringify(outcome)}`)
  }
  if (platform === 'ios') {
    const products = join(dir, 'platforms/ios/build/Debug-iphonesimulator')
    const app = join(
      products,
      readdirSync(products).find((name) => name.endsWith('.app')),
    )
    try {
      read('xcrun', ['simctl', 'boot', device])
    } catch {}
    run('xcrun', ['simctl', 'install', device, app])
    try {
      read('xcrun', ['simctl', 'terminate', device, id])
    } catch {}
    const data = read('xcrun', ['simctl', 'get_app_container', device, id, 'data']).trim()
    rmSync(join(data, 'Documents/portable-report.json'), { force: true })
    run('xcrun', ['simctl', 'launch', device, id])
    await poll(() => readFileSync(join(data, 'Documents/portable-report.json'), 'utf8'))
    try {
      read('xcrun', ['simctl', 'terminate', device, id])
    } catch {}
  } else {
    const adb = (...args) => read('adb', ['-s', device, ...args])
    run('adb', [
      '-s',
      device,
      'install',
      '-r',
      join(dir, 'platforms/android/app/build/outputs/apk/debug/app-debug.apk'),
    ])
    adb('shell', 'am', 'force-stop', id)
    adb('shell', 'run-as', id, 'rm', '-f', 'files/portable-report.json')
    adb('shell', 'am', 'start', '-W', '-n', `${id}/com.tns.NativeScriptActivity`)
    await poll(() => adb('exec-out', 'run-as', id, 'cat', 'files/portable-report.json'))
    adb('shell', 'am', 'force-stop', id)
  }
  outcome.platform = platform
  writeFileSync(join(artifacts, `nativescript-${platform}.json`), JSON.stringify(outcome, null, 2))
  const failed = outcome.results.filter((result) => !result.passed)
  if (failed.length) throw new Error(`NativeScript ${platform}: ${JSON.stringify(failed, null, 2)}`)
  report.nativescript = { ...report.nativescript, [platform]: 'passed' }
  console.log(`NativeScript conformance passed on ${platform} (${fixtures.length} fixtures).`)
}

// Every fixture's generated Swift in one module, each in its own namespace.
function writeSwift(folder) {
  for (const fixture of fixtures)
    for (const [file, text] of fixture.output.swift) {
      // Runtime and theme tokens are identical for every fixture; only some need the slots.
      const shared = [
        'MavisRuntime.swift',
        'MavisTokens.swift',
        'MavisControls.swift',
        'MavisSlots.swift',
      ].includes(file)
      writeFileSync(join(folder, shared ? file : `${pascal(fixture.name)}${file}`), text)
    }
}

function fixtureCases() {
  return fixtures
    .map(
      (fixture) =>
        `        case ${swiftString(fixture.name)}: ${pascal(fixture.name)}Fixture.${fixture.root}()`,
    )
    .join('\n')
}

// What the offscreen runner replays: nothing that needs a keyboard, the pointer or focus. A step
// for a hardware keyboard runs as the touch equivalent it names for NativeScript.
function offscreenSteps(fixture) {
  const replayable = (step) =>
    Boolean(step.layout || step.click || (step.expect && !step.fields && !('focused' in step)))
  const steps = fixture.steps
    .map((step, index) => ({
      step: replayable(step) || !('native' in step) ? step : step.native,
      index,
    }))
    .filter(({ step }) => step)
  return steps.every(({ step }) => replayable(step)) ? steps : null
}

function runOffscreen() {
  assert.equal(process.platform, 'darwin', '--offscreen needs macOS and Swift.')
  const dir = join(artifacts, 'offscreen')
  const sources = join(dir, 'Sources/Offscreen')
  // The build folder stays: Swift rebuilds only what changed.
  rmSync(join(dir, 'Sources'), { recursive: true, force: true })
  mkdirSync(sources, { recursive: true })
  writeSwift(sources)
  const replayed = runs().filter(({ fixture }) => offscreenSteps(fixture))
  const skipped = fixtures.filter((fixture) => !offscreenSteps(fixture))
  writeFileSync(
    join(dir, 'Package.swift'),
    `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Offscreen",
    platforms: [.macOS(.v14)],
    dependencies: [.package(url: ${JSON.stringify(joltSwift.url)}, exact: ${JSON.stringify(joltSwift.version)})],
    targets: [
        .executableTarget(name: "Offscreen", dependencies: [.product(name: "JoltSwiftUI", package: "jolt-swift")]),
    ]
)
`,
  )
  const sessions = replayed.map(({ fixture, reduced }) => {
    const steps = offscreenSteps(fixture).map(({ step, index }) =>
      step.expect
        ? `try expect(app, ${swiftList(step.expect)}, headings: ${step.headings ? swiftList(step.headings) : 'nil'}, cards: ${step.cards ? swiftList(step.cards) : 'nil'}, step: ${index})`
        : `try ${swiftStep(step, index)}`,
    )
    return `    replay(${swiftString(fixture.name)}, reducedMotion: ${reduced}) { app in
${steps.map((line) => `        ${line}`).join('\n')}
    }`
  })
  writeFileSync(
    join(sources, 'main.swift'),
    `import AppKit
import SwiftUI
import JoltSwiftUI

// Generated from test/portable/*/steps.json. Each fixture is laid out in a hosting view that is
// never put on screen, and read through the accessibility tree SwiftUI builds for it: the same
// elements, names and frames a UI test sees.

struct FixtureRoot: View {
    let name: String
    let reducedMotion: Bool

    var body: some View {
        fixture.joltReduceMotion(reducedMotion)
    }

    @ViewBuilder private var fixture: some View {
        switch name {
${fixtureCases()}
        default: Text(verbatim: "Unknown fixture")
        }
    }
}

struct Failure: Error { let message: String }

@MainActor final class Session {
    private let host: NSHostingView<AnyView>
    private let window: NSWindow

    // As wide as the conformance window, and tall enough to hold a whole fixture: nothing
    // scrolls here, so every control can be hit where it is.
    private static let page = CGSize(width: 800, height: 3000)

    init(_ fixture: String, reducedMotion: Bool) {
        // The page the conformance app shows, with the same padding.
        let page = ScrollView {
            FixtureRoot(name: fixture, reducedMotion: reducedMotion)
                .padding(24)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(MavisTokens.background)
        .frame(width: Self.page.width, height: Self.page.height)
        host = NSHostingView(rootView: AnyView(page))
        host.frame = CGRect(origin: .zero, size: Self.page)
        window = NSWindow(contentRect: host.frame, styleMask: [.borderless], backing: .buffered, defer: true)
        window.contentView = host
        settle()
    }

    func settle(_ seconds: TimeInterval = 0.05) {
        host.layoutSubtreeIfNeeded()
        RunLoop.current.run(until: Date().addingTimeInterval(seconds))
    }

    private func read(_ node: NSObject, _ key: String) -> Any? {
        node.responds(to: NSSelectorFromString(key)) ? node.value(forKey: key) : nil
    }

    private func nodes(_ node: NSObject, into found: inout [NSObject]) {
        for child in (read(node, "accessibilityChildren") as? [Any]) ?? [] {
            guard let child = child as? NSObject else { continue }
            found.append(child)
            nodes(child, into: &found)
        }
    }

    private func elements(_ roles: [String]) -> [NSObject] {
        var found: [NSObject] = []
        nodes(host, into: &found)
        return found.filter { roles.contains((read($0, "accessibilityRole") as? String) ?? "") }
    }

    private func string(_ node: NSObject, _ key: String) -> String { (read(node, key) as? String) ?? "" }

    private func text(_ node: NSObject) -> String {
        let value = string(node, "accessibilityValue")
        return value.isEmpty ? string(node, "accessibilityLabel") : value
    }

    private func name(_ node: NSObject) -> String {
        let label = string(node, "accessibilityLabel")
        return label.isEmpty ? string(node, "accessibilityTitle") : label
    }

    /// Field messages belong to their field, as in the other runners.
    private func spoken(_ roles: [String]) -> [String] {
        elements(roles).filter { !string($0, "accessibilityIdentifier").hasPrefix("mavis-message:") }.map(text)
    }

    var texts: [String] { spoken(["AXStaticText", "AXHeading"]) }
    var headings: [String] { spoken(["AXHeading"]) }
    var cards: [String] {
        elements(["AXButton"]).filter { string($0, "accessibilityIdentifier") == "mavis-card" }.map(name)
    }

    func button(_ name: String, _ nth: Int) -> NSObject? {
        let matches = elements(["AXButton"]).filter { self.name($0) == name }
        return nth < matches.count ? matches[nth] : nil
    }

    /// What a UI test calls hittable: the accessibility hit test at the element's center
    /// returns the element or something inside it. Nil when it does; otherwise what was found.
    func obstruction(_ node: NSObject) -> String? {
        guard let rect = (read(node, "accessibilityFrame") as? NSValue)?.rectValue else { return "no frame" }
        let center = NSPoint(x: rect.midX, y: rect.midY)
        guard window.frame.contains(center) else { return "a center outside the offscreen page" }
        let hit = host.accessibilityHitTest(center) as? NSObject
        var current = hit
        while let candidate = current {
            if candidate === node { return nil }
            current = read(candidate, "accessibilityParent") as? NSObject
        }
        guard let hit else { return "nothing" }
        return "\\(string(hit, "accessibilityRole")) \\(string(hit, "accessibilityIdentifier"))"
    }

    /// Where the element with this id is, with the origin at the top left. A text, button or
    /// field is one element; a container is the union of the two corner points that carry its id.
    func frame(_ id: String) -> CGRect? {
        var found: [NSObject] = []
        nodes(host, into: &found)
        let rects = found
            .filter { string($0, "accessibilityIdentifier") == id }
            .compactMap { (read($0, "accessibilityFrame") as? NSValue)?.rectValue }
        guard let first = rects.first else { return nil }
        let rect = rects.reduce(first) { $0.union($1) }
        return CGRect(x: rect.minX - window.frame.minX, y: window.frame.maxY - rect.maxY, width: rect.width, height: rect.height)
    }
}

@MainActor func until(_ app: Session, _ done: () -> Bool) {
    let deadline = Date().addingTimeInterval(5)
    while !done() && Date() < deadline { app.settle(0.05) }
}

@MainActor func expect(_ app: Session, _ expected: [String], headings: [String]?, cards: [String]?, step: Int) throws {
    until(app) { app.texts == expected && (headings == nil || app.headings == headings!) && (cards == nil || app.cards == cards!) }
    guard app.texts == expected else { throw Failure(message: "step \\(step): texts \\(app.texts), expected \\(expected)") }
    if let headings, app.headings != headings { throw Failure(message: "step \\(step): headings \\(app.headings), expected \\(headings)") }
    if let cards, app.cards != cards { throw Failure(message: "step \\(step): cards \\(app.cards), expected \\(cards)") }
}

@MainActor func click(_ app: Session, _ name: String, _ nth: Int, step: Int) throws {
    until(app) { app.button(name, nth) != nil }
    guard let button = app.button(name, nth) else { throw Failure(message: "step \\(step): no button \\(name)") }
    if let found = app.obstruction(button) {
        throw Failure(message: "step \\(step): button \\(name) is not hittable: the hit test at its center finds \\(found)")
    }
    button.perform(NSSelectorFromString("accessibilityPerformPress"))
    app.settle()
}

@MainActor func layout(_ app: Session, _ relations: [LayoutRelation], step: Int) throws {
    until(app) { layoutFailures(relations, app.frame).isEmpty }
    let failures = layoutFailures(relations, app.frame)
    guard failures.isEmpty else { throw Failure(message: "step \\(step): \\(failures.joined(separator: "; "))") }
}

@MainActor var failed = 0

@MainActor func replay(_ fixture: String, reducedMotion: Bool, _ steps: (Session) throws -> Void) {
    let title = fixture + (reducedMotion ? " (reduced motion)" : "")
    do {
        try steps(Session(fixture, reducedMotion: reducedMotion))
        print("passed  \\(title)")
    } catch {
        failed += 1
        print("FAILED  \\(title): \\((error as? Failure)?.message ?? String(describing: error))")
    }
}

MainActor.assumeIsolated {
    // Before any view exists: containers mark their corners for the layout steps.
    setenv("MAVIS_TEST_IDENTIFIERS", "1", 1)
    let app = NSApplication.shared
    // No Dock icon, no menu bar, no activation: nothing of this process reaches the screen.
    app.setActivationPolicy(.prohibited)
    // What an assistive client sets; SwiftUI builds its accessibility tree from then on.
    (app as NSObject).accessibilitySetValue(true, forAttribute: NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface"))
${sessions.join('\n')}
    exit(failed == 0 ? 0 : 1)
}

${swiftLayout()}`,
  )
  const run = (command, args) =>
    execFileSync(command, args, { cwd: dir, stdio: 'inherit', env: process.env })
  run('swift', ['build'])
  const names = (list) => list.map((fixture) => fixture.name).join(', ')
  try {
    run(join(dir, '.build/debug/Offscreen'), [])
    report.offscreen = {
      passed: replayed.map(
        ({ fixture, reduced }) => `${fixture.name}${reduced ? '/reduced-motion' : ''}`,
      ),
      skipped: skipped.map((fixture) => fixture.name),
    }
  } catch (error) {
    report.offscreen = 'failed; see the output above'
    save()
    throw error
  }
  console.log(
    `SwiftUI conformance passed offscreen (${replayed.length} sessions).${skipped.length ? ` Not replayed, they type or move focus: ${names(skipped)}.` : ''}`,
  )
}

function runNative() {
  assert.equal(process.platform, 'darwin', '--native needs macOS and Xcode.')
  const dir = join(artifacts, 'native')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, 'Sources'), { recursive: true })
  mkdirSync(join(dir, 'UITests'), { recursive: true })
  writeSwift(join(dir, 'Sources'))
  writeFileSync(
    join(dir, 'Sources', 'ConformanceApp.swift'),
    `import SwiftUI
import JoltSwiftUI

@main
struct ConformanceApp: App {
    var body: some Scene {
        WindowGroup("Mavis conformance") {
            ScrollView {
                FixtureRoot()
                    .padding(24)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(MavisTokens.background)
            // Shorter than a laptop screen: taller fixtures scroll, as they would for a person.
            .frame(minWidth: 760, minHeight: 600)
        }
        .defaultSize(width: 800, height: 900)
    }
}

struct FixtureRoot: View {
    var body: some View {
        // The app asks Jolt for reduced motion, as the system setting would.
        fixture.joltReduceMotion(ProcessInfo.processInfo.environment["MAVIS_REDUCE_MOTION"] == "1")
    }

    @ViewBuilder private var fixture: some View {
        switch ProcessInfo.processInfo.environment["MAVIS_FIXTURE"] ?? "" {
${fixtureCases()}
        default: Text(verbatim: "Unknown fixture")
        }
    }
}
`,
  )
  const tests = runs().map(({ fixture, reduced }) => {
    const lines = fixture.steps.map((step, index) => `        ${swiftStep(step, index)}`)
    return `    @MainActor func test${pascal(fixture.name)}${reduced ? 'ReducedMotion' : ''}() {
        let app = launch(${swiftString(fixture.name)}, reducedMotion: ${reduced})
${lines.join('\n')}
        app.terminate()
    }`
  })
  writeFileSync(
    join(dir, 'UITests', 'ConformanceUITests.swift'),
    `import XCTest

/// Generated from test/portable/*/steps.json. Each step acts on the screen, compares every visible
/// text or checks where elements are. Headings are not told apart from other texts here.
final class ConformanceUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

${tests.join('\n\n')}

    @MainActor private func launch(_ fixture: String, reducedMotion: Bool) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["MAVIS_FIXTURE"] = fixture
        // Containers mark their corners with their id, for the layout steps.
        app.launchEnvironment["MAVIS_TEST_IDENTIFIERS"] = "1"
        // The app asks Jolt for reduced motion, as the system setting would.
        if reducedMotion { app.launchEnvironment["MAVIS_REDUCE_MOTION"] = "1" }
        app.launch()
        XCTAssertTrue(app.windows.firstMatch.waitForExistence(timeout: 10), "\\(fixture) window")
        return app
    }

    @MainActor private func text(_ element: XCUIElement) -> String {
        let value = element.value as? String ?? ""
        return value.isEmpty ? element.label : value
    }

    @MainActor private func texts(_ app: XCUIApplication) -> [String] {
        // The window title is also a static text; read only the fixture's content.
        // Field messages belong to their field and are checked with it.
        app.windows.firstMatch.scrollViews.firstMatch.staticTexts.allElementsBoundByIndex
            .filter { !$0.identifier.hasPrefix("mavis-message:") }
            .map(text)
    }

    private static let fieldTypes: [XCUIElement.ElementType] = [.textField, .secureTextField, .textView, .checkBox, .popUpButton]

    @MainActor private func find(_ app: XCUIApplication, _ label: String) -> XCUIElement? {
        let window = app.windows.firstMatch
        for type in Self.fieldTypes {
            let match = window.descendants(matching: type).matching(NSPredicate(format: "label == %@", label)).firstMatch
            if match.exists { return match }
        }
        return nil
    }

    @MainActor private func field(_ app: XCUIApplication, _ label: String, step: Int, file: StaticString = #filePath, line: UInt = #line) -> XCUIElement {
        let deadline = Date().addingTimeInterval(5)
        while Date() < deadline {
            if let match = find(app, label) {
                reveal(app, match)
                return match
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        XCTFail("step \\(step): field \\(label)", file: file, line: line)
        return app.windows.firstMatch
    }

    /// Scrolls the window's content until a control below or above the visible part can be clicked.
    @MainActor private func reveal(_ app: XCUIApplication, _ element: XCUIElement) {
        let scroll = app.windows.firstMatch.scrollViews.firstMatch
        // Fully inside the visible part, away from the window's edge.
        func visible() -> Bool {
            let area = scroll.frame.insetBy(dx: 0, dy: 24)
            return element.isHittable && (element.frame.height > area.height || (element.frame.minY >= area.minY && element.frame.maxY <= area.maxY))
        }
        // Another app may have come to the front while the session runs.
        if !element.isHittable { app.activate() }
        var direction: CGFloat = -1
        for _ in 0..<12 where !visible() {
            let before = abs(element.frame.midY - scroll.frame.midY)
            scroll.scroll(byDeltaX: 0, deltaY: direction * (element.frame.midY > scroll.frame.midY ? 120 : -120))
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
            if abs(element.frame.midY - scroll.frame.midY) > before { direction = -direction }
        }
    }

    @MainActor private func focused(_ app: XCUIApplication) -> String? {
        let match = app.windows.firstMatch.descendants(matching: .any).matching(NSPredicate(format: "hasKeyboardFocus == true")).firstMatch
        guard match.exists else { return nil }
        return match.label.isEmpty ? text(match) : match.label
    }

    @MainActor private func fieldState(_ app: XCUIApplication, _ label: String, _ keys: [String]) -> [String: String] {
        guard let element = find(app, label) else { return ["missing": "true"] }
        let message = identified(app.windows.firstMatch.staticTexts, "mavis-message:" + label).firstMatch
        var state: [String: String] = [:]
        for key in keys {
            switch key {
            case "checked":
                // NSControl.StateValue: on 1, off 0, mixed -1.
                let value = (element.value as? NSNumber)?.intValue
                state[key] = value == -1 ? "mixed" : value == 1 ? "true" : value == 0 ? "false" : "unknown"
            case "message":
                state[key] = message.exists ? text(message) : ""
            default:
                state[key] = element.value as? String ?? ""
            }
        }
        return state
    }

    /// Cards with onClick, by the name assistive technology reads.
    @MainActor private func cards(_ app: XCUIApplication) -> [String] {
        identified(app.windows.firstMatch.scrollViews.firstMatch.buttons, "mavis-card").allElementsBoundByIndex.map(\\.label)
    }

    @MainActor private func expect(_ app: XCUIApplication, _ expected: [String], cards expectedCards: [String]?, fields: [(String, [String: String])], focused expectedFocus: String??, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let deadline = Date().addingTimeInterval(5)
        func matches() -> Bool {
            texts(app) == expected
                && (expectedCards == nil || cards(app) == expectedCards!)
                && fields.allSatisfy { fieldState(app, $0.0, Array($0.1.keys)) == $0.1 }
                && (expectedFocus == nil || focused(app) == expectedFocus!)
        }
        while !matches() && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        XCTAssertEqual(texts(app), expected, "step \\(step)", file: file, line: line)
        if let expectedCards {
            XCTAssertEqual(cards(app), expectedCards, "step \\(step): cards", file: file, line: line)
        }
        for (label, state) in fields {
            XCTAssertEqual(fieldState(app, label, Array(state.keys)), state, "step \\(step): \\(label)", file: file, line: line)
        }
        if let expectedFocus {
            XCTAssertEqual(focused(app), expectedFocus, "step \\(step): focus", file: file, line: line)
        }
    }

    @MainActor private func layout(_ app: XCUIApplication, _ relations: [LayoutRelation], step: Int, file: StaticString = #filePath, line: UInt = #line) {
        // A text, button or field is one element; a container is the union of the two corner
        // points that carry its id.
        func frame(_ id: String) -> CGRect? {
            let frames = identified(app.windows.firstMatch.descendants(matching: .any), id).allElementsBoundByIndex.map(\\.frame)
            return frames.first.map { frames.reduce($0) { $0.union($1) } }
        }
        let deadline = Date().addingTimeInterval(5)
        var failures = layoutFailures(relations, frame)
        while !failures.isEmpty && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
            failures = layoutFailures(relations, frame)
        }
        XCTAssertEqual(failures, [], "step \\(step)", file: file, line: line)
    }

    /// Elements whose identifier is exactly this one. matching(identifier:) also matches an
    /// element whose label or title is the same text.
    @MainActor private func identified(_ query: XCUIElementQuery, _ id: String) -> XCUIElementQuery {
        query.matching(NSPredicate(format: "identifier == %@", id))
    }

    @MainActor private func hasFocus(_ element: XCUIElement) -> Bool {
        (element.value(forKey: "hasKeyboardFocus") as? Bool) ?? false
    }

    @MainActor private func type(_ app: XCUIApplication, _ label: String, _ text: String, replace: Bool, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let element = field(app, label, step: step, file: file, line: line)
        if !hasFocus(element) { element.click() }
        if replace {
            element.typeKey("a", modifierFlags: .command)
        } else {
            // Like the Web steps: continue at the end of the text.
            element.typeKey(element.elementType == .textView ? .downArrow : .rightArrow, modifierFlags: .command)
        }
        // An empty type only puts the caret at the end; an empty replace clears the field.
        if text.isEmpty && replace { element.typeKey(.delete, modifierFlags: []) }
        // XCUITest's typeText drops some keys on macOS (a lowercase c here); typeKey does not.
        for character in text {
            if character.isASCII { element.typeKey(String(character), modifierFlags: []) } else { element.typeText(String(character)) }
        }
    }

    @MainActor private func press(_ app: XCUIApplication, _ key: XCUIKeyboardKey, _ modifiers: XCUIElement.KeyModifierFlags, step: Int) {
        app.windows.firstMatch.typeKey(key, modifierFlags: modifiers)
    }

    @MainActor private func choose(_ app: XCUIApplication, _ label: String, _ option: String, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        field(app, label, step: step, file: file, line: line).click()
        let item = app.menuItems[option]
        XCTAssertTrue(item.waitForExistence(timeout: 5), "step \\(step): option \\(option)", file: file, line: line)
        item.click()
    }

    @MainActor private func focusGroup(_ app: XCUIApplication, _ label: String, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let group = app.windows.firstMatch.descendants(matching: .any).matching(NSPredicate(format: "label == %@ AND elementType == %d", label, XCUIElement.ElementType.group.rawValue)).firstMatch
        XCTAssertTrue(group.waitForExistence(timeout: 5), "step \\(step): group \\(label)", file: file, line: line)
        reveal(app, group)
        // The stack's own padding, not a row's button.
        group.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.01)).click()
    }

    @MainActor private func click(_ app: XCUIApplication, _ name: String, _ nth: Int, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let matches = app.windows.firstMatch.buttons.matching(NSPredicate(format: "label == %@ OR title == %@", name, name))
        let button = matches.element(boundBy: nth)
        XCTAssertTrue(button.waitForExistence(timeout: 5), "step \\(step): button \\(name)", file: file, line: line)
        reveal(app, button)
        button.click()
    }
}

${swiftLayout()}`,
  )
  writeFileSync(
    join(dir, 'project.rb'),
    `require 'xcodeproj'
root = File.expand_path(__dir__)
project = Xcodeproj::Project.new(File.join(root, 'PortableConformance.xcodeproj'))
app = project.new_target(:application, 'PortableConformance', :osx, '14.0')
tests = project.new_target(:ui_test_bundle, 'PortableConformanceUITests', :osx, '14.0')
sources = Dir.children(File.join(root, 'Sources')).sort.map { |name| project.main_group.new_file("Sources/#{name}") }
app.add_file_references(sources)
tests.add_file_references([project.main_group.new_file('UITests/ConformanceUITests.swift')])
tests.add_dependency(app)
# JoltSwiftUI, the same exact pin as the starter's Package.swift.
jolt = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
jolt.repositoryURL = ${JSON.stringify(joltSwift.url)}
jolt.requirement = { 'kind' => 'exactVersion', 'version' => ${JSON.stringify(joltSwift.version)} }
project.root_object.package_references << jolt
product = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
product.package = jolt
product.product_name = 'JoltSwiftUI'
app.package_product_dependencies << product
linked = project.new(Xcodeproj::Project::Object::PBXBuildFile)
linked.product_ref = product
app.frameworks_build_phase.files << linked
[app, tests].each do |target|
  target.build_configurations.each do |config|
    config.build_settings.merge!({
      'SWIFT_VERSION' => '5.0', 'GENERATE_INFOPLIST_FILE' => 'YES', 'MACOSX_DEPLOYMENT_TARGET' => '14.0',
      'CODE_SIGNING_ALLOWED' => 'YES', 'CODE_SIGN_IDENTITY' => '-', 'ENABLE_HARDENED_RUNTIME' => 'NO',
      'PRODUCT_BUNDLE_IDENTIFIER' => "com.getcortexlabs.mavis.#{target.name.downcase}",
    })
    config.build_settings['TEST_TARGET_NAME'] = app.name if target == tests
  end
end
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_test_target(tests)
scheme.set_launch_target(app)
# MAVIS_KEEP_RECORDINGS=1 keeps each session's screen recording in results.xcresult when it passes.
if ENV['MAVIS_KEEP_RECORDINGS']
  scheme.test_action.xml_element.attributes['systemAttachmentLifetime'] = 'keepAlways'
  scheme.test_action.xml_element.attributes['preferredScreenCaptureFormat'] = 'screenRecording'
end
scheme.save_as(project.path, 'PortableConformance', true)
project.save
`,
  )
  const run = (command, args) =>
    execFileSync(command, args, { cwd: dir, stdio: 'inherit', env: process.env })
  run(process.env.MAVIS_RUBY ?? 'ruby', ['project.rb'])
  try {
    run('xcodebuild', [
      '-project',
      'PortableConformance.xcodeproj',
      '-scheme',
      'PortableConformance',
      '-destination',
      'platform=macOS',
      '-derivedDataPath',
      'DerivedData',
      '-resultBundlePath',
      'results.xcresult',
      '-parallel-testing-enabled',
      'NO',
      'test',
    ])
    report.native = Object.fromEntries(
      runs().map(({ fixture, reduced }) => [
        `${fixture.name}${reduced ? '/reduced-motion' : ''}`,
        'passed',
      ]),
    )
  } catch (error) {
    report.native = 'failed; see artifacts/portable/native/results.xcresult'
    save()
    throw error
  }
  console.log(`SwiftUI conformance passed on macOS (${fixtures.length} fixtures).`)
}
