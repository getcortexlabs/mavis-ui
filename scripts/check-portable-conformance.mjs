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
// MAVIS_SNAPSHOTS=<folder> saves what the page shows after each step there as <fixture>-<n>.png,
// the top MAVIS_SNAPSHOT_HEIGHT points of it (1000 by default): a look at the views without a window.
//
// --nativescript runs the generated NativeScript Vue on a simulator or emulator. Steps that need
// a hardware keyboard name their touch equivalent with "native" (null skips the step).
//
// A fixture whose root is an MScreen is hosted as it is, filling the window; any other is put on
// a scrolling page with padding. "mavis-window" in a layout relation is the part of the window
// a screen gets for its content, inside the title bar or the system bars. Three steps beside the
// texts and layout: { "scroll": id, "by": points } scrolls a screen's content down,
// { "paint": id, "is": token } checks that the color shows through at the middle of the element:
// a theme color named by the token, or a hex color, and { "window": width } makes the window or viewport that wide,
// keeping its height. A simulator or emulator cannot change its width, so window steps and the
// layout that depends on them name "native": null.
//
// { "adjust": label, "key": "ArrowRight" } presses a key on the divider of the MResizablePanels
// with that label; the offscreen runner presses no keys and runs an arrow as VoiceOver's
// increment (ArrowRight, ArrowDown) or decrement (ArrowLeft, ArrowUp) of a left-to-right divider.
// { "drag": label, "x": points, "y": points } drags that divider with the pointer.
// { "toggle": label } activates the checkbox, switch, radio or segment with that name, and
// { "adjust": label, "key": "ArrowRight" } also moves the slider with that name one step; the
// offscreen runner does both through the control's own accessibility actions. NativeScript sets
// the native switch and slider the same way.
// An expect step can name what the Mac shows instead with "macos" (MPlatform shows other content
// there), as "native" does for NativeScript. "desktop": true in a steps.json marks a fixture
// whose steps need a hardware keyboard or a pointer throughout: only the Web and XCUITest run it.
// "knownWebErrors" in a steps.json lists the console errors of a known defect of the Web renderer,
// each by a part of its text: the run goes on past them and still fails on any other.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
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
const { compileProject, isScreen } = await import(pathToFileURL(join(compilerDir, 'index.mjs')))
const { swiftString, joltSwift, themeTokens } = await import(
  pathToFileURL(join(compilerDir, 'emit-swift.mjs'))
)
const { swiftBreakpoint } = await import(pathToFileURL(join(compilerDir, 'components/stack.mjs')))
const artifacts = join(root, 'artifacts/portable')
mkdirSync(artifacts, { recursive: true })
// The Lucide font of MIcon, as the starter's Mac app carries it.
const fonts = join(root, 'packages/create-mavis/templates/macos/native/Sources/MavisDesktop/Fonts')
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
  Home: ['.home', '[]'],
  End: ['.end', '[]'],
  'Shift+ArrowLeft': ['.leftArrow', '.shift'],
  'Shift+ArrowRight': ['.rightArrow', '.shift'],
  'Shift+ArrowUp': ['.upArrow', '.shift'],
  'Shift+ArrowDown': ['.downArrow', '.shift'],
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
const core = await import('@getcortexlabs/mavis-core')
// What a paint step expects, as red, green and blue from 0 to 255: a color of the run's theme
// (surface), of a theme a provider scopes (midnight.surface), or a hex color.
const themeColor = (token) => {
  const [named, color] = token.includes('.') ? token.split('.') : [theme, token]
  const hex = /^#[0-9a-f]{6}$/i.test(token) ? token : core[named]?.colors?.[color]
  assert.ok(hex, `No theme color ${token}.`)
  return [0, 2, 4].map((at) => Number.parseInt(hex.slice(1 + at, 3 + at), 16))
}
// The components the Web host registers, as the starter does.
const webComponents = [
  'MScreen',
  'MColumn',
  'MRow',
  'MStack',
  'MGrid',
  'MBox',
  'MCard',
  'MText',
  'MSpan',
  'MSeparator',
  'MThemeProvider',
  'MPlatform',
  'MButton',
  'MInput',
  'MCheckbox',
  'MSelect',
  'MMasonry',
  'MResizablePanels',
  'MVirtualList',
  'MCollapsibleHeader',
  'MRefreshControl',
  'MIcon',
  'MSwitch',
  'MSlider',
  'MSegmentedControl',
  'MRadioGroup',
  'MNumberInput',
  'MRangeSlider',
  'MRating',
  'MPinInput',
  'MFormGroup',
  'MFormErrors',
  'MReveal',
]
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
  const opened = output.model.components.find((component) => component.name === script.root)
  fixtures.push({ name, ...script, output, files, screen: isScreen(opened.view) })
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
    // #mavis-window covers the viewport, the area a screen fills.
    '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><title>Mavis conformance</title><style>body { margin: 0 }</style></head><body><div id="mavis-window" style="position: fixed; inset: 0; pointer-events: none"></div><div id="app"></div><script type="module" src="/main.js"></script></body></html>\n',
  )
  writeFileSync(
    join(dir, 'main.js'),
    [
      "import { createApp } from 'vue'",
      "import { createMavisServices } from '@getcortexlabs/mavis-web/services'",
      `import { ${webComponents.join(', ')}, mavis, midnight } from '@getcortexlabs/mavis-web'`,
      "import '@getcortexlabs/mavis-web/style.css'",
      ...fixtures.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      `const roots = { ${fixtures.map((fixture) => `${fixture.name}: ${pascal(fixture.name)}`).join(', ')} }`,
      'const app = createApp(roots[location.hash.slice(1)])',
      `for (const [name, component] of Object.entries({ ${webComponents.join(', ')} })) app.component(name, component)`,
      // As the starter does: a theme for each appearance, and the one the run asks for.
      `app.use(createMavisServices({ theme: mavis, darkTheme: midnight, appearance: '${core[theme].appearance}' })).mount('#app')`,
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
          const logged = (text) =>
            fixture.knownWebErrors?.some((known) => text.includes(known)) ||
            errors.push(`step ${current}: ${text}`)
          page.on('pageerror', (error) => logged(error.message))
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning') logged(message.text())
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
            } else if (step.paint) {
              const deadline = Date.now() + 5000
              let failure = await webPaint(page, step)
              while (failure && Date.now() < deadline) {
                await page.waitForTimeout(50)
                failure = await webPaint(page, step)
              }
              assert.equal(failure, null, where)
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
          // MAVIS_WEB_SHOTS=folder saves what a fixture shows when it ends.
          if (process.env.MAVIS_WEB_SHOTS && !reduced)
            await page.screenshot({
              path: join(process.env.MAVIS_WEB_SHOTS, `${fixture.name}-${engineName}.png`),
              fullPage: true,
            })
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
    const named = (role) => page.getByRole(role, { name: step.toggle, exact: true })
    await named('checkbox').or(named('switch')).or(named('radio')).click()
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
  } else if (step.adjust) {
    const named = (role) => page.getByRole(role, { name: step.adjust, exact: true })
    await named('separator').or(named('slider')).focus()
    await page.keyboard.press(webKeys[step.key] ?? step.key)
  } else if (step.drag) {
    // A divider settling after the last change is pressed where it comes to rest.
    const separator = page.getByRole('separator', { name: step.drag, exact: true })
    let box = await separator.boundingBox()
    for (let tries = 0; tries < 60; tries++) {
      await page.waitForTimeout(50)
      const next = await separator.boundingBox()
      const still = Math.abs(next.x - box.x) < 0.5 && Math.abs(next.y - box.y) < 0.5
      box = next
      if (still) break
    }
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    // In steps, as a hand moves it.
    await page.mouse.move(x + (step.x ?? 0), y + (step.y ?? 0), { steps: 10 })
    await page.mouse.up()
  } else if (step.window) {
    await page.setViewportSize({ width: step.window, height: page.viewportSize().height })
  } else if (step.scroll) {
    // MScreen's <main> and a list scroll themselves; a header's region scrolls inside it.
    await page.evaluate(
      ({ id, by }) => {
        const named = document.getElementById(id)
        const scrolls = (element) =>
          element.scrollHeight > element.clientHeight &&
          ['auto', 'scroll'].includes(getComputedStyle(element).overflowY)
        const target = [named, ...named.querySelectorAll('*')].find(scrolls) ?? named
        target.scrollBy({ top: by, behavior: 'instant' })
      },
      { id: step.scroll, by: step.by },
    )
  } else throw new Error(`Unknown step ${JSON.stringify(step)}`)
}

// The color on screen at the middle of an element, against the theme color the step names;
// null when they match.
async function webPaint(page, step) {
  const box = await page.locator(`#${step.paint}`).boundingBox()
  if (!box) return `no element with id ${step.paint}`
  const png = await page.screenshot({
    // The pixel the middle falls in, also for a line one pixel thick.
    clip: {
      x: Math.floor(box.x + box.width / 2),
      y: Math.floor(box.y + box.height / 2),
      width: 1,
      height: 1,
    },
    animations: 'disabled',
  })
  const shown = pixel(png)
  const expected = themeColor(step.is)
  return shown.every((value, index) => Math.abs(value - expected[index]) <= 3)
    ? null
    : `${step.paint} shows rgb(${shown.join(', ')}), not ${step.is} rgb(${expected.join(', ')})`
}

// Red, green and blue of a one-pixel PNG. Its only row starts with a filter byte; with nothing
// before it, every filter leaves the first pixel as it is.
function pixel(png) {
  const chunks = []
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at)
    if (png.toString('latin1', at + 4, at + 8) === 'IDAT')
      chunks.push(png.subarray(at + 8, at + 8 + length))
    at += 12 + length
  }
  const row = inflateSync(Buffer.concat(chunks))
  return [row[1], row[2], row[3]]
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
          !element.closest('[inert]') &&
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
  if (step.scroll) return `scroll(app, ${swiftString(step.scroll)}, by: ${step.by}, step: ${index})`
  if (step.adjust) {
    const [key, modifiers] = swiftKeys[step.key]
    return `adjust(app, ${swiftString(step.adjust)}, XCUIKeyboardKey${key}, ${modifiers}, step: ${index})`
  }
  if (step.drag)
    return `drag(app, ${swiftString(step.drag)}, x: ${step.x ?? 0}, y: ${step.y ?? 0}, step: ${index})`
  if (step.window) return `resize(app, width: ${step.window}, step: ${index})`
  if (step.paint)
    return `paint(app, ${swiftString(step.paint)}, [${themeColor(step.is).join(', ')}], step: ${index})`
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
  return `expect(app, ${swiftList(step.macos ?? step.expect)}, cards: ${cards}, fields: [${fields.join(', ')}], focused: ${focused}, step: ${index})`
}

// The layout relations in Swift, for both Mac runners. Frames have their origin at the top left.
function swiftLayout() {
  return `/// One pixel of an image as sRGB red, green and blue from 0 to 255, whatever space it is in.
func srgbPixel(_ image: CGImage, x: Int, y: Int) -> [Double]? {
    guard let pixel = image.cropping(to: CGRect(x: x, y: y, width: 1, height: 1)),
          let space = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
    var data = [UInt8](repeating: 0, count: 4)
    let drawn = data.withUnsafeMutableBytes { bytes -> Bool in
        guard let context = CGContext(data: bytes.baseAddress, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4, space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
        context.draw(pixel, in: CGRect(x: 0, y: 0, width: 1, height: 1))
        return true
    }
    return drawn ? data.prefix(3).map(Double.init) : nil
}

enum LayoutEdge { case start, center, end, fill }

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
  // A fixture for the keyboard and the pointer has nothing a touch screen can replay.
  const touched = fixtures.filter((fixture) => !fixture.desktop)
  for (const file of ['App.vue', 'app.ts', 'probe.ts', 'layout.ts'])
    cpSync(join(root, 'test/portable-native', file), join(dir, 'src', file))
  // mavis.ts is what #mavis resolves to in this host (see the template's webpack.config.js).
  for (const file of ['app.css', 'env.d.ts', 'mavis.ts'])
    cpSync(join(root, 'packages/create-mavis/templates/mobile/src', file), join(dir, 'src', file))
  for (const fixture of touched) {
    const target = join(dir, 'src/fixtures', fixture.name)
    mkdirSync(target, { recursive: true })
    for (const [file, text] of hosted(fixture, fixture.output.native))
      writeFileSync(join(target, file), text)
  }
  writeFileSync(
    join(dir, 'src/fixtures.ts'),
    [
      ...touched.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      `export const fixtures = [`,
      ...touched.map(
        (fixture) =>
          `  { name: ${JSON.stringify(fixture.name)}, component: ${pascal(fixture.name)}, screen: ${fixture.screen}, steps: ${JSON.stringify(fixture.steps.map((step) => (step.paint ? { ...step, is: themeColor(step.is) } : step)))} },`,
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
  console.log(`NativeScript conformance passed on ${platform} (${touched.length} fixtures).`)
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

// The widths the window steps of every fixture ask for.
function windowWidths() {
  return [
    ...new Set(fixtures.flatMap((fixture) => fixture.steps.flatMap((step) => step.window ?? []))),
  ]
}

// The fixtures whose root is an MScreen: they fill the window instead of a padded page.
function screenFixtures() {
  return `[${fixtures
    .filter((fixture) => fixture.screen)
    .map((fixture) => swiftString(fixture.name))
    .join(', ')}]`
}

// What the offscreen runner replays: nothing that needs a keyboard, the pointer or focus. A step
// for a hardware keyboard runs as the touch equivalent it names for NativeScript.
function offscreenSteps(fixture) {
  if (fixture.desktop) return null
  const replayable = (step) =>
    Boolean(
      step.layout ||
      step.click ||
      step.scroll ||
      step.paint ||
      step.window ||
      step.toggle ||
      (step.adjust && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(step.key)) ||
      (step.expect && !step.fields && !('focused' in step)),
    )
  const steps = fixture.steps
    .map((step, index) => ({
      step: replayable(step) || !('native' in step) ? step : step.native,
      index,
    }))
    .filter(({ step }) => step)
  return steps.every(({ step }) => replayable(step)) ? steps : null
}

// One table for stackLayout in the Mavis core and MavisFlex.resolved(at:) on the Mac: the same
// breakpoints, in the order a source writes them, at widths on both sides of each one.
function stackRules() {
  return [
    {
      base: { direction: 'column', gap: 'sm', align: 'stretch', justify: 'start', wrap: false },
      responsive: [
        { at: 640, direction: 'row', gap: 'lg' },
        { at: 1000, gap: 'xl', align: 'center' },
      ],
      widths: [undefined, 0, 639, 639.5, 640, 999.9, 1000, 1400],
    },
    {
      base: { direction: 'row', gap: 4, align: 'start', justify: 'center', wrap: false },
      responsive: [
        { at: 900, direction: 'column', justify: 'between' },
        { at: 300, direction: 'row', wrap: true },
        { at: 600, gap: 12, align: 'end' },
      ],
      widths: [undefined, 1, 299.99, 300, 599, 600, 899, 900, 2000],
    },
    {
      base: { direction: 'column', gap: 'none', align: 'stretch', justify: 'start', wrap: false },
      responsive: { at: 500, wrap: true, justify: 'around', gap: 0 },
      widths: [undefined, 499, 500, 501],
    },
    {
      base: { direction: 'row', gap: 'md', align: 'center', justify: 'end', wrap: true },
      responsive: undefined,
      widths: [undefined, 100, 10000],
    },
  ]
}

// The table as Swift that compares each width's resolved layout with stackLayout's answer.
function stackRulesSwift() {
  const { tokens } = themeTokens(core[theme])
  const axis = (direction) => (direction === 'row' ? '.horizontal' : '.vertical')
  const space = (gap) => core.resolveSpace(core[theme], gap)
  const checks = stackRules().flatMap(({ base, responsive, widths }, number) => {
    const points = responsive === undefined ? [] : [responsive].flat()
    const layout = `MavisFlex(axis: ${axis(base.direction)}, spacing: ${space(base.gap)}, justify: .${base.justify}, align: .${base.align}, wrap: ${base.wrap}, breakpoints: [${points.map((point) => swiftBreakpoint(point, tokens)).join(', ')}])`
    return widths.map((width) => {
      const expected = core.stackLayout(base, responsive, width)
      return `    check(${number}, ${layout}, ${width ?? 'nil'}, ${axis(expected.direction)}, ${space(expected.gap)}, .${expected.align}, .${expected.justify}, ${expected.wrap})`
    })
  })
  return `/// Every case of the stack rules table that MavisFlex does not resolve as stackLayout does.
@MainActor func stackRules() -> [String] {
    var failures: [String] = []
    func check(_ number: Int, _ layout: MavisFlex, _ width: CGFloat?, _ axis: Axis, _ spacing: Double, _ align: MavisAlign, _ justify: MavisJustify, _ wrap: Bool) {
        let got = layout.resolved(at: width)
        guard got.axis != axis || got.spacing != spacing || got.align != align || got.justify != justify || got.wrap != wrap else { return }
        failures.append("case \\(number) at \\(width.map { "\\($0)" } ?? "no width"): \\(got.axis) \\(got.spacing) \\(got.align) \\(got.justify) \\(got.wrap), expected \\(axis) \\(spacing) \\(align) \\(justify) \\(wrap)")
    }
${checks.join('\n')}
    return failures
}
`
}

function runOffscreen() {
  assert.equal(process.platform, 'darwin', '--offscreen needs macOS and Swift.')
  const dir = join(artifacts, 'offscreen')
  const sources = join(dir, 'Sources/Offscreen')
  // The build folder stays: Swift rebuilds only what changed.
  rmSync(join(dir, 'Sources'), { recursive: true, force: true })
  mkdirSync(sources, { recursive: true })
  writeSwift(sources)
  cpSync(fonts, join(sources, 'Fonts'), { recursive: true })
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
        .executableTarget(name: "Offscreen", dependencies: [.product(name: "JoltSwiftUI", package: "jolt-swift")], resources: [.copy("Fonts")]),
    ]
)
`,
  )
  const sessions = replayed.map(({ fixture, reduced }) => {
    const steps = offscreenSteps(fixture).map(({ step, index }) =>
      step.expect
        ? `try expect(app, ${swiftList(step.macos ?? step.expect)}, headings: ${step.headings ? swiftList(step.headings) : 'nil'}, cards: ${step.cards ? swiftList(step.cards) : 'nil'}, step: ${index})`
        : step.adjust
          ? `try adjust(app, ${swiftString(step.adjust)}, increment: ${['ArrowRight', 'ArrowDown'].includes(step.key)}, step: ${index})`
          : step.toggle
            ? `try toggle(app, ${swiftString(step.toggle)}, step: ${index})`
            : `try ${swiftStep(step, index)}`,
    )
    return `    replay(${swiftString(fixture.name)}, reducedMotion: ${reduced}) { app in
${steps.map((line, index) => `        ${line}\n        app.snapshot(${swiftString(`${fixture.name}${reduced ? '-reduced' : ''}-${index}`)})`).join('\n')}
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
    static let screens: Set<String> = ${screenFixtures()}
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
    // A screen fills a window of the conformance app's size, and scrolls there itself.
    private static let window = CGSize(width: 800, height: 900)

    init(_ fixture: String, reducedMotion: Bool) {
        let root = FixtureRoot(name: fixture, reducedMotion: reducedMotion)
        let size = FixtureRoot.screens.contains(fixture) ? Self.window : Self.page
        // The page the conformance app shows, with the same padding, or the screen as it is.
        let page = FixtureRoot.screens.contains(fixture)
            ? AnyView(root.frame(maxWidth: .infinity, maxHeight: .infinity).mavisIdentifier("mavis-window"))
            : AnyView(ScrollView {
                root
                    .padding(24)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(MavisTokens.background))
        // The view fills the hosting view, so a window step can make it narrower or wider.
        host = NSHostingView(rootView: AnyView(page.frame(maxWidth: .infinity, maxHeight: .infinity)))
        host.frame = CGRect(origin: .zero, size: size)
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

    /// The divider of the MResizablePanels with this label.
    func divider(_ label: String) -> NSObject? {
        var found: [NSObject] = []
        nodes(host, into: &found)
        return found.first { string($0, "accessibilityIdentifier") == "mavis-divider:" + label }
    }

    func button(_ name: String, _ nth: Int) -> NSObject? {
        let matches = elements(["AXButton"]).filter { self.name($0) == name }
        return nth < matches.count ? matches[nth] : nil
    }

    /// The checkbox, switch, radio or segment with this name.
    func choice(_ name: String) -> NSObject? {
        elements(["AXCheckBox", "AXRadioButton"]).first { self.name($0) == name }
    }

    /// The slider with this name.
    func slider(_ name: String) -> NSObject? {
        elements(["AXSlider"]).first { self.name($0) == name }
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

    /// Makes the window this wide, keeping its height.
    func resize(width: Double) {
        window.setContentSize(NSSize(width: width, height: host.bounds.height))
        settle()
    }

    /// MAVIS_OFFSCREEN_TREE=1 prints what assistive technology reads of a fixture when it ends.
    func tree() -> String {
        var lines: [String] = []
        func visit(_ node: NSObject, _ depth: Int) {
            for child in (read(node, "accessibilityChildren") as? [Any]) ?? [] {
                guard let child = child as? NSObject else { continue }
                let frame = (read(child, "accessibilityFrame") as? NSValue)?.rectValue ?? .zero
                let value = read(child, "accessibilityValue").map { "\\($0)" } ?? ""
                lines.append(String(repeating: "  ", count: depth) + "\\(string(child, "accessibilityRole")) \\(string(child, "accessibilitySubrole")) label=\\(name(child)) value=\\(value) id=\\(string(child, "accessibilityIdentifier")) \\(Int(frame.minX)),\\(Int(window.frame.maxY - frame.maxY)) \\(Int(frame.width))x\\(Int(frame.height))")
                visit(child, depth + 1)
            }
        }
        visit(host, 0)
        return lines.joined(separator: "\\n")
    }

    /// Scrolls the content of the element with this id down, as a scroll wheel would: the
    /// innermost scroll view that covers the element.
    func scroll(_ id: String, by points: Double) -> Bool {
        func scrollViews(_ view: NSView) -> [NSScrollView] {
            ((view as? NSScrollView).map { [$0] } ?? []) + view.subviews.flatMap(scrollViews)
        }
        func area(_ view: NSView) -> CGRect {
            let rect = view.convert(view.bounds, to: nil)
            return CGRect(x: rect.minX, y: window.frame.height - rect.maxY, width: rect.width, height: rect.height)
        }
        guard let element = frame(id) else { return false }
        let covering = scrollViews(host)
            .filter { area($0).insetBy(dx: -1.5, dy: -1.5).contains(element) }
            .min { area($0).width * area($0).height < area($1).width * area($1).height }
        guard let scroll = covering ?? scrollViews(host).first else { return false }
        let clip = scroll.contentView
        clip.scroll(to: NSPoint(x: clip.bounds.minX, y: clip.bounds.minY + points))
        scroll.reflectScrolledClipView(clip)
        settle()
        return true
    }

    /// What the page shows after a step, as a PNG in the folder MAVIS_SNAPSHOTS names: a look at
    /// the generated views without a window. MAVIS_SNAPSHOT_HEIGHT is how much of the page to keep.
    func snapshot(_ name: String) {
        let environment = ProcessInfo.processInfo.environment
        guard let folder = environment["MAVIS_SNAPSHOTS"] else { return }
        settle()
        host.display()
        guard let rep = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return }
        host.cacheDisplay(in: host.bounds, to: rep)
        let kept = min(host.bounds.height, Double(environment["MAVIS_SNAPSHOT_HEIGHT"] ?? "") ?? 1000)
        let scale = CGFloat(rep.pixelsHigh) / host.bounds.height
        guard let image = rep.cgImage?.cropping(to: CGRect(x: 0, y: 0, width: CGFloat(rep.pixelsWide), height: kept * scale)) else { return }
        try? FileManager.default.createDirectory(atPath: folder, withIntermediateDirectories: true)
        try? NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: folder).appendingPathComponent(name + ".png"))
    }

    /// The color drawn at a point of the window, with the origin at the top left, in sRGB.
    func color(at point: CGPoint) -> [Double]? {
        settle()
        host.display()
        guard let rep = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return nil }
        host.cacheDisplay(in: host.bounds, to: rep)
        guard let image = rep.cgImage else { return nil }
        let x = Int(point.x * CGFloat(image.width) / host.bounds.width)
        let y = Int(point.y * CGFloat(image.height) / host.bounds.height)
        return srgbPixel(image, x: x, y: y)
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

/// What VoiceOver does to an adjustable element, a divider or a slider: one step up or down.
@MainActor func adjust(_ app: Session, _ label: String, increment: Bool, step: Int) throws {
    until(app) { app.divider(label) != nil || app.slider(label) != nil }
    guard let divider = app.divider(label) ?? app.slider(label) else { throw Failure(message: "step \\(step): no divider or slider \\(label)") }
    divider.perform(NSSelectorFromString(increment ? "accessibilityPerformIncrement" : "accessibilityPerformDecrement"))
    app.settle()
}

/// Presses a checkbox, switch, radio or segment, where a click would land.
@MainActor func toggle(_ app: Session, _ name: String, step: Int) throws {
    until(app) { app.choice(name) != nil }
    guard let choice = app.choice(name) else { throw Failure(message: "step \\(step): no checkbox, switch or radio \\(name)") }
    if let found = app.obstruction(choice) {
        throw Failure(message: "step \\(step): \\(name) is not hittable: the hit test at its center finds \\(found)")
    }
    choice.perform(NSSelectorFromString("accessibilityPerformPress"))
    app.settle()
}

@MainActor func resize(_ app: Session, width: Double, step: Int) throws {
    app.resize(width: width)
}

@MainActor func scroll(_ app: Session, _ id: String, by points: Double, step: Int) throws {
    until(app) { app.frame(id) != nil }
    guard app.frame(id) != nil else { throw Failure(message: "step \\(step): no element with id \\(id)") }
    guard app.scroll(id, by: points) else { throw Failure(message: "step \\(step): \\(id) does not scroll") }
}

@MainActor func paint(_ app: Session, _ id: String, _ expected: [Double], step: Int) throws {
    var shown: [Double] = []
    func matches() -> Bool {
        guard let rect = app.frame(id), let color = app.color(at: CGPoint(x: rect.midX, y: rect.midY)) else { return false }
        shown = color
        return zip(shown, expected).allSatisfy { abs($0 - $1) <= 3 }
    }
    until(app, matches)
    guard matches() else { throw Failure(message: "step \\(step): \\(id) shows rgb\\(shown), expected rgb\\(expected)") }
}

@MainActor func layout(_ app: Session, _ relations: [LayoutRelation], step: Int) throws {
    until(app) { layoutFailures(relations, app.frame).isEmpty }
    let failures = layoutFailures(relations, app.frame)
    guard failures.isEmpty else { throw Failure(message: "step \\(step): \\(failures.joined(separator: "; "))") }
}

@MainActor var failed = 0

@MainActor func replay(_ fixture: String, reducedMotion: Bool, _ steps: (Session) throws -> Void) {
    let title = fixture + (reducedMotion ? " (reduced motion)" : "")
    let session = Session(fixture, reducedMotion: reducedMotion)
    defer {
        if ProcessInfo.processInfo.environment["MAVIS_OFFSCREEN_TREE"] == "1" { print(session.tree()) }
    }
    do {
        try steps(session)
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
    let rules = stackRules()
    if rules.isEmpty {
        print("passed  stack rules (${stackRules().reduce((sum, rule) => sum + rule.widths.length, 0)} widths, as stackLayout resolves them)")
    } else {
        failed += 1
        print("FAILED  stack rules: \\(rules.joined(separator: "; "))")
    }
${sessions.join('\n')}
    exit(failed == 0 ? 0 : 1)
}

${stackRulesSwift()}

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
  mkdirSync(join(dir, 'Resources'), { recursive: true })
  cpSync(join(fonts, 'lucide.ttf'), join(dir, 'Resources/lucide.ttf'))
  writeFileSync(
    join(dir, 'Sources', 'ConformanceApp.swift'),
    `import AppKit
import SwiftUI
import JoltSwiftUI

@main
struct ConformanceApp: App {
    var body: some Scene {
        WindowGroup("Mavis conformance") {
            Group {
                // A screen fills the window; any other fixture is on a padded page.
                if FixtureRoot.screen {
                    FixtureRoot()
                } else {
                    ScrollView {
                        FixtureRoot()
                            .padding(24)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .background(MavisTokens.background)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .mavisIdentifier("mavis-window")
            // Shorter than a laptop screen: taller fixtures scroll, as they would for a person.
            // Window steps make it as narrow as a phone.
            .frame(minWidth: 360, minHeight: 600)
        }
        .defaultSize(width: 800, height: 900)
        .commands {
            // What a window step chooses: the test cannot drag the window's edge reliably.
            CommandMenu("Conformance") {
${windowWidths()
  .map(
    (width) =>
      `                Button(${swiftString(`Window ${width}`)}) { ConformanceWindow.resize(width: ${width}) }`,
  )
  .join('\n')}
            }
        }
    }
}

enum ConformanceWindow {
    @MainActor static func resize(width: Double) {
        guard let window = NSApp.windows.first(where: { $0.isVisible && $0.canBecomeMain }) else { return }
        let height = window.contentRect(forFrameRect: window.frame).height
        window.setContentSize(NSSize(width: width, height: height))
    }
}

struct FixtureRoot: View {
    static let screens: Set<String> = ${screenFixtures()}
    static var screen: Bool { screens.contains(ProcessInfo.processInfo.environment["MAVIS_FIXTURE"] ?? "") }

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
        let app = launch(${swiftString(fixture.name)}, reducedMotion: ${reduced}, screen: ${fixture.screen})
${lines.join('\n')}
        app.terminate()
    }`
  })
  writeFileSync(
    join(dir, 'UITests', 'ConformanceUITests.swift'),
    `import AppKit
import XCTest

/// Generated from test/portable/*/steps.json. Each step acts on the screen, compares every visible
/// text or checks where elements are. Headings are not told apart from other texts here.
final class ConformanceUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

${tests.join('\n\n')}

    /// Whether the fixture is a screen of its own, not a view on the padded page.
    private var screen = false

    @MainActor private func launch(_ fixture: String, reducedMotion: Bool, screen: Bool) -> XCUIApplication {
        self.screen = screen
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

    /// The fixture's content: the page's scroll view, or the whole window for a screen, whose
    /// overlay lies outside its scroll view.
    @MainActor private func content(_ app: XCUIApplication) -> XCUIElement {
        screen ? app.windows.firstMatch : app.windows.firstMatch.scrollViews.firstMatch
    }

    @MainActor private func texts(_ app: XCUIApplication) -> [String] {
        // The window title is also a static text; read only the fixture's content.
        // Field messages belong to their field and are checked with it.
        let title = app.windows.firstMatch.title
        return content(app).staticTexts.allElementsBoundByIndex
            .filter { !$0.identifier.hasPrefix("mavis-message:") && !(screen && text($0) == title) }
            .map(text)
    }

    private static let fieldTypes: [XCUIElement.ElementType] = [.textField, .secureTextField, .textView, .checkBox, .popUpButton, .toggle, .switch, .radioButton]

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
        // A screen without scroll shows everything it has.
        guard scroll.exists else { return }
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
        identified(content(app).buttons, "mavis-card").allElementsBoundByIndex.map(\\.label)
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

    /// A text, button or field is one element; a container is the union of the two corner
    /// points that carry its id.
    @MainActor private func frame(_ app: XCUIApplication, _ id: String) -> CGRect? {
        let frames = identified(app.windows.firstMatch.descendants(matching: .any), id).allElementsBoundByIndex.map(\\.frame)
        return frames.first.map { frames.reduce($0) { $0.union($1) } }
    }

    /// Makes the window this wide through the Conformance menu, keeping its height.
    @MainActor private func resize(_ app: XCUIApplication, width: Double, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        app.menuBars.menuBarItems["Conformance"].click()
        let item = app.menuItems["Window \\(Int(width))"]
        XCTAssertTrue(item.waitForExistence(timeout: 5), "step \\(step): window \\(Int(width))", file: file, line: line)
        item.click()
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
    }

    /// Scrolls a screen's content down with the scroll wheel.
    @MainActor private func scroll(_ app: XCUIApplication, _ id: String, by points: Double, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        // The innermost scroll view that covers the element: a list or a header scrolls inside the page.
        let element = frame(app, id)
        let covering = app.windows.firstMatch.scrollViews.allElementsBoundByIndex
            .filter { view in element.map { view.frame.insetBy(dx: -1.5, dy: -1.5).contains($0) } ?? false }
            .min { $0.frame.width * $0.frame.height < $1.frame.width * $1.frame.height }
        let scroll = covering ?? app.windows.firstMatch.scrollViews.firstMatch
        XCTAssertTrue(scroll.exists && element != nil, "step \\(step): \\(id) does not scroll", file: file, line: line)
        let marker = scroll.staticTexts.firstMatch
        let before = marker.frame.minY
        let first = text(marker)
        scroll.scroll(byDeltaX: 0, deltaY: -points)
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        // The system's scroll direction can turn the wheel the other way. A list that only keeps
        // the rows in view shows another first text once it has moved.
        if text(scroll.staticTexts.firstMatch) == first && marker.frame.minY >= before {
            scroll.scroll(byDeltaX: 0, deltaY: 2 * points)
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }
    }

    /// The color on screen at the middle of an element, against the theme color of the step.
    @MainActor private func paint(_ app: XCUIApplication, _ id: String, _ expected: [Double], step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let window = app.windows.firstMatch
        var shown: [Double] = []
        func matches() -> Bool {
            guard let rect = frame(app, id),
                  let image = window.screenshot().image.cgImage(forProposedRect: nil, context: nil, hints: nil)
            else { return false }
            let x = Int((rect.midX - window.frame.minX) * CGFloat(image.width) / window.frame.width)
            let y = Int((rect.midY - window.frame.minY) * CGFloat(image.height) / window.frame.height)
            guard let color = srgbPixel(image, x: x, y: y) else { return false }
            shown = color
            return zip(shown, expected).allSatisfy { abs($0 - $1) <= 3 }
        }
        let deadline = Date().addingTimeInterval(5)
        while !matches() && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        XCTAssertTrue(matches(), "step \\(step): \\(id) shows rgb\\(shown), expected rgb\\(expected)", file: file, line: line)
    }

    @MainActor private func layout(_ app: XCUIApplication, _ relations: [LayoutRelation], step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let frame = { (id: String) in self.frame(app, id) }
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

    @MainActor private func divider(_ app: XCUIApplication, _ label: String, step: Int, file: StaticString, line: UInt) -> XCUIElement {
        let window = app.windows.firstMatch
        let panels = identified(window.descendants(matching: .any), "mavis-divider:" + label).firstMatch
        // A slider is found by its name, as a person reads it.
        let slider = window.sliders.matching(NSPredicate(format: "label == %@", label)).firstMatch
        let divider = panels.waitForExistence(timeout: slider.exists ? 0 : 5) ? panels : slider
        XCTAssertTrue(divider.waitForExistence(timeout: 5), "step \\(step): divider or slider \\(label)", file: file, line: line)
        reveal(app, divider)
        return divider
    }

    /// Clicks the divider, which takes the keyboard focus, and presses a key there. A divider that
    /// has the focus is not clicked again: two clicks in a row are a double click, which collapses.
    @MainActor private func adjust(_ app: XCUIApplication, _ label: String, _ key: XCUIKeyboardKey, _ modifiers: XCUIElement.KeyModifierFlags, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let element = divider(app, label, step: step, file: file, line: line)
        if element.elementType == .slider {
            // A click anywhere else on the track would move the thumb there: click the thumb.
            let thumb = 10 + (element.frame.width - 20) * element.normalizedSliderPosition
            element.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0.5)).withOffset(CGVector(dx: thumb, dy: 0)).click()
        } else if !hasFocus(element) { element.click() }
        app.windows.firstMatch.typeKey(key, modifierFlags: modifiers)
    }

    /// Drags the divider from where it comes to rest after the last change.
    @MainActor private func drag(_ app: XCUIApplication, _ label: String, x: Double, y: Double, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let element = divider(app, label, step: step, file: file, line: line)
        var frame = element.frame
        for _ in 0..<60 {
            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
            let next = element.frame
            if abs(next.minX - frame.minX) < 0.5 && abs(next.minY - frame.minY) < 0.5 { break }
            frame = next
        }
        let start = element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.click(forDuration: 0.2, thenDragTo: start.withOffset(CGVector(dx: x, dy: y)))
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
# The Lucide font of MIcon, in the app's resources.
app.add_resources([project.main_group.new_file('Resources/lucide.ttf')])
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
