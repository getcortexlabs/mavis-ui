import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  assertChartBrowserReport,
  chartBrowserConfig,
  chartPointerTitle,
  checkChartBrowser,
} from './check-chart-browser.mjs'

function passedReport() {
  return {
    suites: [
      {
        suites: [
          {
            specs: [
              {
                title: chartPointerTitle,
                tests: ['chromium', 'webkit'].map((projectName) => ({
                  projectName,
                  expectedStatus: 'passed',
                  status: 'expected',
                  results: [{ status: 'passed' }],
                })),
              },
            ],
          },
        ],
      },
    ],
    errors: [],
  }
}

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'mavis-chart-browser-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  mkdirSync(join(cwd, 'docs/.vitepress/dist/playground'), { recursive: true })
  writeFileSync(join(cwd, 'docs/.vitepress/dist/playground/index.html'), '<html></html>')
  return { cwd, output: join(cwd, 'artifacts/parity-browser') }
}

test('the isolated config uses only the chart file and two browser workers without server reuse', () => {
  const config = chartBrowserConfig('/repo', '/report', 'http://127.0.0.1:43210')
  assert.equal(config.testMatch, 'wayfinding.browser.ts')
  assert.equal(config.workers, 2)
  assert.deepEqual(
    config.projects.map(({ name }) => name),
    ['chromium', 'webkit'],
  )
  assert.equal(config.use.baseURL, 'http://127.0.0.1:43210')
  assert.equal(config.webServer, undefined)
  assert.equal(config.retries, 0)
})

test('only an actual passed result for the exact test in both engines counts', () => {
  assert.equal(assertChartBrowserReport(passedReport()).length, 2)
  for (const change of [
    (r) => {
      r.suites = []
    },
    (r) => {
      r.errors = [{ message: 'server failed' }]
    },
    (r) => {
      r.suites[0].suites[0].specs[0].title = 'a different test'
    },
    (r) => {
      r.suites[0].suites[0].specs[0].tests.pop()
    },
    (r) => {
      r.suites[0].suites[0].specs[0].tests[1].projectName = 'chromium'
    },
    (r) => {
      r.suites[0].suites[0].specs[0].tests[1].results = [{ status: 'skipped' }]
    },
    (r) => {
      r.suites[0].suites[0].specs[0].tests[1].results = [{ status: 'failed' }, { status: 'passed' }]
    },
    (r) => {
      r.suites[0].suites[0].specs[0].tests[1].expectedStatus = 'failed'
    },
  ]) {
    const report = passedReport()
    change(report)
    assert.throws(() => assertChartBrowserReport(report))
  }
})

test('a fresh owned preview is closed and its complete JSON evidence is retained', async (t) => {
  const options = fixture(t)
  let starts = 0
  let closes = 0
  const exit = await checkChartBrowser({
    ...options,
    preview: async () => {
      starts++
      return {
        baseURL: 'http://127.0.0.1:43210',
        close: async () => {
          closes++
        },
      }
    },
    run: async (_cwd, config) => {
      assert.match(readFileSync(config, 'utf8'), /127\.0\.0\.1:43210/)
      writeFileSync(join(options.output, 'playwright.json'), JSON.stringify(passedReport()))
      return { exitCode: 0 }
    },
  })
  assert.equal(exit, 0)
  assert.equal(starts, 1)
  assert.equal(closes, 1)
  const saved = JSON.parse(readFileSync(join(options.output, 'result.json')))
  assert.equal(saved.passed, true)
  assert.deepEqual(saved.playwright, passedReport())
})

test('failed child exits and missing fresh evidence cannot borrow an old success', async (t) => {
  for (const mode of ['failed', 'missing', 'throw']) {
    const options = fixture(t)
    mkdirSync(options.output, { recursive: true })
    writeFileSync(join(options.output, 'playwright.json'), JSON.stringify(passedReport()))
    let closed = false
    assert.equal(
      await checkChartBrowser({
        ...options,
        preview: async () => ({
          baseURL: 'http://127.0.0.1:43210',
          close: async () => {
            closed = true
          },
        }),
        run: async () => {
          if (mode === 'throw') throw new Error('process could not start')
          if (mode === 'failed')
            writeFileSync(join(options.output, 'playwright.json'), JSON.stringify(passedReport()))
          return { exitCode: mode === 'failed' ? 7 : 0 }
        },
      }),
      1,
    )
    assert.equal(closed, true)
    assert.equal(JSON.parse(readFileSync(join(options.output, 'result.json'))).passed, false)
  }
})

test('missing build and preview startup failures preserve failure evidence', async (t) => {
  const options = fixture(t)
  let starts = 0
  const preview = async () => {
    starts++
    throw new Error('listen EPERM')
  }
  assert.equal(await checkChartBrowser({ ...options, preview }), 1)
  assert.match(JSON.parse(readFileSync(join(options.output, 'result.json'))).error, /listen EPERM/)
  rmSync(join(options.cwd, 'docs/.vitepress/dist/playground/index.html'))
  assert.equal(await checkChartBrowser({ ...options, preview }), 1)
  assert.equal(starts, 1)
})
