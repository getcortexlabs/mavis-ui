import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const chartPointerTitle = 'chart pointer preview leaves selection untouched until a click'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projects = ['chromium', 'webkit']

// Deliberately independent of the global config, which also starts documentation servers.
export function chartBrowserConfig(cwd, output, baseURL) {
  return {
    testDir: join(cwd, 'test/browser'),
    testMatch: 'wayfinding.browser.ts',
    forbidOnly: true,
    fullyParallel: true,
    retries: 0,
    workers: 2,
    timeout: 30_000,
    globalTimeout: 90_000,
    reporter: [['list'], ['json', { outputFile: join(output, 'playwright.json') }]],
    outputDir: join(output, 'test-results'),
    use: { baseURL, viewport: { width: 390, height: 844 }, trace: 'retain-on-failure' },
    projects: projects.map((name) => ({ name, use: { browserName: name } })),
  }
}

export function assertChartBrowserReport(report) {
  const tests = []
  const visit = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? [])
        for (const test of spec.tests ?? []) tests.push({ title: spec.title, ...test })
      visit(suite.suites)
    }
  }
  visit(report.suites)
  if (
    report.errors?.length ||
    tests.length !== projects.length ||
    projects.some((project) => tests.filter((test) => test.projectName === project).length !== 1) ||
    tests.some(
      (test) =>
        test.title !== chartPointerTitle ||
        test.expectedStatus !== 'passed' ||
        test.status !== 'expected' ||
        test.results?.length !== 1 ||
        test.results[0].status !== 'passed',
    )
  )
    throw new Error('The chart pointer test must pass once in both Chromium and WebKit')
  return tests.map(({ projectName, title }) => ({ project: projectName, title, status: 'passed' }))
}

async function startPreview(cwd) {
  const { preview } = await import('vite')
  // Port zero lets the OS atomically select a free port. This always creates our own server.
  const server = await preview({
    root: join(cwd, 'examples/catalog-web'),
    configFile: join(cwd, 'examples/catalog-web/vite.config.ts'),
    preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false },
  })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') {
    await server.close()
    throw new Error('The catalog preview did not acquire a TCP port')
  }
  return { baseURL: `http://127.0.0.1:${address.port}`, close: () => server.close() }
}

function runPlaywright(cwd, config) {
  return new Promise((done) => {
    const title = chartPointerTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const child = spawn(
      process.execPath,
      [
        join(cwd, 'node_modules/@playwright/test/cli.js'),
        'test',
        '--config',
        config,
        '--grep',
        `${title}$`,
      ],
      { cwd, stdio: 'inherit' },
    )
    child.once('error', (error) => done({ exitCode: 1, error: error.message }))
    child.once('close', (code, signal) => done({ exitCode: code ?? 1, signal }))
  })
}

export async function checkChartBrowser({
  cwd = root,
  output = join(cwd, 'artifacts/parity-browser'),
  preview = startPreview,
  run = runPlaywright,
} = {}) {
  mkdirSync(output, { recursive: true })
  const report = {
    startedAt: new Date().toISOString(),
    passed: false,
    projects,
    test: chartPointerTitle,
  }
  const save = () =>
    writeFileSync(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  save()
  let server
  try {
    // Programmatic Vite preview does not check that the build exists.
    if (
      !statSync(join(cwd, 'docs/.vitepress/dist/playground/index.html'), {
        throwIfNoEntry: false,
      })?.isFile()
    )
      throw new Error('Build the catalog with npm run docs:build before the browser stage')
    rmSync(join(output, 'playwright.json'), { force: true })
    server = await preview(cwd)
    report.baseURL = server.baseURL
    const config = join(output, 'playwright.config.mjs')
    writeFileSync(
      config,
      `export default ${JSON.stringify(chartBrowserConfig(cwd, output, server.baseURL), null, 2)}\n`,
    )
    Object.assign(report, await run(cwd, config))
    report.playwright = JSON.parse(readFileSync(join(output, 'playwright.json'), 'utf8'))
    report.tests = assertChartBrowserReport(report.playwright)
    if (report.exitCode !== 0) throw new Error(`Playwright exited with ${report.exitCode}`)
    report.passed = true
  } catch (error) {
    report.error = error.message
    console.error(error)
  } finally {
    try {
      await server?.close()
    } catch (error) {
      report.passed = false
      report.error = `Could not close the catalog preview: ${error.message}`
    }
    report.finishedAt = new Date().toISOString()
    save()
  }
  return report.passed ? 0 : 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  process.exitCode = await checkChartBrowser()
