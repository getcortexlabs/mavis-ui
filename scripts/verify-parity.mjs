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
  pack: [node, ['scripts/pack-release.mjs']],
  offscreen: [node, ['scripts/check-portable-conformance.mjs', '--offscreen']],
  directory: [node, ['scripts/check-directory-startup.mjs']],
  web: [node, ['scripts/check-portable-conformance.mjs', '--web']],
  browser: [node, ['scripts/check-chart-browser.mjs']],
  adoption: [node, ['scripts/check-macos-adoption.mjs']],
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

function execute(command, args, cwd, log, env) {
  return new Promise((done) => {
    const fd = openSync(log, 'w')
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', fd, fd] })
    closeSync(fd)
    child.once('error', (error) => done({ exitCode: 1, error: error.message }))
    child.once('close', (code, signal) => done({ exitCode: code ?? 1, signal }))
  })
}

export async function runStages({
  cwd,
  output,
  stages,
  snapshot = () => sourceSnapshot(cwd),
  scope = 'custom',
  fixtures = process.env.MAVIS_FIXTURES ?? null,
}) {
  mkdirSync(output, { recursive: true })
  const report = {
    source: snapshot(),
    startedAt: new Date().toISOString(),
    scope,
    fixtures,
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
    const result = await execute(
      stage.command,
      stage.args,
      cwd,
      join(output, stage.name + '.log'),
      {
        ...process.env,
        ...(fixtures ? { MAVIS_FIXTURES: fixtures } : {}),
      },
    )
    Object.assign(entry, result, { finishedAt: new Date().toISOString() })
    entry.status = result.exitCode === 0 ? 'passed' : 'failed'
    // The conformance runner overwrites report.json. Keep each successful stage's own report.
    if (stage.evidence) {
      try {
        const evidence = join(cwd, stage.evidence)
        if (statSync(evidence).mtimeMs < Date.parse(entry.startedAt))
          throw new Error('Evidence predates this stage')
        copyFileSync(evidence, join(output, stage.name + '.json'))
        const recorded = JSON.parse(readFileSync(evidence, 'utf8'))
        if (stage.name === 'web' && recorded.web) {
          const failed = Object.entries(recorded.web).filter(([, result]) => result !== 'passed')
          if (failed.length) throw new Error(`${failed.length} browser sessions did not pass`)
        }
        if (stage.name === 'browser' && recorded.passed !== true)
          throw new Error('The chart pointer browser test did not pass')
      } catch (error) {
        if (result.exitCode === 0) {
          entry.status = 'failed'
          entry.error = `Invalid stage evidence: ${error.message}`
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
  report.fullValidation =
    report.passed &&
    scope === 'full' &&
    !fixtures &&
    Object.keys(plans).every((name) => report.stages.some((stage) => stage.name === name))
  save()
  console.log(`${report.passed ? 'PASS' : 'FAIL'} (${scope}): ${join(output, 'summary.json')}`)
  return report.passed ? 0 : 1
}

// Focused rounds compile only the requested fixtures and skip unrelated delivery checks.
// A full round is still required once the batch of corrections is complete.
export function validationPlan(args, cwd = root, environment = process.env) {
  const focused = args.some((arg) => arg.startsWith('--focus='))
  if (focused) {
    if (
      args.filter((arg) => arg.startsWith('--focus=')).length !== 1 ||
      args.filter((arg) => arg.startsWith('--tests=')).length > 1 ||
      args.some((arg) => !arg.startsWith('--focus=') && !arg.startsWith('--tests='))
    )
      throw new Error('Use --focus=fixture,fixture [--tests=test/file.spec.ts,...]')
    const fixtures = args
      .find((arg) => arg.startsWith('--focus='))
      .slice(8)
      .split(',')
    for (const name of fixtures) {
      if (
        !/^[A-Za-z][A-Za-z0-9]*$/.test(name) ||
        !statSync(join(cwd, 'test/portable', name, 'steps.json'), {
          throwIfNoEntry: false,
        })?.isFile()
      )
        throw new Error(`Unknown fixture: ${name}`)
    }
    if (new Set(fixtures).size !== fixtures.length) throw new Error('Duplicate focused fixture')
    const tests =
      args
        .find((arg) => arg.startsWith('--tests='))
        ?.slice(8)
        .split(',') ?? []
    for (const file of tests) {
      if (
        !/^test\/[A-Za-z0-9_/-]+\.spec\.ts$/.test(file) ||
        !statSync(join(cwd, file), { throwIfNoEntry: false })?.isFile()
      )
        throw new Error(`Unknown test file: ${file}`)
    }
    return {
      scope: 'focused',
      fixtures: fixtures.join(','),
      tests,
      names: ['format', 'build', 'types', 'unit', 'offscreen', 'web'],
    }
  }
  if (args.length > 1 || args.some((arg) => arg.startsWith('--')))
    throw new Error(
      'Use [stage,stage,...] or --focus=fixture,fixture [--tests=test/file.spec.ts,...]',
    )
  const names = args[0]?.split(',') ?? Object.keys(plans)
  if (
    !names.length ||
    new Set(names).size !== names.length ||
    names.some((name) => !Object.hasOwn(plans, name))
  ) {
    throw new Error('Choose unique stages from: ' + Object.keys(plans).join(','))
  }
  return {
    names,
    scope: args.length || environment.MAVIS_FIXTURES ? 'custom' : 'full',
    fixtures: environment.MAVIS_FIXTURES ?? null,
    tests: [],
  }
}

async function main() {
  const plan = validationPlan(process.argv.slice(2))
  const source = sourceSnapshot(root)
  const output = join(
    root,
    'artifacts/parity',
    `${new Date().toISOString().replaceAll(':', '-')}-${source.commit.slice(0, 7)}`,
  )
  return runStages({
    cwd: root,
    output,
    scope: plan.scope,
    fixtures: plan.fixtures,
    stages: plan.names.map((name) => ({
      name,
      continueAfterFailure:
        ['web', 'browser', 'offscreen', 'directory'].includes(name) ||
        (plan.scope === 'focused' && name === 'unit'),
      command: plans[name][0],
      args:
        name === 'build' && plan.scope === 'focused'
          ? ['run', 'build']
          : name === 'unit'
            ? [...plans[name][1], ...plan.tests]
            : plans[name][1],
      ...(['web', 'offscreen'].includes(name)
        ? { evidence: 'artifacts/portable/report.json' }
        : {}),
      ...(name === 'directory' ? { evidence: 'artifacts/directory-startup/result.json' } : {}),
      ...(name === 'browser' ? { evidence: 'artifacts/parity-browser/result.json' } : {}),
      ...(name === 'adoption' ? { evidence: 'artifacts/macos-adoption/latest.json' } : {}),
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
