#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { createInterface } from 'node:readline/promises'
import { scaffold, installProject } from './scaffold.mjs'
import { checkPortability } from './portability.mjs'
import { doctor } from './doctor.mjs'

const help = `Create Mavis — Vue Web, Nuxt and NativeScript

  create-mavis [name] [options]
  create-mavis my-app --target both --web nuxt --rendering ssr --no-install

  --target mobile|web|both       Default: web
  --web vite|nuxt               Default: vite
  --rendering client|ssr|ssg     Default: client (Vite), ssr (Nuxt)
  --example welcome|directory  Starter or shared search/detail/edit reference
  --check-portability          Audit shared sources without SDK checks
  --path directory             Override the configured shared source directory
  --fix-imports                Preview safe renderer-import replacements
  --write                      Apply the previewed import migration
  --json                       Machine-readable portability diagnostics
  --theme mavis|midnight        Default: mavis
  --framework vue              Other adapters are planned, not generated
  --authoring vue              Portable JSX/React-style authoring is planned
  --yes                        Use defaults without prompts
  --install / --no-install     npm is the supported package manager
  --dry-run                    Show the complete file plan without writing
  --doctor                     Check the current generated project prerequisites
  --help                       Show this help

Interactive prompts accept "back" or "cancel". Existing directories are never overwritten.
`

async function wizard(initial, signal) {
  const answers = { ...initial }
  const supplied = new Set(Object.keys(initial).filter((key) => initial[key] !== undefined))
  const io = createInterface({ input: process.stdin, output: process.stdout })
  const steps = [
    { key: 'name', question: 'Project name', fallback: 'my-mavis-app' },
    {
      key: 'target',
      question: 'Where will it run? 1 Web · 2 Mobile · 3 Mobile + Web',
      choices: ['web', 'mobile', 'both'],
    },
    {
      key: 'web',
      question: 'Web host? 1 Vue + Vite · 2 Nuxt',
      choices: ['vite', 'nuxt'],
      when: () => answers.target !== 'mobile',
    },
    {
      key: 'rendering',
      question: 'Rendering? 1 Server rendering · 2 Static generation',
      choices: ['ssr', 'ssg'],
      when: () => answers.target !== 'mobile' && answers.web === 'nuxt',
    },
    {
      key: 'example',
      question: 'Example? 1 Welcome · 2 Search, details and editing',
      choices: ['welcome', 'directory'],
    },
    {
      key: 'theme',
      question: 'Initial theme? 1 Mavis · 2 Midnight',
      choices: ['mavis', 'midnight'],
    },
    {
      key: 'install',
      question: 'Install dependencies with npm? 1 No · 2 Yes',
      choices: [false, true],
    },
  ]
  console.log(
    'Vue templates are available today. React-style authoring for Vue is on the roadmap.\n',
  )
  try {
    for (let index = 0; index < steps.length;) {
      const step = steps[index]
      if (supplied.has(step.key)) {
        index++
        continue
      }
      if (step.when && !step.when()) {
        delete answers[step.key]
        index++
        continue
      }
      const value = (
        await io.question(`${step.question} [${answers[step.key] ?? step.fallback ?? '1'}]: `, {
          signal,
        })
      ).trim()
      if (value.toLowerCase() === 'cancel') return null
      if (value.toLowerCase() === 'back') {
        do {
          index = Math.max(0, index - 1)
        } while (
          index > 0 &&
          (supplied.has(steps[index].key) || (steps[index].when && !steps[index].when()))
        )
        continue
      }
      if (step.choices) {
        const selection =
          value === '' ? (answers[step.key] ?? step.choices[0]) : step.choices[Number(value) - 1]
        if (selection === undefined) {
          console.log('Choose one of the numbered options.')
          continue
        }
        answers[step.key] = selection
      } else answers[step.key] = value || answers[step.key] || step.fallback
      index++
    }
  } finally {
    io.close()
  }
  return answers
}

const cancellation = new AbortController()
const cancel = () => cancellation.abort()
process.once('SIGINT', cancel)
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      target: { type: 'string' },
      web: { type: 'string' },
      rendering: { type: 'string' },
      theme: { type: 'string' },
      example: { type: 'string' },
      'check-portability': { type: 'boolean' },
      path: { type: 'string' },
      'fix-imports': { type: 'boolean' },
      write: { type: 'boolean' },
      json: { type: 'boolean' },
      framework: { type: 'string' },
      authoring: { type: 'string' },
      yes: { type: 'boolean' },
      install: { type: 'boolean' },
      'no-install': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      doctor: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help) console.log(help)
  else if (values['check-portability'] || values['fix-imports']) {
    if (values.write && !values['fix-imports']) throw new Error('--write requires --fix-imports.')
    const result = await checkPortability(process.cwd(), {
      path: values.path,
      fixImports: values['fix-imports'],
      write: values.write,
    })
    if (values.json) console.log(JSON.stringify(result, null, 2))
    else {
      for (const item of result.diagnostics)
        console.log(`${item.file}:${item.line}:${item.column} [${item.code}] ${item.message}`)
      for (const fix of result.fixes)
        console.log(
          `${result.written ? 'Updated' : 'Would update'} ${fix.file}: renderer import → #mavis`,
        )
      console.log(
        `${result.files.length} files checked; ${result.diagnostics.length} findings. ${values['fix-imports'] && !values.write ? 'Preview only. Use --write to apply safe import changes.' : ''}`,
      )
    }
    if (result.diagnostics.length) process.exitCode = 1
  } else if (values.doctor) {
    const results = await doctor()
    for (const item of results) console.log(`${item.ok ? '✓' : '—'} ${item.name}: ${item.detail}`)
    if (results.some((item) => !item.ok)) process.exitCode = 1
  } else {
    if (values.write || values.path || values.json)
      throw new Error('--write, --path and --json require --check-portability or --fix-imports.')
    if (positionals.length > 1) throw new Error('Provide one project name.')
    if (values.install && values['no-install'])
      throw new Error('Choose either --install or --no-install.')
    let options = {
      ...values,
      name: positionals[0],
      install: values['no-install'] ? false : values.install,
      dryRun: Boolean(values['dry-run']),
    }
    if (process.stdin.isTTY && process.stdout.isTTY && !values.yes && !values['dry-run'])
      options = await wizard(options, cancellation.signal)
    if (!options) console.log('Cancelled. No files written.')
    else {
      if (!options.name)
        throw new Error('Provide a project name in non-interactive mode. Use --help for examples.')
      const plan = await scaffold({ ...options, signal: cancellation.signal })
      console.log(`${options.dryRun ? 'Planned' : 'Created'} ${plan.destination}`)
      for (const file of plan.files.keys()) console.log(`  ${file}`)
      if (options.install && !options.dryRun) await installProject(plan)
      if (!options.dryRun)
        console.log(
          `\ncd ${plan.preset.name}\n${options.install ? '' : plan.preset.target === 'both' ? 'npm run install:apps\n' : 'npm install\n'}${plan.preset.target === 'mobile' ? 'npm run ios # or npm run android' : plan.preset.target === 'both' ? 'npm run dev:web' : 'npm run dev'}`,
        )
    }
  }
} catch (error) {
  console.error(cancellation.signal.aborted ? '\nCancelled.' : `\n${error.message}`)
  process.exitCode = cancellation.signal.aborted ? 130 : 1
} finally {
  process.off('SIGINT', cancel)
}
