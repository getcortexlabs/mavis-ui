import { lstatSync } from 'node:fs'
import { resolve } from 'node:path'
import * as prompts from '@clack/prompts'
import {
  checkPackageManager,
  detectPackageManager,
  packageCommands,
  packageManagers,
} from './package-manager.mjs'
import { chosenTargets, resolvePreset, targetLabel, validateProjectName } from './presets.mjs'
import { availabilityLabel, catalog, requirements } from './capabilities.mjs'

// Wizard options come from the catalog, so prompts and flags accept the same things.
const choices = (family, names = Object.keys(family)) =>
  names.map((value) => ({ value, label: family[value].label, hint: family[value].hint }))
const status = (preset) =>
  preset.availability === 'published' ? [] : [`Status    ${availabilityLabel(preset.availability)}`]

export function validateDestination(name, cwd = process.cwd()) {
  const invalid = validateProjectName(name)
  if (invalid) return invalid
  try {
    lstatSync(resolve(cwd, name))
    return `The directory "${name}" already exists. Choose a new name.`
  } catch (error) {
    if (error.code !== 'ENOENT') return error.message
  }
}

export function projectSummary(preset, install) {
  if (preset.target === 'macos')
    return [
      `Project   ${preset.name}`,
      `Targets   ${targetLabel(preset.targets)} · EXPERIMENTAL`,
      `Hosts     ${[
        preset.targets.includes('web') &&
          (preset.web === 'nuxt' ? `Nuxt · ${preset.rendering.toUpperCase()}` : 'Vue + Vite'),
        preset.targets.includes('native') && 'NativeScript iOS + Android',
        preset.targets.includes('macos') && 'SwiftUI macOS',
      ]
        .filter(Boolean)
        .join(' · ')}`,
      preset.authoring === 'vue'
        ? 'Authoring Shared Vue (shared/*.vue), compiled to SwiftUI for Mac'
        : 'Authoring Shared TSX (shared/*.lite.tsx), compiled for each target',
      ...status(preset),
      preset.example === 'directory'
        ? 'Example   Search, details and editing · shared/Directory.vue'
        : preset.example === 'tasks'
          ? 'Example   Tasks · list and detail, forms, shortcuts and motion · shared/Tasks.lite.tsx'
          : 'Example   Basic welcome · shared/Welcome.lite.tsx',
      `Theme     ${preset.theme === 'midnight' ? 'Midnight · dark' : 'Mavis · light'}`,
      `Packages  ${preset.packageManager} · ${install ? 'install now' : 'install later'}`,
    ].join('\n')
  const web = preset.web === 'nuxt' ? `Nuxt · ${preset.rendering.toUpperCase()}` : 'Vue + Vite'
  return [
    `Project   ${preset.name}`,
    `Platform  ${preset.target === 'mobile' ? 'iOS + Android' : preset.target === 'both' ? `${web} + iOS + Android` : web}`,
    `Example   ${catalog.examples[preset.example].label}`,
    ...status(preset),
    `Theme     ${preset.theme === 'midnight' ? 'Midnight · dark' : 'Mavis · light'}`,
    `Packages  ${preset.packageManager} · ${install ? 'install now' : 'install later'}`,
  ].join('\n')
}

export function sharedEntry(preset) {
  if (preset.target === 'macos')
    return preset.example === 'directory'
      ? 'shared/Directory.vue'
      : `shared/${preset.example === 'tasks' ? 'Tasks' : 'Welcome'}.lite.tsx`
  const directory =
    preset.target === 'both' ? 'shared' : preset.web === 'nuxt' ? 'app/shared' : 'src/shared'
  return `${directory}/${preset.example === 'directory' ? 'Directory' : 'Welcome'}.vue`
}

export function nextSteps(preset, installed = false) {
  const commands = packageCommands(preset.packageManager)
  if (preset.target === 'macos') {
    const has = (target) => preset.targets.includes(target)
    return [
      `cd ${preset.name}`,
      ...(!installed ? [has('native') ? commands.setup(true) : commands.install] : []),
      ...(has('web') ? [commands.run('dev:web')] : []),
      ...(has('native') ? [commands.run('ios'), commands.run('android')] : []),
      ...(has('macos')
        ? [commands.run('macos'), 'macOS 14+ and Xcode required for the Mac app.']
        : []),
    ].join('\n')
  }
  return [
    `cd ${preset.name}`,
    ...(!installed ? [commands.setup(preset.target === 'both')] : []),
    preset.target === 'mobile'
      ? commands.run('ios')
      : preset.target === 'both'
        ? commands.run('dev:web')
        : commands.run('dev'),
    ...(preset.target !== 'web'
      ? [
          `${commands.run('android')}${preset.target === 'mobile' ? '  # or Android' : ''}`,
          ...(preset.target === 'both' ? [commands.run('ios')] : []),
        ]
      : []),
  ].join('\n')
}

export async function prepareInstallation(
  initial,
  signal,
  io = prompts,
  check = checkPackageManager,
) {
  const answers = { ...initial }
  while (answers.install) {
    signal?.throwIfAborted()
    const manager = await check(answers.packageManager)
    if (manager.ok) break
    io.log.warn(manager.detail)
    const action = await io.select({
      message: 'How would you like to continue?',
      signal,
      options: [
        {
          value: 'change',
          label: 'Choose another package manager',
          hint: 'Keep your project choices',
        },
        {
          value: 'skip',
          label: 'Create without installing',
          hint: `Keep ${answers.packageManager} and install later`,
        },
        { value: 'retry', label: 'Check again', hint: 'After making the command available' },
        { value: 'cancel', label: 'Cancel' },
      ],
    })
    if (io.isCancel(action) || action === 'cancel') return null
    if (action === 'skip') answers.install = false
    if (action === 'change') {
      const selected = await io.select({
        message: 'Choose a different package manager',
        signal,
        options: [
          ...packageManagers
            .filter((name) => name !== answers.packageManager)
            .map((name) => ({ value: name, label: name === 'yarn' ? 'Yarn' : name })),
          { value: 'back', label: '← Back' },
        ],
      })
      if (io.isCancel(selected)) return null
      if (selected !== 'back') answers.packageManager = selected
    }
  }
  return answers
}

export async function wizard(initial, signal, io = prompts, check = checkPackageManager) {
  let answers = { ...initial }
  const supplied = new Set(Object.keys(initial).filter((key) => initial[key] !== undefined))
  // --target and --targets both answer the targets question.
  if (initial.target !== undefined) supplied.add('targets')
  const targets = () => (answers.targets || answers.target ? chosenTargets(answers) : [])
  const back = Symbol('back')
  const steps = [
    { key: 'name', message: 'What is your project called?', fallback: 'my-mavis-app' },
    {
      key: 'targets',
      message: 'Where will it run? Space selects, Enter continues',
      multiple: true,
      fallback: ['web'],
      options: choices(catalog.targets),
    },
    {
      key: 'web',
      message: 'Choose your web setup',
      when: () => targets().includes('web'),
      // A --rendering flag leaves only the hosts that can serve it.
      options: choices(
        catalog.hosts,
        Object.keys(catalog.hosts).filter((host) => catalog.hosts[host].status !== 'planned'),
      ).map((option) => ({
        ...option,
        disabled:
          initial.rendering !== undefined &&
          !catalog.hosts[option.value].rendering.includes(initial.rendering),
      })),
    },
    {
      key: 'rendering',
      message: 'How should Nuxt serve your pages?',
      when: () => targets().includes('web') && answers.web === 'nuxt',
      options: choices(catalog.rendering, catalog.hosts.nuxt.rendering),
    },
    {
      key: 'example',
      message: 'Choose a starting example',
      fallback: 'welcome',
      // The examples written the way these targets are: Vue templates, or shared TSX with Mac.
      options: () =>
        choices(
          catalog.examples,
          Object.keys(catalog.examples).filter(
            (example) =>
              catalog.examples[example].authoring.includes(
                targets().includes('macos') ? 'mitosis' : 'vue',
              ) ||
              (targets().includes('macos') && catalog.examples[example].portableAuthoring),
          ),
        ),
    },
    {
      key: 'theme',
      message: 'Pick a starting theme',
      options: choices(catalog.themes),
    },
    {
      key: 'packageManager',
      message: 'Which package manager?',
      fallback: detectPackageManager(),
      options: [
        { value: 'npm', label: 'npm', hint: 'Included with Node.js' },
        {
          value: 'pnpm',
          label: 'pnpm',
          hint: `Fast installs, efficient disk usage · ${requirements.packageManagers.pnpm}+`,
        },
        { value: 'yarn', label: 'Yarn', hint: 'Classic or modern, with node_modules' },
      ],
    },
    {
      key: 'install',
      message: () => `Install dependencies with ${answers.packageManager}?`,
      options: [
        { value: true, label: 'Yes, get it ready', hint: 'Install after creating the project' },
        { value: false, label: 'Not now', hint: 'Show me the commands' },
      ],
    },
  ]
  const visible = (step) => !supplied.has(step.key) && (!step.when || step.when())
  const previous = (index) => {
    for (let at = index - 1; at >= 0; at--) if (visible(steps[at])) return at
    return -1
  }
  io.log.message(
    'A shared UI. Your choice of platform.\nUse ↑/↓ to choose, Enter to continue, Ctrl-C to cancel.',
  )
  for (let index = 0; ;) {
    if (index === steps.length) {
      answers = await prepareInstallation(answers, signal, io, check)
      if (!answers) return null
      const preset = resolvePreset(answers)
      io.note(projectSummary(preset, answers.install), 'Your project')
      const action = await io.select({
        message: 'Ready to create?',
        signal,
        options: [
          { value: 'create', label: 'Create project' },
          ...(previous(index) >= 0 ? [{ value: 'edit', label: 'Change choices' }] : []),
          { value: 'cancel', label: 'Cancel' },
        ],
      })
      if (io.isCancel(action) || action === 'cancel') return null
      if (action === 'create') return answers
      index = steps.findIndex(visible)
      continue
    }
    const step = steps[index]
    if (step.when && !step.when()) {
      if (!supplied.has(step.key)) delete answers[step.key]
      index++
      continue
    }
    if (supplied.has(step.key)) {
      index++
      continue
    }
    const message = typeof step.message === 'function' ? step.message() : step.message
    const options = typeof step.options === 'function' ? step.options() : step.options
    const value = step.multiple
      ? await io.multiselect({
          message,
          signal,
          required: true,
          initialValues: answers[step.key] ?? step.fallback,
          options: [
            ...options,
            ...(previous(index) >= 0 ? [{ value: back, label: '← Back' }] : []),
          ],
        })
      : options
        ? await io.select({
            message,
            signal,
            // An earlier answer may not exist for the targets chosen since.
            initialValue: options.some((option) => option.value === answers[step.key])
              ? answers[step.key]
              : step.fallback,
            options: [
              ...options,
              ...(previous(index) >= 0 ? [{ value: back, label: '← Back' }] : []),
            ],
          })
        : await io.text({
            message,
            signal,
            placeholder: step.fallback,
            defaultValue: step.fallback,
            initialValue: answers[step.key],
            validate: (value) =>
              value === 'cancel' ? undefined : validateDestination(value || step.fallback),
          })
    if (io.isCancel(value) || value === 'cancel') return null
    if (value === back || (Array.isArray(value) && value.includes(back))) {
      index = previous(index)
      continue
    }
    if (step.key === 'targets') {
      // Explain choices that don't fit together before going further, then ask again.
      try {
        // Only flags constrain the targets; later answers are asked again for these targets.
        resolvePreset({ ...initial, name: answers.name ?? 'my-mavis-app', targets: value })
      } catch (error) {
        io.log.warn(error.message)
        continue
      }
      if (value.includes('macos'))
        io.log.message(
          `The Mac app uses generated SwiftUI. Choose shared TSX or the Directory example with shared Vue screens. Web can use Vue + Vite or Nuxt.`,
        )
    }
    answers[step.key] = value
    index++
  }
}

export function terminalUI(interactive) {
  return {
    intro: (version) =>
      interactive && prompts.intro(`MAVIS  /  Create your next app  /  v${version}`),
    message: (message) => (interactive ? prompts.log.step(message) : console.log(message)),
    note: (message, title) =>
      interactive ? prompts.note(message, title) : console.log(`\n${title}\n${message}`),
    success: (message) => (interactive ? prompts.outro(message) : console.log(`\n${message}`)),
    cancel: (message) => (interactive ? prompts.cancel(message) : console.log(message)),
    error: (message) => (interactive ? prompts.log.error(message) : console.error(message)),
  }
}
