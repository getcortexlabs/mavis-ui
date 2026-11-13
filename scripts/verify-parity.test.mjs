import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { runStages } from './verify-parity.mjs'

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
