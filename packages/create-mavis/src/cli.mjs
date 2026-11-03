#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { readFile } from 'node:fs/promises'
import { scaffold, installProject } from './scaffold.mjs'
import { doctor } from './doctor.mjs'
import { checkPackageManager, detectPackageManager } from './package-manager.mjs'
import { resolvePreset } from './presets.mjs'
import { nextSteps, projectSummary, terminalUI, wizard } from './ui.mjs'

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const help = `Create Mavis — Vue Web, Nuxt and NativeScript

  npm create @getcortexlabs/mavis@latest
  create-mavis my-app --target both --web nuxt --package-manager pnpm --no-install

  --target mobile|web|both       Default: web
  --web vite|nuxt               Default: vite
  --rendering client|ssr|ssg     Default: client (Vite), ssr (Nuxt)
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
  else if (values.doctor) {
    const results = await doctor()
    for (const item of results) console.log(`${item.ok ? '✓' : '—'} ${item.name}: ${item.detail}`)
    if (results.some((item) => !item.ok)) process.exitCode = 1
  } else {
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
    if (interactive && !values.yes && !options.dryRun)
      options = await wizard(options, cancellation.signal)
    if (!options) {
      ui.cancel('Cancelled. No files written.')
      process.exitCode = 130
    } else {
      if (!options.name)
        throw new Error('Provide a project name in non-interactive mode. Use --help for examples.')
      options.packageManager ??= detectPackageManager()
      if (options.install && !options.dryRun) {
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
        const shared = plan.preset.target === 'both'
        ui.message(
          `Make it yours: ${shared ? 'shared/Welcome.vue' : plan.preset.web === 'nuxt' ? 'app/shared/Welcome.vue' : 'src/shared/Welcome.vue'}`,
        )
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
