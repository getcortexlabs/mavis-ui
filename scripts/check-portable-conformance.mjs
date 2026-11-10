// Runs every fixture in test/portable through the portable compiler, then replays its
// steps.json on the generated Vue (Chromium and WebKit) and the generated SwiftUI app
// (XCUITest on macOS). Both outputs must show the same texts after every step.
//
//   node scripts/check-portable-conformance.mjs --web --native
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

const fixtures = []
for (const name of readdirSync(join(root, 'test/portable')).sort()) {
  const folder = join(root, 'test/portable', name)
  const script = JSON.parse(readFileSync(join(folder, 'steps.json'), 'utf8'))
  const shared = join(folder, 'shared')
  const files = new Map(
    readdirSync(shared).map((file) => [`shared/${file}`, readFileSync(join(shared, file), 'utf8')]),
  )
  const output = await compileProject(files, {
    root: script.root,
    namespace: `${pascal(name)}Fixture`,
  })
  fixtures.push({ name, ...script, output })
}
const report = {
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
      "import { MColumn, MRow, MText, MButton, mavis } from '@getcortexlabs/mavis-web'",
      "import '@getcortexlabs/mavis-web/style.css'",
      ...fixtures.map(
        (fixture) =>
          `import ${pascal(fixture.name)} from './fixtures/${fixture.name}/${fixture.root}.vue'`,
      ),
      `const roots = { ${fixtures.map((fixture) => `${fixture.name}: ${pascal(fixture.name)}`).join(', ')} }`,
      'const app = createApp(roots[location.hash.slice(1)])',
      'for (const [name, component] of Object.entries({ MColumn, MRow, MText, MButton })) app.component(name, component)',
      "app.use(createMavisServices({ theme: mavis, appearance: 'light' })).mount('#app')",
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
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('console', (message) => {
            if (message.type() === 'error' || message.type() === 'warning')
              errors.push(message.text())
          })
          await page.goto(`${url}#${fixture.name}`)
          const texts = () =>
            page
              .locator('#app .m-text')
              .evaluateAll((elements) => elements.map((element) => element.textContent))
          for (const [index, step] of fixture.steps.entries()) {
            const where = `${fixture.name} step ${index} (${engineName})`
            if (step.click) {
              await page
                .getByRole('button', { name: step.click, exact: true })
                .nth(step.nth ?? 0)
                .click({ timeout: 5000 })
              continue
            }
            const deadline = Date.now() + 5000
            let actual = await texts()
            while (
              JSON.stringify(actual) !== JSON.stringify(step.expect) &&
              Date.now() < deadline
            ) {
              await page.waitForTimeout(50)
              actual = await texts()
            }
            assert.deepEqual(actual, step.expect, where)
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

function runNative() {
  assert.equal(process.platform, 'darwin', '--native needs macOS and Xcode.')
  const dir = join(artifacts, 'native')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, 'Sources'), { recursive: true })
  mkdirSync(join(dir, 'UITests'), { recursive: true })
  for (const fixture of fixtures)
    for (const [file, text] of fixture.output.swift) {
      // Runtime and theme tokens are identical for every fixture.
      const shared = file === 'MavisRuntime.swift' || file === 'MavisTokens.swift'
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
    const lines = fixture.steps.map((step, index) =>
      step.click
        ? `        click(app, ${swiftString(step.click)}, ${step.nth ?? 0}, step: ${index})`
        : `        expect(app, [${step.expect.map(swiftString).join(', ')}], step: ${index})`,
    )
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

    @MainActor private func texts(_ app: XCUIApplication) -> [String] {
        // The window title is also a static text; read only the fixture's content.
        app.windows.firstMatch.scrollViews.firstMatch.staticTexts.allElementsBoundByIndex.map { element in
            let value = element.value as? String ?? ""
            return value.isEmpty ? element.label : value
        }
    }

    @MainActor private func expect(_ app: XCUIApplication, _ expected: [String], step: Int, file: StaticString = #filePath, line: UInt = #line) {
        let deadline = Date().addingTimeInterval(5)
        var actual = texts(app)
        while actual != expected && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
            actual = texts(app)
        }
        XCTAssertEqual(actual, expected, "step \\(step)", file: file, line: line)
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
