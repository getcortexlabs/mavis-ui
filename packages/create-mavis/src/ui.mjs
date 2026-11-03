import { lstatSync } from 'node:fs'
import { resolve } from 'node:path'
import * as prompts from '@clack/prompts'
import {
  checkPackageManager,
  detectPackageManager,
  packageCommands,
  packageManagers,
} from './package-manager.mjs'
import { resolvePreset, validateProjectName } from './presets.mjs'

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
  const web = preset.web === 'nuxt' ? `Nuxt · ${preset.rendering.toUpperCase()}` : 'Vue + Vite'
  return [
    `Project   ${preset.name}`,
    `Platform  ${preset.target === 'mobile' ? 'iOS + Android' : preset.target === 'both' ? `${web} + iOS + Android` : web}`,
    `Theme     ${preset.theme === 'midnight' ? 'Midnight · dark' : 'Mavis · light'}`,
    `Packages  ${preset.packageManager} · ${install ? 'install now' : 'install later'}`,
  ].join('\n')
}

export function nextSteps(preset, installed = false) {
  const commands = packageCommands(preset.packageManager)
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
  const back = Symbol('back')
  const steps = [
    { key: 'name', message: 'What is your project called?', fallback: 'my-mavis-app' },
    {
      key: 'target',
      message: 'Where will it run?',
      options: [
        { value: 'web', label: 'Web', hint: 'A website or web app' },
        {
          value: 'mobile',
          label: 'Mobile',
          hint: 'Native iOS and Android apps',
          disabled: initial.web === 'nuxt' || ['ssr', 'ssg'].includes(initial.rendering),
        },
        { value: 'both', label: 'Web + Mobile', hint: 'One shared screen, three platforms' },
      ],
    },
    {
      key: 'web',
      message: 'Choose your web setup',
      when: () => answers.target !== 'mobile',
      options: [
        {
          value: 'vite',
          label: 'Vue + Vite',
          hint: 'A client-side app, ready to build on',
          disabled: ['ssr', 'ssg'].includes(initial.rendering),
        },
        {
          value: 'nuxt',
          label: 'Nuxt',
          hint: 'Server rendering or a static website',
          disabled: initial.rendering === 'client',
        },
      ],
    },
    {
      key: 'rendering',
      message: 'How should Nuxt serve your pages?',
      when: () => answers.target !== 'mobile' && answers.web === 'nuxt',
      options: [
        { value: 'ssr', label: 'Server rendering', hint: 'Render pages on each request' },
        { value: 'ssg', label: 'Static generation', hint: 'Build pages ahead of time' },
      ],
    },
    {
      key: 'theme',
      message: 'Pick a starting theme',
      options: [
        { value: 'mavis', label: 'Mavis', hint: 'Light, warm and soft' },
        { value: 'midnight', label: 'Midnight', hint: 'Dark, calm and crisp' },
      ],
    },
    {
      key: 'packageManager',
      message: 'Which package manager?',
      fallback: detectPackageManager(),
      options: [
        { value: 'npm', label: 'npm', hint: 'Included with Node.js' },
        { value: 'pnpm', label: 'pnpm', hint: 'Fast installs, efficient disk usage · 10.26+' },
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
    const value = step.options
      ? await io.select({
          message,
          signal,
          initialValue: answers[step.key] ?? step.fallback,
          options: [
            ...step.options,
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
    if (value === back) {
      index = previous(index)
      continue
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
