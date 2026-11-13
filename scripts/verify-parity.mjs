// Local integration checks with immutable, per-run evidence. No desktop UI automation.
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  closeSync,
  copyFileSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath
const plans = {
  format: ['npm', ['run', 'format:check']],
  build: ['npm', ['run', 'docs:build']],
  types: ['npm', ['run', 'typecheck']],
  unit: [node, ['node_modules/vitest/vitest.mjs', 'run', '--maxWorkers=2', '--testTimeout=120000']],
  web: [node, ['scripts/check-portable-conformance.mjs', '--web']],
  offscreen: [node, ['scripts/check-portable-conformance.mjs', '--offscreen']],
}

export function sourceSnapshot(cwd) {
  const git = (...args) => execFileSync('git', args, { cwd })
  const hash = createHash('sha256').update(git('diff', '--binary', 'HEAD'))
  for (const name of git('ls-files', '--others', '--exclude-standard', '-z')
    .toString()
    .split('\0')
    .filter(Boolean)
    .sort()) {
    hash
      .update(name)
      .update('\0')
      .update(readFileSync(join(cwd, name)))
      .update('\0')
  }
  return { commit: git('rev-parse', 'HEAD').toString().trim(), changes: hash.digest('hex') }
}

function execute(command, args, cwd, log) {
  return new Promise((done) => {
    const fd = openSync(log, 'w')
    const child = spawn(command, args, { cwd, stdio: ['ignore', fd, fd] })
    closeSync(fd)
    child.once('error', (error) => done({ exitCode: 1, error: error.message }))
    child.once('close', (code, signal) => done({ exitCode: code ?? 1, signal }))
  })
}

export async function runStages({ cwd, output, stages, snapshot = () => sourceSnapshot(cwd) }) {
  mkdirSync(output, { recursive: true })
  const report = {
    source: snapshot(),
    startedAt: new Date().toISOString(),
    fixtures: process.env.MAVIS_FIXTURES ?? null,
    theme: process.env.MAVIS_THEME ?? 'mavis',
    passed: false,
    stages: stages.map(({ name, command, args }) => ({ name, command, args, status: 'pending' })),
  }
  const save = () =>
    writeFileSync(join(output, 'summary.json'), JSON.stringify(report, null, 2) + '\n')
  save()
  for (const [index, stage] of stages.entries()) {
    const entry = report.stages[index]
    entry.status = 'running'
    entry.startedAt = new Date().toISOString()
    save()
    console.log(`Running ${stage.name}; log: ${join(output, stage.name + '.log')}`)
    const result = await execute(stage.command, stage.args, cwd, join(output, stage.name + '.log'))
    Object.assign(entry, result, { finishedAt: new Date().toISOString() })
    entry.status = result.exitCode === 0 ? 'passed' : 'failed'
    // The conformance runner overwrites report.json. Keep each successful stage's own report.
    if (stage.evidence) {
      try {
        const evidence = join(cwd, stage.evidence)
        if (statSync(evidence).mtimeMs < Date.parse(entry.startedAt))
          throw new Error('Evidence predates this stage')
        copyFileSync(evidence, join(output, stage.name + '.json'))
      } catch (error) {
        if (result.exitCode === 0) {
          entry.status = 'failed'
          entry.error = `Missing fresh evidence: ${error.message}`
        }
      }
    }
    console.log(`${entry.status.toUpperCase()}: ${stage.name}`)
    save()
    if (entry.status !== 'passed' && !stage.continueAfterFailure) break
  }
  report.finishedAt = new Date().toISOString()
  report.sourceChanged = JSON.stringify(snapshot()) !== JSON.stringify(report.source)
  for (const stage of report.stages) if (stage.status === 'pending') stage.status = 'skipped'
  report.passed = !report.sourceChanged && report.stages.every((stage) => stage.status === 'passed')
  save()
  console.log(`${report.passed ? 'PASS' : 'FAIL'}: ${join(output, 'summary.json')}`)
  return report.passed ? 0 : 1
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length > 1)
    throw new Error('Usage: node scripts/verify-parity.mjs [format,build,types,unit,web,offscreen]')
  const names = args[0]?.split(',') ?? Object.keys(plans)
  if (
    !names.length ||
    new Set(names).size !== names.length ||
    names.some((name) => !Object.hasOwn(plans, name))
  ) {
    throw new Error('Choose unique stages from: ' + Object.keys(plans).join(','))
  }
  const source = sourceSnapshot(root)
  const output = join(
    root,
    'artifacts/parity',
    `${new Date().toISOString().replaceAll(':', '-')}-${source.commit.slice(0, 7)}`,
  )
  return runStages({
    cwd: root,
    output,
    stages: names.map((name) => ({
      name,
      continueAfterFailure: name === 'web',
      command: plans[name][0],
      args: plans[name][1],
      ...(['web', 'offscreen'].includes(name)
        ? { evidence: 'artifacts/portable/report.json' }
        : {}),
    })),
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
