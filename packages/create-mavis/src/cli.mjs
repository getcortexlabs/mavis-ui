#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { join } from 'node:path'
import { confirm, isCancel } from '@clack/prompts'
import { readFile } from 'node:fs/promises'
import { scaffold, installProject } from './scaffold.mjs'
import { planTarget, applyTarget } from './add-target.mjs'
import { planMacos, applyMacos } from './add-macos.mjs'
import { checkPortability, formatMacReadiness } from './portability.mjs'
import { doctor } from './doctor.mjs'
import {
  atLeast,
  checkPackageManager,
  detectPackageManager,
  packageCommands,
  runInstall,
} from './package-manager.mjs'
import { resolvePreset } from './presets.mjs'
import {
  chosenTargets,
  describeCapabilities,
  formatCapabilities,
  recommendation,
  requirements,
} from './capabilities.mjs'
import { nextSteps, projectSummary, sharedEntry, terminalUI, wizard } from './ui.mjs'

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const help = `Create Mavis — Web, Native (iOS/Android) and Mac in any combination

  npm create @getcortexlabs/mavis@latest
  create-mavis my-app --targets web,native,macos --package-manager pnpm --no-install
  create-mavis my-app --targets web,native --web nuxt

  --targets web,native,macos   Any combination; default: web. With macos, shared
                               screens are TSX compiled for every target (experimental)
  --target mobile|web|both|macos
                               Earlier names: native, web, web+native, web+macos
  --add-native                 Add apps/mobile to an existing Vue/Vite or Nuxt app
  --add-web                    Add apps/web to an existing NativeScript-Vue app
  --add-macos                  Preview adding SwiftUI to an existing app; --write applies
  --shared-root path           Source roots for --add-macos (comma-separated)
  --entry path.vue             Shared Vue/TSX entry for --add-macos
  --screen path.vue            Reuse an existing screen without moving it
  --screen-root screen|content Existing MScreen or content to wrap (auto-detected)
  --web vite|nuxt               Default: vite
  --rendering client|ssr|ssg     Default: client (Vite), ssr (Nuxt)
  --capabilities               Show what can be created, how each combination has been
                               validated and what is planned (add --json for tools)
  --familiar vue|react|angular|svelte|solid|other
                               What you already know. Changes the advice, not what runs
  --example welcome|directory|tasks
                               Starter, shared search/detail/edit reference, or the
                               Tasks app (with macos: one source for every target)
  --check-portability          Audit shared sources without SDK checks
  --path directory             Override the configured shared source directory
  --fix-imports                Preview safe renderer-import replacements
  --write                      Apply the previewed import migration or Mac target
  --json                       Machine-readable portability diagnostics
  --theme mavis|midnight        Default: mavis
  --package-manager npm|pnpm|yarn
                               Default: the invoking manager, or npm
  --framework vue              Vue is currently supported
  --authoring vue|mitosis      Follows the targets: mitosis (shared TSX) with macos
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
      targets: { type: 'string' },
      'add-native': { type: 'boolean' },
      'add-web': { type: 'boolean' },
      'add-macos': { type: 'boolean' },
      'shared-root': { type: 'string' },
      entry: { type: 'string' },
      screen: { type: 'string' },
      'screen-root': { type: 'string' },
      web: { type: 'string' },
      rendering: { type: 'string' },
      theme: { type: 'string' },
      example: { type: 'string' },
      capabilities: { type: 'boolean' },
      familiar: { type: 'string' },
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
  else if (values.capabilities)
    console.log(
      values.json ? JSON.stringify(describeCapabilities(), null, 2) : formatCapabilities(),
    )
  else if (values.version) console.log(version)
  else if (values['add-macos']) {
    if (
      positionals.length ||
      values['add-native'] ||
      values['add-web'] ||
      values.target ||
      values.targets ||
      values['check-portability'] ||
      values['fix-imports'] ||
      values.path ||
      values.doctor ||
      values.example ||
      values.theme ||
      values.framework ||
      values.authoring ||
      values.screen ||
      values['screen-root'] ||
      values.web ||
      values.rendering
    )
      throw new Error(
        'Run --add-macos in the existing project. Choose source roots with --shared-root and an entry with --entry.',
      )
    if (values.install || values['no-install'])
      throw new Error(
        '--add-macos does not install dependencies; review and apply with --write, then run your package manager.',
      )
    if (values.write && values['dry-run']) throw new Error('Choose --write or --dry-run, not both.')
    const plan = await planMacos({
      roots: values['shared-root']?.split(',').map((root) => root.trim()),
      entry: values.entry,
      packageManager: values['package-manager'],
    })
    const summary = {
      directory: 'apps/macos',
      entry: plan.entry,
      roots: plan.roots,
      manager: plan.manager,
      alreadyAdded: plan.alreadyAdded,
      components: plan.components,
      files: [...plan.files.keys()],
      config: plan.config,
      applied: Boolean(values.write && !plan.alreadyAdded),
    }
    if (values.write) await applyMacos(plan, { signal: cancellation.signal })
    if (values.json) console.log(JSON.stringify(summary, null, 2))
    else {
      ui.message(
        `${plan.alreadyAdded ? 'Already configured' : values.write ? 'Added' : 'Preview'}: SwiftUI in apps/macos; ${plan.components} shared components`,
      )
      for (const name of summary.files)
        console.log(`  ${plan.original.get(name) === undefined ? '+' : '~'} ${name}`)
      console.log(
        plan.alreadyAdded
          ? 'Existing files were preserved.'
          : values.write
            ? `Run ${packageCommands(plan.manager).install}, then ${packageCommands(plan.manager).run('build:macos')}.`
            : 'No files changed. Review this plan and rerun with --write to add Mac and migrate mavis.config.json to schema 2.',
      )
    }
  } else if (values['add-native'] || values['add-web']) {
    if (!atLeast(process.versions.node, requirements.node))
      throw new Error(
        `Mavis needs Node.js ${requirements.node} or newer. You are using ${process.version}.`,
      )
    if (values['add-native'] && values['add-web']) throw new Error('Add one target at a time.')
    if (
      positionals.length ||
      values.target ||
      values.targets ||
      values['check-portability'] ||
      values['fix-imports'] ||
      values.write ||
      values.path ||
      values.doctor ||
      values.example ||
      values.theme ||
      values.framework ||
      values.authoring
    )
      throw new Error(
        'Run --add-native or --add-web inside the existing host package, without create/audit options.',
      )
    if (values['add-native'] && (values.web || values.rendering))
      throw new Error('--web and --rendering belong to --add-web.')
    if (values.install && values['no-install'])
      throw new Error('Choose either --install or --no-install.')
    if (values.entry || values['shared-root'])
      throw new Error('--entry and --shared-root require --add-macos.')
    if (values['screen-root'] && !values.screen) throw new Error('--screen-root requires --screen.')
    const target = await planTarget({
      target: values['add-native'] ? 'mobile' : 'web',
      web: values.web,
      rendering: values.rendering,
      screen: values.screen,
      screenRoot: values['screen-root'],
      packageManager: values['package-manager'],
    })
    const summary = {
      host: target.host,
      directory: target.destination,
      manager: target.manager,
      screen: target.screen,
      alreadyAdded: target.alreadyAdded,
      create: [...target.files.keys()].map((file) => `${target.destination}/${file}`),
      packageScripts: target.scripts,
      diagnostics: target.diagnostics,
    }
    if (values.json) console.log(JSON.stringify(summary, null, 2))
    else {
      ui.message(
        `${target.alreadyAdded ? 'Already configured' : 'Plan'}: ${target.host} in ${target.destination} (${target.manager})`,
      )
      for (const file of summary.create) console.log(`  + ${file}`)
      if (!target.alreadyAdded)
        console.log(`  package.json: add scripts ${Object.keys(target.scripts).join(', ')}`)
      for (const item of target.diagnostics)
        console.log(`${item.file}:${item.line}:${item.column} [${item.code}] ${item.message}`)
    }
    if (!values['dry-run'] && !target.alreadyAdded) {
      if (values.install) {
        const manager = checkPackageManager(target.manager)
        if (!manager.ok)
          throw new Error(`${manager.detail}\nUse --no-install to add the host and install later.`)
      }
      const accepted =
        interactive && !values.yes
          ? await confirm({
              message: 'Add this host and the listed package scripts?',
              signal: cancellation.signal,
            })
          : true
      if (isCancel(accepted) || !accepted) process.exitCode = 130
      else {
        await applyTarget(target, { signal: cancellation.signal })
        if (values.install)
          await runInstall(
            target.manager,
            join(target.root, target.destination),
            cancellation.signal,
          )
        if (!values.json) {
          const commands = packageCommands(target.manager)
          ui.success(`Added ${target.destination}. Existing sources and lockfiles were preserved.`)
          ui.note(
            [
              ...(values.install
                ? []
                : [commands.run(target.host === 'mobile' ? 'install:mobile' : 'install:web')]),
              commands.run(target.host === 'mobile' ? 'ios' : 'dev:web'),
              ...(target.host === 'mobile' ? [commands.run('android')] : []),
              `Read ${target.destination}/README.md${target.diagnostics.length ? ' and resolve the portability findings before using the selected screen.' : '.'}`,
            ].join('\n'),
            'Next steps',
          )
        }
      }
    }
  } else if (values['check-portability'] || values['fix-imports']) {
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
      console.log(formatMacReadiness(result.macos))
    }
    // A project without a Mac target is only told; one with it has to be ready.
    const config = await readFile('mavis.config.json', 'utf8').then(JSON.parse, () => ({}))
    const blocked =
      config.targets?.includes('macos') && result.macos.files?.some((file) => !file.ready)
    if (result.diagnostics.length || blocked) process.exitCode = 1
  } else if (values.doctor) {
    const results = await doctor()
    for (const item of results) console.log(`${item.ok ? '✓' : '—'} ${item.name}: ${item.detail}`)
    if (results.some((item) => !item.ok)) process.exitCode = 1
  } else {
    if (values.entry || values['shared-root'])
      throw new Error('--entry and --shared-root require --add-macos.')
    if (values.screen || values['screen-root'])
      throw new Error('--screen requires --add-native or --add-web.')
    if (values.write || values.path || values.json)
      throw new Error('--write, --path and --json require --check-portability or --fix-imports.')
    if (positionals.length > 1) throw new Error('Provide one project name.')
    if (values.install && values['no-install'])
      throw new Error('Choose either --install or --no-install.')
    if (!atLeast(process.versions.node, requirements.node))
      throw new Error(
        `Mavis needs Node.js ${requirements.node} or newer. You are using ${process.version}.`,
      )
    let options = {
      ...values,
      name: positionals[0],
      packageManager: values['package-manager'],
      install: values['no-install'] ? false : values.install,
      dryRun: Boolean(values['dry-run']),
    }
    resolvePreset({ ...options, name: options.name ?? 'my-mavis-app' })
    ui.intro(version)
    // Advice for someone coming from another framework. It never changes what gets created.
    const advice = recommendation(values.familiar, chosenTargets(options))
    if (advice) ui.message(advice)
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
        if (plan.preset.target === 'macos')
          ui.message(
            `Experimental shared TSX: see the README for the supported subset.${plan.preset.targets.includes('macos') ? ' The Mac app needs macOS 14+ and Xcode.' : ''}${plan.preset.targets.includes('native') ? ' Native needs the NativeScript CLI and platform SDKs; check with --doctor.' : ''}`,
          )
        else if (plan.preset.target !== 'web')
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
