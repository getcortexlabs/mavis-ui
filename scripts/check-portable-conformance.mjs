// Replay shared Vue fixtures in browsers and on NativeScript devices.
// Select individual fixtures with MAVIS_FIXTURES or split the Web corpus with --shard.
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
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { portableSelection } from './portable-selection.mjs'

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
const artifacts = join(root, 'artifacts/portable')
mkdirSync(artifacts, { recursive: true })
const pascal = (name) => name[0].toUpperCase() + name.slice(1)

const webKeys = { Return: 'Enter', Escape: 'Escape', Tab: 'Tab', 'Shift+Tab': 'Shift+Tab' }

// A field by its visible label: the editor, checkbox or select button.
const webField = (page, label) =>
  page
    .locator('#app')
    .getByLabel(label, { exact: true })
    .and(
      page.locator(
        'input, textarea, select, button, [role="textbox"], [role="combobox"], [role="checkbox"], [role="switch"]',
      ),
    )

// MAVIS_FIXTURES=form,tasks runs only those fixtures; MAVIS_THEME=midnight uses the dark theme.
const selection = portableSelection(readdirSync(join(root, 'test/portable')), {
  args: process.argv.slice(2),
  fixtures: process.env.MAVIS_FIXTURES,
})
const only = selection.names
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
  'MCalendar',
  'MTimePicker',
  'MScheduler',
  'MDatePicker',
  'MDateRangePicker',
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
  'MBadge',
  'MProgress',
  'MSkeleton',
  'MAlert',
  'MEmptyState',
  'MSwitch',
  'MSlider',
  'MSegmentedControl',
  'MRadioGroup',
  'MMultiSelect',
  'MTabs',
  'MSteps',
  'MPagination',
  'MSparkline',
  'MImage',
  'MSheet',
  'MChip',
  'MNumberInput',
  'MRangeSlider',
  'MAvatar',
  'MDonutChart',
  'MGauge',
  'MBreadcrumb',
  'MAppBar',
  'MTabBar',
  'MNavigationRail',
  'MLink',
  'MDialog',
  'MCommandPalette',
  'MTooltip',
  'MToast',
  'MNotificationCenter',
  'MFormGroup',
  'MFormErrors',
  'MRating',
  'MPinInput',
  'MGradientBackground',
  'MCarousel',
  'MImageCompare',
  'MImageCropper',
  'MImageViewer',
  'MCombobox',
  'MTransferList',
  'MTreeSelect',
  'MChart',
  'MHeatmap',
  'MComposer',
  'MColorPicker',
  'MFilePicker',
  'MPopover',
  'MMenu',
  'MSpeedDial',
  'MTour',
  'MTourTarget',
  'MReveal',
  'MAnimatedText',
  'MNumberFlow',
  'MConfetti',
  'MParticleField',
  'MMarquee',
  'MListItem',
  'MAccordion',
  'MTimeline',
  'MTreeView',
  'MDataTable',
  'MSortableList',
  'MSwipeActions',
  'MSwipeDeck',
  'MKanban',
]
assert.equal(
  new Set(webComponents).size,
  webComponents.length,
  'Duplicate host component registration.',
)
const fixtures = []
const pictures = new Map()
// A host's copy of the fixtures' shared/assets.
const copyPictures = (folder) => {
  for (const [asset, file] of pictures) {
    mkdirSync(folder, { recursive: true })
    cpSync(file, join(folder, asset))
  }
}
for (const name of only) {
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
  // The pictures a fixture names ~/assets/name.png. Every fixture runs in one app, so a name
  // is one picture, whichever fixtures show it.
  const assets = existsSync(join(shared, 'assets')) ? readdirSync(join(shared, 'assets')) : []
  for (const asset of assets) {
    const file = join(shared, 'assets', asset)
    assert.ok(
      !pictures.has(asset) || readFileSync(pictures.get(asset)).equals(readFileSync(file)),
      `${name}: ${asset} is another picture in another fixture.`,
    )
    pictures.set(asset, file)
  }
  const host = [folder, ...(own.replays ? [join(root, 'test/portable', own.replays)] : [])]
    .map((from) => join(from, 'host.ts'))
    .find((file) => existsSync(file))
  fixtures.push({
    ...script,
    name,
    folder,
    shared,
    host,
    screen: own.screen ?? false,
    navigation: own.navigation,
    hostPath: own.hostPath ?? 'host',
  })
}
const put = (folder, file, text) => {
  mkdirSync(dirname(join(folder, file)), { recursive: true })
  writeFileSync(join(folder, file), text)
}
// Navigation: a fixture with a route table, and what each host needs to run it.
const navigationOf = (fixture) => fixture.navigation
const routed = () => fixtures.filter(navigationOf)
const routeTable = (fixture) => fixture.navigation.route
const navigationSteps = [
  'follow',
  'back',
  'forward',
  'open',
  'relaunch',
  'destination',
  'links',
  'title',
  'selected',
]
const navigationStep = (step) => navigationSteps.some((kind) => kind in step)

// The Web host of a fixture with a route table: Vue Router on the table itself, installed in
// the app when the fixture mounts, with the navigation Mavis links and screens ask for.
function webNavigationHosts() {
  if (!routed().length) return []
  return [
    "import { defineComponent, getCurrentInstance, h, provide } from 'vue'",
    "import { createRouter, createWebHistory, RouterView } from 'vue-router'",
    "import { createRouterNavigation } from '@getcortexlabs/mavis-core'",
    "import { navigationKey } from '@getcortexlabs/mavis-core/vue'",
    ...routed().map(
      (fixture) =>
        `import { routes as ${fixture.name}Routes } from './fixtures/${fixture.name}/${routeTable(fixture)}'`,
    ),
    'const routedHost = (routes) =>',
    '  defineComponent({',
    '    setup() {',
    '      const router = createRouter({ history: createWebHistory(), routes })',
    '      getCurrentInstance().appContext.app.use(router)',
    '      const navigation = createRouterNavigation(router)',
    '      provide(navigationKey, navigation)',
    // What a tab bar asks of the app when a destination is chosen.
    '      window.mavisNavigation = navigation',
    '      return () => h(RouterView)',
    '    },',
    '  })',
    ...routed().map((fixture) => `roots.${fixture.name} = routedHost(${fixture.name}Routes)`),
  ]
}

// The names of the links on the page, in reading order.
const webLinks = (page) =>
  page
    .locator('#app [role="link"]')
    .evaluateAll((elements) =>
      elements
        .filter((element) => !element.closest('[aria-hidden="true"]'))
        .map((element) => element.getAttribute('aria-label') ?? element.textContent.trim()),
    )

// A navigation step on the Web. The browser's history is the app's: back and forward are its
// buttons, a deep link is the address, and a relaunch is the page loaded again.
async function webNavigation(page, step, fixture, url, where) {
  const address = (href) => `${new URL(url).origin}${href}#${fixture.name}`
  if (step.follow) {
    await page
      .getByRole('link', { name: step.follow, exact: true })
      .nth(step.nth ?? 0)
      .click({ timeout: 5000, force: Boolean(step.force) })
  } else if (step.back) await page.goBack()
  else if (step.forward) await page.goForward()
  else if (step.open) await page.goto(address(step.open))
  else if (step.relaunch) {
    // The address keeps the route; the fixture's name goes back on it for the host to read.
    await page.evaluate(
      (name) =>
        history.replaceState(history.state, '', `${location.pathname}${location.search}#${name}`),
      fixture.name,
    )
    await page.reload()
  } else if (step.destination) {
    const found = navigationOf(fixture).destinations.find((item) => item.label === step.destination)
    assert.ok(found, `${where}: no destination ${step.destination}`)
    await page.evaluate((href) => window.mavisNavigation.replace(href), found.href)
  } else if (step.links) {
    const deadline = Date.now() + 5000
    let actual = await webLinks(page)
    while (JSON.stringify(actual) !== JSON.stringify(step.links) && Date.now() < deadline) {
      await page.waitForTimeout(50)
      actual = await webLinks(page)
    }
    assert.deepEqual(actual, step.links, where)
  }
  // A window's title and a destination in front are the Mac's own.
}

// A fixture's host.ts sits beside the modules it imports, wherever the host keeps them.
const hostPath = (fixture) => fixture.hostPath
const putAll = (folder, fixture, native = false) => {
  cpSync(fixture.shared, folder, {
    recursive: true,
    filter: (source) => source !== join(fixture.shared, 'assets'),
  })
  const overrides = join(fixture.folder, 'native')
  if (native && existsSync(overrides)) cpSync(overrides, folder, { recursive: true })
  if (fixture.host) put(folder, `${hostPath(fixture)}.ts`, readFileSync(fixture.host))
}
const report = {
  theme,
  selection,
  fixtures: fixtures.map(({ name, root: component, steps, covers, replays }) => ({
    name,
    root: component,
    covers,
    steps: steps.length,
    ...(replays ? { replays } : {}),
    source: 'vue',
  })),
  web: {},
  nativescript: {},
}
const save = () =>
  writeFileSync(join(artifacts, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
save()
console.log(`Loaded ${fixtures.length} fixtures.`)

if (process.argv.includes('--web')) await runWeb()
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
    putAll(target, fixture)
  }
  // Shared Vue files import Mavis from #mavis; this host resolves it to Mavis Web.
  writeFileSync(join(dir, 'mavis.js'), "export * from '@getcortexlabs/mavis-web'\n")
  // ~/assets/name.png is a path beside the page, as in the starter's Web app.
  copyPictures(join(dir, 'public/~/assets'))
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
      ...fixtures.flatMap((fixture) =>
        fixture.host
          ? [
              `import { install as install${pascal(fixture.name)} } from './fixtures/${fixture.name}/${hostPath(fixture)}'`,
            ]
          : [],
      ),
      `const roots = { ${fixtures.map((fixture) => `${fixture.name}: ${pascal(fixture.name)}`).join(', ')} }`,
      ...webNavigationHosts(),
      `const hosts = { ${fixtures.flatMap((fixture) => (fixture.host ? [`${fixture.name}: install${pascal(fixture.name)}`] : [])).join(', ')} }`,
      'const app = createApp(roots[location.hash.slice(1)])',
      'hosts[location.hash.slice(1)]?.(app)',
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
  const failures = []
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
          const knownErrors = []
          const remembered = new Map()
          let current = 'load'
          const logged = (text) => {
            const destination = fixture.knownWebErrors?.some((known) => text.includes(known))
              ? knownErrors
              : errors
            destination.push(`step ${current}: ${text}`)
          }
          // Keep a bounded input trace to distinguish a missed hit from a rejected model update.
          // This observes actual browser input; it does not retry, synthesize or delay actions.
          if (process.env.MAVIS_WEB_DIAGNOSTICS === '1')
            await page.addInitScript(() => {
              const describe = (element) => {
                if (!(element instanceof Element)) return null
                const control = element.closest('button, input, a, [role="checkbox"]') ?? element
                const { x, y, width, height } = control.getBoundingClientRect()
                return {
                  tag: control.tagName,
                  id: control.id,
                  text: control.textContent?.trim().slice(0, 100),
                  label: control.getAttribute('aria-label'),
                  pressed: control.getAttribute('aria-pressed'),
                  rect: { x, y, width, height },
                }
              }
              window.__mavisInputTrace = []
              for (const type of ['pointerdown', 'pointerup', 'click', 'focusin'])
                document.addEventListener(
                  type,
                  (event) => {
                    const pointer = 'clientX' in event
                    window.__mavisInputTrace.push({
                      type,
                      time: performance.now(),
                      target: describe(event.target),
                      ...(pointer ? { x: event.clientX, y: event.clientY } : {}),
                    })
                    if (window.__mavisInputTrace.length > 40) window.__mavisInputTrace.shift()
                  },
                  true,
                )
            })
          page.on('pageerror', (error) => logged(error.stack ?? error.message))
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning') logged(message.text())
          })
          try {
            await page.goto(`${url}#${fixture.name}`)
            for (const [index, written] of fixture.steps.entries()) {
              const step = written.web ?? written
              const where = `${fixture.name}${reduced ? ' (reduced motion)' : ''} step ${index} (${engineName})`
              current = index
              if (step.images) {
                const deadline = Date.now() + 5000
                let actual = await webImages(page, step.images)
                while (
                  JSON.stringify(actual) !== JSON.stringify(step.images) &&
                  Date.now() < deadline
                ) {
                  await page.waitForTimeout(50)
                  actual = await webImages(page, step.images)
                }
                assert.deepEqual(actual, step.images, where)
                const state = await webState(page, {})
                if (step.unchanged) {
                  assert(
                    remembered.has(step.unchanged),
                    `Unknown remembered state: ${step.unchanged}`,
                  )
                  assert.deepEqual(
                    state,
                    remembered.get(step.unchanged),
                    `${where}: load events changed after reentry`,
                  )
                }
                if (step.remember) remembered.set(step.remember, state)
              } else if (step.layout) {
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
              } else if (step.expect && step.layer) {
                const deadline = Date.now() + 5000
                let actual = await webLayer(page, step)
                const expected = expectation(step)
                while (
                  JSON.stringify(actual) !== JSON.stringify(expected) &&
                  Date.now() < deadline
                ) {
                  await page.waitForTimeout(50)
                  actual = await webLayer(page, step)
                }
                assert.deepEqual(actual, expected, where)
              } else if (step.expect) {
                const deadline = Date.now() + 5000
                let actual = await webState(page, step)
                const expected = expectation(step)
                while (
                  JSON.stringify(actual) !== JSON.stringify(expected) &&
                  Date.now() < deadline
                ) {
                  await page.waitForTimeout(50)
                  actual = await webState(page, step)
                }
                assert.deepEqual(actual, expected, where)
              } else if (navigationStep(step)) {
                await webNavigation(page, step, fixture, url, where)
              } else await webStep(page, step)
            }
            assert.deepEqual(errors, [], `${fixture.name} (${engineName}) logged errors`)
            // MAVIS_WEB_SHOTS=folder saves what a fixture shows when it ends.
            if (process.env.MAVIS_WEB_SHOTS && !reduced)
              await page.screenshot({
                path: join(process.env.MAVIS_WEB_SHOTS, `${fixture.name}-${engineName}.png`),
                fullPage: true,
              })
            report.web[`${fixture.name}${reduced ? '/reduced-motion' : ''}/${engineName}`] =
              'passed'
          } catch (error) {
            const key = `${fixture.name}${reduced ? '/reduced-motion' : ''}/${engineName}`
            const diagnostic = `step ${current}: ${error.stack ?? error.message}`
            const viewport = await page
              .evaluate(() => {
                const rect = (element) => {
                  const { x, y, width, height } = element.getBoundingClientRect()
                  return { x, y, width, height }
                }
                return {
                  active: document.activeElement?.outerHTML.slice(0, 3000),
                  activeText: document.activeElement?.textContent?.trim(),
                  input: window.__mavisInputTrace,
                  popovers: [...document.querySelectorAll('.m-popover-panel')].map((element) => ({
                    label: element.getAttribute('aria-label'),
                    inert: element.hasAttribute('inert'),
                    rect: rect(element),
                    text: element.textContent?.trim().slice(0, 1000),
                  })),
                  screens: [...document.querySelectorAll('.m-screen')].map((element) => ({
                    id: element.id,
                    scrollTop: element.scrollTop,
                    scrollHeight: element.scrollHeight,
                    clientHeight: element.clientHeight,
                    rect: rect(element),
                  })),
                  images: [...document.querySelectorAll('.m-image img')].map((element) => ({
                    alt: element.alt,
                    loading: element.loading,
                    complete: element.complete,
                    naturalWidth: element.naturalWidth,
                    currentSrc: element.currentSrc,
                    rect: rect(element),
                  })),
                }
              })
              .catch(() => undefined)
            failures.push(`${key}: ${diagnostic}`)
            report.web[key] = { status: 'failed', diagnostic, errors, knownErrors, viewport }
            console.error(`FAILED ${key}: ${error.message}`)
            if (viewport?.images.length) console.error(`Viewport: ${JSON.stringify(viewport)}`)
            // CI shards stop promptly; finally still saves the failing session and
            // closes the page, browser and server. Local diagnostics collect all by default.
            if (process.argv.includes('--fail-fast')) throw error
          } finally {
            await page.close()
            save()
          }
        }
      } finally {
        await browser.close()
      }
    }
  } finally {
    await new Promise((done) => server.httpServer.close(done))
  }
  if (failures.length)
    throw new Error(
      `Web conformance failed in ${failures.length} sessions; see report.web for diagnostics.`,
    )
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
  if (step.hover) {
    const target = page.locator(`[id="${step.hover.replaceAll('"', '\\"')}"]`)
    await target.scrollIntoViewIfNeeded()
    const box = await target.boundingBox()
    assert(box, `No hover target ${step.hover}`)
    await page.mouse.move(box.x + box.width * (step.x ?? 0.5), box.y + box.height * (step.y ?? 0.5))
  } else if (step.click) {
    const root = step.layer === 'modal' ? page.locator('dialog:modal').last() : page
    const control = root
      .getByRole(step.role ?? 'button', { name: step.click, exact: true })
      .nth(step.nth ?? 0)
    if (step.force) {
      // This step probes the disabled control's guard, not pointer targeting. A forced
      // coordinate click during a swipe can hit the moving foreground instead of that control.
      await control.waitFor({ state: 'visible', timeout: 5000 })
      await control.evaluate((element) => {
        if (!element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true')
          throw new Error('The force probe requires a disabled control.')
        element.click()
      })
    } else await control.click({ timeout: 5000 })
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
    // Complete focus/resize work from the previous interaction before a distinct scroll.
    // MScreen schedules focus visibility on a frame; racing it can pull a just-scrolled
    // viewport back to the old button before native lazy loading observes the image.
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    )
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
  const point = step.webPoint ?? [0.5, 0.5]
  assert(
    Array.isArray(point) &&
      point.length === 2 &&
      point.every((value) => Number.isFinite(value) && value >= 0 && value <= 1),
    'paint.webPoint must contain two finite fractions from 0 to 1.',
  )
  const box = await page.locator(`#${step.paint}`).boundingBox()
  if (!box) return `no element with id ${step.paint}`
  const png = await page.screenshot({
    // Keep edge samples inside the element, also for a line one pixel thick.
    clip: {
      x: Math.floor(box.x + (point[0] === 1 ? Math.max(0, box.width - 1) : box.width * point[0])),
      y: Math.floor(box.y + (point[1] === 1 ? Math.max(0, box.height - 1) : box.height * point[1])),
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

// Web image loading is a browser scheduling hint, not the Mac's exact viewport gate.
// Check the forwarded hint and decoded current source without imposing a request deadline.
// See docs/components/image.md, "Responsive images on the Web".
async function webImages(page, expected) {
  return page.evaluate(
    (checks) =>
      checks.map((check) => {
        const images = [...document.querySelectorAll('.m-image img')].filter(
          (image) => image.alt === check.alt,
        )
        if (images.length !== 1) return { alt: check.alt, matches: images.length }
        const image = images[0]
        const state = image.closest('.m-image').getAttribute('data-state')
        const rect = image.getBoundingClientRect()
        const screen = image.closest('.m-screen')?.getBoundingClientRect()
        const top = Math.max(0, screen?.top ?? 0)
        const bottom = Math.min(innerHeight, screen?.bottom ?? innerHeight)
        const values = {
          alt: image.alt,
          src: image.getAttribute('src'),
          loading: image.getAttribute('loading'),
          error: state === 'error',
          ready:
            state === 'ready' &&
            image.complete &&
            image.naturalWidth > 0 &&
            image.currentSrc === new URL(check.src, location.href).href,
          inside:
            rect.bottom > top && rect.top < bottom && rect.right > 0 && rect.left < innerWidth,
        }
        return Object.fromEntries(Object.keys(check).map((key) => [key, values[key]]))
      }),
    expected,
  )
}

// What an expect step with "layer" reads on the Web, where a layer is not part of the page:
// "modal" is what the open sheet or dialog shows, over a page that is inert; "popover" is the
// page and then the open popovers and menus, which the Web moves to the end of the document.
// The Mac and NativeScript read both through the same tree as any other text.
async function webLayer(page, step) {
  const read = await page.evaluate((kind) => {
    const shown = (element) =>
      !element.id.endsWith('-message') &&
      !element.closest('[aria-hidden="true"]') &&
      !element.closest('[inert]') &&
      !element.closest('[role="button"], .m-card[data-m-card-interactive]')
    const texts = (root, selector) => [...root.querySelectorAll(selector)].filter(shown)
    const modal = [...document.querySelectorAll('dialog[open]')]
      .filter((dialog) => dialog.matches(':modal'))
      .at(-1)
    const found =
      kind === 'modal'
        ? modal
          ? texts(modal, '.m-text, .m-dialog-title, .m-dialog-description')
          : []
        : [
            ...texts(document.getElementById('app'), '.m-text').filter(
              (element) => !element.closest('dialog') && !element.closest('.m-popover-panel'),
            ),
            ...(kind === 'toast'
              ? texts(document, '.m-toast-title, .m-toast-message')
              : texts(document, '.m-popover-panel .m-text')),
          ]
    return found.map((element) => ({
      text: element.getAttribute('aria-label') ?? element.textContent,
      heading: /^H[1-6]$/.test(element.tagName),
    }))
  }, step.layer)
  const state = { texts: read.map((item) => item.text) }
  if (step.headings) state.headings = read.filter((item) => item.heading).map((item) => item.text)
  return state
}

async function webState(page, step) {
  // Cards are represented by their action label, while their child controls remain queryable.
  // The action button is now a sibling of the content, so exclude the owning card's text.
  // A badge is a text too: NativeScript draws it as one, and the Mac reads it as one.
  const read = await page.locator('#app .m-text, #app .m-badge').evaluateAll((elements) =>
    elements
      // Field messages and select sheets belong to their field; leaving content is hidden.
      .filter(
        (element) =>
          !element.id.endsWith('-message') &&
          !element.closest('dialog') &&
          !element.closest('[aria-hidden="true"]') &&
          !element.closest('[inert]') &&
          !element.closest('[role="button"], .m-card[data-m-card-interactive]'),
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
      .locator('#app .m-card > .m-card-action')
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

async function runNativeScript(platform) {
  assert.ok(['ios', 'android'].includes(platform), '--nativescript ios or --nativescript android')
  const prepareOnly = process.argv.includes('--prepare-only')
  const device =
    platform === 'ios' ? process.env.MAVIS_IOS_SIMULATOR : process.env.MAVIS_ANDROID_DEVICE
  if (!prepareOnly)
    assert.ok(device, `Set ${platform === 'ios' ? 'MAVIS_IOS_SIMULATOR' : 'MAVIS_ANDROID_DEVICE'}.`)
  const dir = join(artifacts, 'nativescript')
  const id = 'org.nativescript.portablecheck'
  // The creator's NativeScript app, with this checkout's packages.
  const { projectFiles } = await import(
    pathToFileURL(join(root, 'packages/create-mavis/src/scaffold.mjs'))
  )
  const { files } = await projectFiles({
    name: 'portable-check',
    targets: 'web,native',
  })
  const { versions } = await import(
    pathToFileURL(join(root, 'packages/create-mavis/src/presets.mjs'))
  )
  const nativeRouter = versions.nativeRouter
  const packages = JSON.parse(
    readFileSync(join(root, 'artifacts/release/packages/manifest.json'), 'utf8'),
  )
  mkdirSync(dir, { recursive: true })
  // npm may keep an installed file dependency when its path and version stay the
  // same, even after that tarball is rebuilt. Give each payload its own path so a
  // replay cannot silently execute an older renderer at the current source SHA.
  const tarball = (name) => {
    const entry = packages.find((p) => p.name === name)
    const source = join(root, 'artifacts/release/packages', entry.filename)
    const digest = createHash('sha256').update(readFileSync(source)).digest('hex')
    const target = join(dir, '.mavis-packages', `${digest}-${entry.filename}`)
    mkdirSync(join(target, '..'), { recursive: true })
    if (!existsSync(target)) cpSync(source, target)
    return `file:${target}`
  }
  for (const [file, text] of files) {
    if (!file.startsWith('apps/mobile/') || file.startsWith('apps/mobile/src/')) continue
    const target = join(dir, file.slice('apps/mobile/'.length))
    mkdirSync(join(target, '..'), { recursive: true })
    let content = text
    if (file === 'apps/mobile/package.json') {
      const pkg = JSON.parse(text)
      for (const name of ['@getcortexlabs/mavis', '@getcortexlabs/mavis-core'])
        pkg.dependencies[name] = tarball(name)
      // Fixtures with a route table run on vue-router-ns, as an app with routes does.
      if (routed().length) pkg.dependencies['vue-router-ns'] = nativeRouter
      content = `${JSON.stringify(pkg, null, 2)}\n`
    }
    writeFileSync(target, content)
  }
  const installed = join(dir, 'node_modules/.mavis-install')
  const stamp = createHash('sha256')
    .update(readFileSync(join(dir, 'package.json')))
    .update(packages.map((p) => p.integrity ?? p.shasum ?? p.filename).join())
    .digest('hex')
  if (!prepareOnly && (!existsSync(installed) || readFileSync(installed, 'utf8') !== stamp)) {
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
  copyPictures(join(dir, 'src/assets'))
  for (const fixture of touched) {
    const target = join(dir, 'src/fixtures', fixture.name)
    mkdirSync(target, { recursive: true })
    putAll(target, fixture, true)
  }
  writeFileSync(
    join(dir, 'src/fixtures.ts'),
    [
      ...touched.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      ...touched.flatMap((fixture) =>
        fixture.host
          ? [
              `import { install as install${pascal(fixture.name)} } from './fixtures/${fixture.name}/${hostPath(fixture)}'`,
            ]
          : [],
      ),
      `export const hosts: Array<(app: import('vue').App) => void> = [${touched.flatMap((fixture) => (fixture.host ? [`install${pascal(fixture.name)}`] : [])).join(', ')}]`,
      `export const fixtures = [`,
      ...touched.map(
        (fixture) =>
          `  { name: ${JSON.stringify(fixture.name)}, component: ${pascal(fixture.name)}, screen: ${fixture.screen}, steps: ${JSON.stringify(fixture.steps.map((step) => (step.paint ? { ...step, is: themeColor(step.is) } : step)))} },`,
      ),
      ']',
      '',
    ].join('\n'),
  )
  nativeNavigation(dir, touched)
  if (prepareOnly) {
    console.log(
      `Prepared NativeScript sources (${touched.length} fixtures); no dependency install, build or device run.`,
    )
    return
  }
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

// What the NativeScript app needs for the fixtures that navigate: the app's router, to which a
// fixture adds its routes while it runs (see test/portable-native/App.vue), and each one's
// route table and destinations. Without such a fixture nothing is installed.
function nativeNavigation(dir, touched) {
  const navigating = touched.filter(navigationOf)
  writeFileSync(
    join(dir, 'src/navigation.ts'),
    navigating.length
      ? [
          "import { createRouter, RouterView, type RouteRecordRaw } from 'vue-router-ns'",
          "import { createRouterNavigation } from '@getcortexlabs/mavis-core'",
          ...navigating.map(
            (fixture) =>
              `import { routes as ${fixture.name}Routes } from './fixtures/${fixture.name}/${routeTable(fixture).replace(/\.ts$/, '')}'`,
          ),
          '',
          'export const router = createRouter({ routes: [] })',
          'export const navigation = createRouterNavigation(router)',
          'export { RouterView }',
          'export const tables: Record<string, { routes: RouteRecordRaw[]; destinations: { label: string; href: string }[] }> = {',
          ...navigating.map(
            (fixture) =>
              `  ${fixture.name}: { routes: ${fixture.name}Routes, destinations: ${JSON.stringify(navigationOf(fixture).destinations.map(({ label, href }) => ({ label, href })))} },`,
          ),
          '}',
          '',
        ].join('\n')
      : [
          'export const router = undefined',
          'export const navigation = undefined',
          'export const RouterView = undefined',
          'export const tables: Record<string, { routes: never[]; destinations: { label: string; href: string }[] }> = {}',
          '',
        ].join('\n'),
  )
}
