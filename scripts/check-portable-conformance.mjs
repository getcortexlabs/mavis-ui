// Runs every fixture in test/portable through the portable compiler, then replays its
// steps.json on the generated Vue (Chromium and WebKit) and the generated SwiftUI app
// (XCUITest on macOS). Both outputs must show the same texts after every step.
//
//   node scripts/check-portable-conformance.mjs --web --native
//   MAVIS_FIXTURES=form node scripts/check-portable-conformance.mjs --native
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const compilerDir = join(root, 'packages/create-mavis/templates/macos/scripts/portable')
const { compileProject } = await import(pathToFileURL(join(compilerDir, 'index.mjs')))
const { swiftString } = await import(pathToFileURL(join(compilerDir, 'emit-swift.mjs')))
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

const swiftKeys = {
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
  const script = JSON.parse(readFileSync(join(folder, 'steps.json'), 'utf8'))
  const shared = join(folder, 'shared')
  const files = new Map(
    readdirSync(shared).map((file) => [`shared/${file}`, readFileSync(join(shared, file), 'utf8')]),
  )
  const output = await compileProject(files, {
    theme,
    root: script.root,
    namespace: `${pascal(name)}Fixture`,
  })
  fixtures.push({ name, ...script, output })
}
const report = {
  theme,
  fixtures: fixtures.map(({ name, root: component, steps, covers }) => ({
    name,
    root: component,
    covers,
    steps: steps.length,
  })),
  web: {},
  native: null,
}
const save = () =>
  writeFileSync(join(artifacts, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
save()
console.log(`Compiled ${fixtures.length} fixtures.`)

if (process.argv.includes('--web')) await runWeb()
if (process.argv.includes('--native')) runNative()
save()
console.log(`Portable conformance passed. Report: ${join(artifacts, 'report.json')}`)

async function runWeb() {
  const dir = join(artifacts, 'web')
  rmSync(dir, { recursive: true, force: true })
  for (const fixture of fixtures) {
    const target = join(dir, 'fixtures', fixture.name)
    mkdirSync(target, { recursive: true })
    for (const [file, text] of fixture.output.vue) writeFileSync(join(target, file), text)
  }
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><title>Mavis conformance</title></head><body><main id="app"></main><script type="module" src="/main.js"></script></body></html>\n',
  )
  writeFileSync(
    join(dir, 'main.js'),
    [
      "import { createApp } from 'vue'",
      "import { createMavisServices } from '@getcortexlabs/mavis-web/services'",
      `import { MColumn, MRow, MText, MButton, MInput, MCheckbox, MSelect, ${theme} } from '@getcortexlabs/mavis-web'`,
      "import '@getcortexlabs/mavis-web/style.css'",
      ...fixtures.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      `const roots = { ${fixtures.map((fixture) => `${fixture.name}: ${pascal(fixture.name)}`).join(', ')} }`,
      'const app = createApp(roots[location.hash.slice(1)])',
      'for (const [name, component] of Object.entries({ MColumn, MRow, MText, MButton, MInput, MCheckbox, MSelect })) app.component(name, component)',
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
        for (const fixture of fixtures) {
          const page = await browser.newPage({ viewport: { width: 900, height: 1200 } })
          const errors = []
          let current = 'load'
          page.on('pageerror', (error) => errors.push(`step ${current}: ${error.message}`))
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning')
              errors.push(`step ${current}: ${message.text()}`)
          })
          await page.goto(`${url}#${fixture.name}`)
          for (const [index, step] of fixture.steps.entries()) {
            const where = `${fixture.name} step ${index} (${engineName})`
            current = index
            if (step.expect) {
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
          report.web[`${fixture.name}/${engineName}`] = 'passed'
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

// The parts of the screen a step checks: visible texts, and optionally fields and focus.
function expectation(step) {
  return {
    texts: step.expect,
    ...(step.fields ? { fields: step.fields } : {}),
    ...('focused' in step ? { focused: step.focused } : {}),
  }
}

async function webStep(page, step) {
  if (step.click) {
    await page
      .getByRole('button', { name: step.click, exact: true })
      .nth(step.nth ?? 0)
      .click({ timeout: 5000 })
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
    await page.keyboard.press(webKeys[step.press] ?? step.press)
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

async function webState(page, step) {
  const texts = await page.locator('#app .m-text').evaluateAll((elements) =>
    elements
      // Field messages and select sheets belong to their field.
      .filter((element) => !element.id.endsWith('-message') && !element.closest('dialog'))
      .map((element) => element.textContent),
  )
  const state = { texts }
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

function swiftStep(step, index) {
  if (step.click) return `click(app, ${swiftString(step.click)}, ${step.nth ?? 0}, step: ${index})`
  if (step.type !== undefined)
    return `type(app, ${swiftString(step.type)}, ${swiftString(step.text)}, replace: false, step: ${index})`
  if (step.replace !== undefined)
    return `type(app, ${swiftString(step.replace)}, ${swiftString(step.text)}, replace: true, step: ${index})`
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
  return `expect(app, [${step.expect.map(swiftString).join(', ')}], fields: [${fields.join(', ')}], focused: ${focused}, step: ${index})`
}

function runNative() {
  assert.equal(process.platform, 'darwin', '--native needs macOS and Xcode.')
  const dir = join(artifacts, 'native')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, 'Sources'), { recursive: true })
  mkdirSync(join(dir, 'UITests'), { recursive: true })
  for (const fixture of fixtures)
    for (const [file, text] of fixture.output.swift) {
      // Runtime and theme tokens are identical for every fixture.
      const shared = ['MavisRuntime.swift', 'MavisTokens.swift', 'MavisControls.swift'].includes(
        file,
      )
      writeFileSync(join(dir, 'Sources', shared ? file : `${pascal(fixture.name)}${file}`), text)
    }
  writeFileSync(
    join(dir, 'Sources', 'ConformanceApp.swift'),
    `import SwiftUI

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
            .frame(minWidth: 760, minHeight: 980)
        }
        .defaultSize(width: 800, height: 1000)
    }
}

struct FixtureRoot: View {
    var body: some View {
        switch ProcessInfo.processInfo.environment["MAVIS_FIXTURE"] ?? "" {
${fixtures.map((fixture) => `        case ${swiftString(fixture.name)}: ${pascal(fixture.name)}Fixture.${fixture.root}()`).join('\n')}
        default: Text(verbatim: "Unknown fixture")
        }
    }
}
`,
  )
  const tests = fixtures.map((fixture) => {
    const lines = fixture.steps.map((step, index) => `        ${swiftStep(step, index)}`)
    return `    @MainActor func test${pascal(fixture.name)}() {
        let app = launch(${swiftString(fixture.name)})
${lines.join('\n')}
        app.terminate()
    }`
  })
  writeFileSync(
    join(dir, 'UITests', 'ConformanceUITests.swift'),
    `import XCTest

/// Generated from test/portable/*/steps.json. Each step clicks a button or compares every visible text.
final class ConformanceUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

${tests.join('\n\n')}

    @MainActor private func launch(_ fixture: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["MAVIS_FIXTURE"] = fixture
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
            if let match = find(app, label) { return match }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        XCTFail("step \\(step): field \\(label)", file: file, line: line)
        return app.windows.firstMatch
    }

    @MainActor private func focused(_ app: XCUIApplication) -> String? {
        let match = app.windows.firstMatch.descendants(matching: .any).matching(NSPredicate(format: "hasKeyboardFocus == true")).firstMatch
        guard match.exists else { return nil }
        return match.label.isEmpty ? text(match) : match.label
    }

    @MainActor private func fieldState(_ app: XCUIApplication, _ label: String, _ keys: [String]) -> [String: String] {
        guard let element = find(app, label) else { return ["missing": "true"] }
        let message = app.windows.firstMatch.staticTexts.matching(identifier: "mavis-message:" + label).firstMatch
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

    @MainActor private func expect(_ app: XCUIApplication, _ expected: [String], fields: [(String, [String: String])], focused expectedFocus: String??, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let deadline = Date().addingTimeInterval(5)
        func matches() -> Bool {
            texts(app) == expected
                && fields.allSatisfy { fieldState(app, $0.0, Array($0.1.keys)) == $0.1 }
                && (expectedFocus == nil || focused(app) == expectedFocus!)
        }
        while !matches() && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        XCTAssertEqual(texts(app), expected, "step \\(step)", file: file, line: line)
        for (label, state) in fields {
            XCTAssertEqual(fieldState(app, label, Array(state.keys)), state, "step \\(step): \\(label)", file: file, line: line)
        }
        if let expectedFocus {
            XCTAssertEqual(focused(app), expectedFocus, "step \\(step): focus", file: file, line: line)
        }
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
        // The stack's own padding, not a row's button.
        group.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.01)).click()
    }

    @MainActor private func click(_ app: XCUIApplication, _ name: String, _ nth: Int, step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let matches = app.windows.firstMatch.buttons.matching(NSPredicate(format: "label == %@ OR title == %@", name, name))
        let button = matches.element(boundBy: nth)
        XCTAssertTrue(button.waitForExistence(timeout: 5), "step \\(step): button \\(name)", file: file, line: line)
        button.click()
    }
}
`,
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
    report.native = Object.fromEntries(fixtures.map((fixture) => [fixture.name, 'passed']))
  } catch (error) {
    report.native = 'failed; see artifacts/portable/native/results.xcresult'
    save()
    throw error
  }
  console.log(`SwiftUI conformance passed on macOS (${fixtures.length} fixtures).`)
}
