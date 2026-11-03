#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { readFile } from 'node:fs/promises'
import { scaffold, installProject } from './scaffold.mjs'
import { checkPortability } from './portability.mjs'
import { doctor } from './doctor.mjs'
import { checkPackageManager, detectPackageManager } from './package-manager.mjs'
import { resolvePreset } from './presets.mjs'
import { nextSteps, projectSummary, sharedEntry, terminalUI, wizard } from './ui.mjs'

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const help = `Create Mavis — Vue Web, Nuxt and NativeScript

  npm create @getcortexlabs/mavis@latest
  create-mavis my-app --target both --web nuxt --package-manager pnpm --no-install

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
  --package-manager npm|pnpm|yarn
                               Default: the invoking manager, or npm
  --framework vue              Vue is currently supported
  --authoring vue              Vue templates are currently supported
  --yes, -y                    Use defaults without prompts (skip installation)
  --install / --no-install     Install dependencies now or later
  --dry-run                    Show the complete file plan without writing
  --doctor                     Check a generated project's prerequisites
  --version, -v                Show the creator version
  --help, -h                   Show this help

Use arrow keys and Enter in the wizard. Choose Back to revisit an answer.
Ctrl-C or Escape cancels. Existing directories are never overwritten.
`

const cancellation = new AbortController()
const cancel = () => cancellation.abort()
const interactive = Boolean(
  process.stdin.isTTY && process.stdout.isTTY && process.env.TERM !== 'dumb' && !process.env.CI,
)
const ui = terminalUI(interactive)
let plan
process.once('SIGINT', cancel)
process.once('SIGTERM', cancel)
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
      'package-manager': { type: 'string' },
      yes: { type: 'boolean', short: 'y' },
      install: { type: 'boolean' },
      'no-install': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      doctor: { type: 'boolean' },
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help) console.log(help)
  else if (values.version) console.log(version)
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
    const [major, minor] = process.versions.node.split('.').map(Number)
    if (major < 22 || (major === 22 && minor < 16))
      throw new Error(`Mavis needs Node.js 22.16 or newer. You are using ${process.version}.`)
    let options = {
      ...values,
      name: positionals[0],
      packageManager: values['package-manager'],
      install: values['no-install'] ? false : values.install,
      dryRun: Boolean(values['dry-run']),
    }
    resolvePreset({ ...options, name: options.name ?? 'my-mavis-app' })
    ui.intro(version)
    const useWizard = interactive && !values.yes && !options.dryRun
    if (useWizard) options = await wizard(options, cancellation.signal)
    if (!options) {
      ui.cancel('Cancelled. No files written.')
      process.exitCode = 130
    } else {
      if (!options.name)
        throw new Error('Provide a project name in non-interactive mode. Use --help for examples.')
      options.packageManager ??= detectPackageManager()
      if (options.install && !options.dryRun && !useWizard) {
        const manager = checkPackageManager(options.packageManager)
        if (!manager.ok)
          throw new Error(
            `${manager.detail}\nUse --no-install to create the project and install later.`,
          )
      }
      plan = await scaffold({ ...options, signal: cancellation.signal })
      ui.message(`${options.dryRun ? 'Planned' : 'Created'} ${plan.destination}`)
      if (options.dryRun) {
        console.log(projectSummary(plan.preset, options.install))
        for (const file of plan.files.keys()) console.log(`  ${file}`)
      } else {
        if (options.install)
          await installProject(plan, {
            signal: cancellation.signal,
            onProgress: (directory) =>
              ui.message(
                `Installing with ${plan.preset.packageManager}${directory === '.' ? '' : ` in ${directory}`}…`,
              ),
          })
        ui.note(nextSteps(plan.preset, options.install), 'Next steps')
        ui.message(`Make it yours: ${sharedEntry(plan.preset)}`)
        if (plan.preset.target !== 'web')
          ui.message(
            'Mobile needs the NativeScript CLI and platform SDKs. Check your setup with --doctor.',
          )
        ui.success('Your Mavis project is ready. Happy building!')
      }
    }
  }
} catch (error) {
  if (cancellation.signal.aborted) {
    ui.cancel(
      plan
        ? `Cancelled. Project files are preserved in ${plan.destination}.`
        : 'Cancelled. No files written.',
    )
    if (plan) ui.note(nextSteps(plan.preset), 'Resume when ready')
    process.exitCode = 130
  } else {
    ui.error(error.message)
    process.exitCode = 1
  }
} finally {
  process.off('SIGINT', cancel)
  process.off('SIGTERM', cancel)
}
