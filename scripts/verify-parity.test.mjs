import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { runStages, validationPlan } from './verify-parity.mjs'

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'mavis-parity-runner-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const output = join(cwd, 'reports')
  return { cwd, output, snapshot: () => ({ commit: 'fixed', changes: 'clean' }) }
}
const stage = (name, code, extra = {}) => ({
  name,
  command: process.execPath,
  args: ['-e', code],
  ...extra,
})

test('a failed check returns failure and skips subsequent checks', async (t) => {
  const options = fixture(t)
  assert.equal(
    await runStages({
      ...options,
      stages: [stage('types', 'process.exit(2)'), stage('web', 'process.exit(0)')],
    }),
    1,
  )
  const report = JSON.parse(readFileSync(join(options.output, 'summary.json')))
  assert.equal(report.passed, false)
  assert.equal(report.stages[0].exitCode, 2)
  assert.equal(report.stages[1].status, 'skipped')
})

test('each stage preserves its own evidence when later runs overwrite it', async (t) => {
  const options = fixture(t)
  const stages = ['web', 'offscreen'].map((name) =>
    stage(
      name,
      `require('node:fs').writeFileSync('report.json', JSON.stringify({ target: '${name}' }))`,
      { evidence: 'report.json' },
    ),
  )
  assert.equal(await runStages({ ...options, stages }), 0)
  for (const name of ['web', 'offscreen'])
    assert.equal(JSON.parse(readFileSync(join(options.output, name + '.json'))).target, name)
})

test('success cannot reuse an old evidence file', async (t) => {
  const options = fixture(t)
  const code =
    "const fs=require('node:fs'); fs.writeFileSync('report.json','{}'); fs.utimesSync('report.json',1,1)"
  assert.equal(
    await runStages({ ...options, stages: [stage('web', code, { evidence: 'report.json' })] }),
    1,
  )
})

test('a zero exit code cannot hide failed browser sessions', async (t) => {
  const options = fixture(t)
  const code = `require('node:fs').writeFileSync('report.json', JSON.stringify({ web: {
    'calendar/chromium': 'passed', 'calendar/webkit': { status: 'failed', diagnostic: 'paint conflict' }
  } }))`
  assert.equal(
    await runStages({ ...options, stages: [stage('web', code, { evidence: 'report.json' })] }),
    1,
  )
  const report = JSON.parse(readFileSync(join(options.output, 'summary.json')))
  assert.equal(report.stages[0].exitCode, 0)
  assert.equal(report.stages[0].status, 'failed')
  assert.equal(report.passed, false)
})

test('the pointer browser stage requires fresh successful evidence even after exit zero', async (t) => {
  const options = fixture(t)
  const code = `require('node:fs').writeFileSync('report.json', JSON.stringify({ passed: false }))`
  assert.equal(
    await runStages({ ...options, stages: [stage('browser', code, { evidence: 'report.json' })] }),
    1,
  )
  const report = JSON.parse(readFileSync(join(options.output, 'summary.json')))
  assert.equal(report.stages[0].status, 'failed')
  assert.equal(report.stages[0].exitCode, 0)
})

test('changing sources during validation invalidates a successful command', async (t) => {
  const options = fixture(t)
  let calls = 0
  assert.equal(
    await runStages({
      ...options,
      snapshot: () => ({ commit: String(calls++) }),
      stages: [stage('unit', 'process.exit(0)')],
    }),
    1,
  )
})

test('a missing command is a failure', async (t) => {
  const options = fixture(t)
  assert.equal(
    await runStages({
      ...options,
      stages: [{ name: 'types', command: join(options.cwd, 'missing'), args: [] }],
    }),
    1,
  )
})

test('independent target checks continue while preserving the failed result', async (t) => {
  const options = fixture(t)
  assert.equal(
    await runStages({
      ...options,
      stages: [
        stage('web', 'process.exit(1)', { continueAfterFailure: true }),
        stage('offscreen', 'process.exit(0)'),
      ],
    }),
    1,
  )
  const report = JSON.parse(readFileSync(join(options.output, 'summary.json')))
  assert.equal(report.passed, false)
  assert.deepEqual(
    report.stages.map((stage) => stage.status),
    ['failed', 'passed'],
  )
})

test('focused rounds restrict fixtures and unit files without claiming delivery validation', async (t) => {
  const options = fixture(t)
  mkdirSync(join(options.cwd, 'test/portable/calendar'), { recursive: true })
  writeFileSync(join(options.cwd, 'test/portable/calendar/steps.json'), '{}')
  writeFileSync(join(options.cwd, 'test/calendar.spec.ts'), '')
  const plan = validationPlan(['--focus=calendar', '--tests=test/calendar.spec.ts'], options.cwd)
  assert.deepEqual(plan.names, ['format', 'build', 'types', 'unit', 'offscreen', 'web'])
  assert.deepEqual(plan.tests, ['test/calendar.spec.ts'])
  assert.equal(plan.scope, 'focused')
  assert.equal(
    await runStages({
      ...options,
      scope: plan.scope,
      fixtures: plan.fixtures,
      stages: [
        stage(
          'web',
          `require('node:fs').writeFileSync('report.json', JSON.stringify({
      fixtures: process.env.MAVIS_FIXTURES, web: { 'calendar/chromium': 'passed' }
    }))`,
          { evidence: 'report.json' },
        ),
      ],
    }),
    0,
  )
  const report = JSON.parse(readFileSync(join(options.output, 'summary.json')))
  assert.equal(report.passed, true)
  assert.equal(report.fullValidation, false)
  assert.equal(report.fixtures, 'calendar')
  assert.equal(JSON.parse(readFileSync(join(options.output, 'web.json'))).fixtures, 'calendar')
})

test('typos and unsupported focused options cannot silently produce an empty green run', (t) => {
  const { cwd } = fixture(t)
  mkdirSync(join(cwd, 'test/portable/form'), { recursive: true })
  writeFileSync(join(cwd, 'test/portable/form/steps.json'), '{}')
  for (const args of [
    ['--focus='],
    ['--focus=missing'],
    ['--focus=form,form'],
    ['--focus=form', '--focus=form'],
    ['--focus=form', '--tests=test/missing.spec.ts'],
    ['--focus=form', '--tests=../outside.spec.ts'],
    ['--tests=test/form.spec.ts'],
    ['--focus=form', 'adoption'],
  ])
    assert.throws(() => validationPlan(args, cwd), undefined, args.join(' '))
})

test('only the unfiltered default plan requests full validation', () => {
  assert.equal(validationPlan([], undefined, {}).scope, 'full')
  assert.ok(validationPlan([], undefined, {}).names.includes('browser'))
  assert.equal(validationPlan([], undefined, { MAVIS_FIXTURES: 'form' }).scope, 'custom')
  assert.equal(validationPlan(['offscreen,web'], undefined, {}).scope, 'custom')
})

// A harness-only diagnostic does not need another build of unchanged JS packages.
test('offscreen diagnostics stay scoped and never count as full validation', (t) => {
  const { cwd } = fixture(t)
  mkdirSync(join(cwd, 'test/portable/calendar'), { recursive: true })
  writeFileSync(join(cwd, 'test/portable/calendar/steps.json'), '{}')
  const plan = validationPlan(['--focus=calendar', '--offscreen-only'], cwd)
  assert.deepEqual(plan.names, ['offscreen'])
  assert.equal(plan.scope, 'focused')
  assert.equal(plan.fixtures, 'calendar')
  assert.throws(() => validationPlan(['--offscreen-only'], cwd))
})
