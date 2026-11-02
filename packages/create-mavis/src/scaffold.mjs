import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { resolvePreset, versions as v } from './presets.mjs'

const templates = fileURLToPath(new URL('../templates/', import.meta.url))
const json = (value) => `${JSON.stringify(value, null, 2)}\n`

async function copyTemplate(files, source, destination, replacements) {
  for (const entry of await readdir(join(templates, source), { withFileTypes: true })) {
    const from = join(source, entry.name),
      to = join(destination, entry.name.replace(/^_gitignore$/, '.gitignore'))
    if (entry.isDirectory()) await copyTemplate(files, from, to, replacements)
    else {
      let content = await readFile(join(templates, from), 'utf8')
      for (const [key, value] of Object.entries(replacements))
        content = content.replaceAll(`__MAVIS_${key}__`, value)
      files.set(to, content)
    }
  }
}

export async function projectFiles(options) {
  const preset = resolvePreset(options)
  const files = new Map()
  const shared = preset.target === 'both'
  const replacements = {
    NAME: preset.name,
    APPID: preset.name.replaceAll('-', ''),
    THEME: preset.theme,
    APPEARANCE: preset.theme === 'midnight' ? 'dark' : 'light',
    SHARED: shared ? '../../../shared' : './shared',
  }
  await copyTemplate(
    files,
    'shared',
    shared ? 'shared' : preset.web === 'nuxt' ? 'app/shared' : 'src/shared',
    replacements,
  )
  const webDir = shared ? 'apps/web' : ''
  const mobileDir = shared ? 'apps/mobile' : ''
  const common = { private: true, version: '0.0.0', engines: { node: '>=22.16' } }
  const dependencies = { '@getcortexlabs/mavis-core': v.mavis, '@rafaelaugusto/jolt': v.jolt }
  if (preset.target !== 'mobile') {
    await copyTemplate(files, preset.web, webDir, {
      ...replacements,
      SHARED: shared ? '../../../shared' : './shared',
    })
    const scripts =
      preset.web === 'vite'
        ? { dev: 'vite', build: 'vue-tsc --noEmit && vite build', preview: 'vite preview' }
        : {
            dev: 'nuxt dev',
            build: 'nuxt build',
            generate: 'nuxt generate',
            preview: 'nuxt preview',
            typecheck: 'nuxt typecheck',
            postinstall: 'nuxt prepare',
          }
    files.set(
      join(webDir, 'package.json'),
      json({
        ...common,
        name: `${preset.name}${shared ? '-web' : ''}`,
        type: 'module',
        scripts,
        dependencies: {
          ...dependencies,
          '@getcortexlabs/mavis-web': v.mavis,
          vue: v.vue,
          ...(preset.web === 'nuxt' ? { nuxt: v.nuxt } : {}),
        },
        devDependencies: {
          typescript: v.typescript,
          'vue-tsc': v.vueTsc,
          ...(preset.web === 'vite' ? { vite: v.vite, '@vitejs/plugin-vue': v.vuePlugin } : {}),
        },
      }),
    )
  }
  if (preset.target !== 'web') {
    await copyTemplate(files, 'mobile', mobileDir, {
      ...replacements,
      SHARED: shared ? '../../../shared' : './shared',
    })
    files.set(
      join(mobileDir, 'package.json'),
      json({
        ...common,
        name: `${preset.name}${shared ? '-mobile' : ''}`,
        main: 'src/app.ts',
        scripts: {
          android: 'ns run android',
          ios: 'ns run ios',
          'bundle:android': 'webpack --env android',
          'bundle:ios': 'webpack --env ios',
        },
        dependencies: {
          ...dependencies,
          '@getcortexlabs/mavis': v.mavis,
          '@nativescript/core': v.nativeCore,
          'nativescript-vue': v.nativeVue,
        },
        devDependencies: {
          '@nativescript/android': v.android,
          '@nativescript/ios': v.ios,
          '@nativescript/webpack': v.webpack,
          typescript: v.typescript,
        },
      }),
    )
  }
  if (shared)
    files.set(
      'package.json',
      json({
        ...common,
        name: preset.name,
        workspaces: ['apps/web'],
        scripts: {
          'dev:web': 'npm --prefix apps/web run dev',
          'build:web': `npm --prefix apps/web run ${preset.rendering === 'ssg' ? 'generate' : 'build'}`,
          android: 'npm --prefix apps/mobile run android',
          ios: 'npm --prefix apps/mobile run ios',
          'install:apps': 'npm install && npm --prefix apps/mobile install',
        },
      }),
    )
  files.set('mavis.config.json', json(preset))
  files.set(
    '.gitignore',
    'node_modules/\n.npm/\ndist/\n.nuxt/\n.output/\nplatforms/\nhooks/\n.DS_Store\n*.log\n',
  )
  const location = shared
    ? '`shared/Welcome.vue`'
    : preset.web === 'nuxt'
      ? '`app/shared/Welcome.vue`'
      : '`src/shared/Welcome.vue`'
  files.set(
    'README.md',
    `# ${preset.name}\n\nA Mavis ${preset.target === 'both' ? 'NativeScript + Web' : preset.target} application using Vue templates.\n\n## Start\n\n\`\`\`sh\n${shared ? 'npm run install:apps' : 'npm install'}\n${preset.target === 'mobile' ? 'npm run ios # or npm run android' : shared ? 'npm run dev:web' : 'npm run dev'}\n\`\`\`\n\nEdit ${location}. Its state and components are shared; each host provides the save service. The included service is a local demo and does not send data to a server.\n\n${preset.target !== 'web' ? 'Mobile requires the NativeScript CLI and the selected platform SDK. iOS builds require macOS/Xcode; Android requires a JDK and Android SDK. Run `ns doctor` inside the mobile app directory.\n\n' : ''}${preset.web === 'nuxt' ? 'Nuxt server rendering: `npm run build`. Static output: `npm run generate`. In a shared project, run these inside `apps/web`. The initial appearance is deterministic during hydration; device appearance is applied after mount.\n\n' : ''}${shared ? 'The native and DOM renderers have separate dependency trees so each uses its own Vue runtime. No compiler converts arbitrary Vue/React code.\n\n' : ''}Dependencies are pinned in package.json. Commit the lockfile generated by npm install. Mavis and Jolt are prereleases; see https://mavis-ui.getcortexlabs.com/ for current contracts.\n`,
  )
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}

export async function scaffold(options, cwd = process.cwd()) {
  options.signal?.throwIfAborted()
  const plan = await projectFiles(options)
  const destination = resolve(cwd, plan.preset.name)
  if (existsSync(destination))
    throw new Error(
      `Destination already exists: ${destination}. Choose a new directory; existing files are never overwritten.`,
    )
  if (options.dryRun) return { ...plan, destination }
  const staging = await mkdtemp(join(cwd, '.mavis-create-'))
  try {
    for (const [file, contents] of plan.files) {
      options.signal?.throwIfAborted()
      const output = resolve(staging, file)
      if (relative(staging, output).startsWith(`..${sep}`))
        throw new Error('Invalid template path.')
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, contents, { flag: 'wx' })
    }
    // The parent remains owned by the user; never merge into an existing destination.
    options.signal?.throwIfAborted()
    await mkdir(destination)
    const written = []
    try {
      for (const entry of await readdir(staging)) {
        options.signal?.throwIfAborted()
        await rename(join(staging, entry), join(destination, entry))
        written.push(entry)
      }
    } catch (error) {
      for (const entry of written)
        await rm(join(destination, entry), { recursive: true, force: true })
      // Leave anything independently added to the directory alone.
      await rmdir(destination).catch(() => {})
      throw error
    }
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
  return { ...plan, destination }
}

export async function installProject(plan) {
  const directories = plan.preset.target === 'both' ? ['', 'apps/mobile'] : ['']
  for (const directory of directories)
    await new Promise((resolve, reject) => {
      const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], {
        cwd: join(plan.destination, directory),
        stdio: 'inherit',
        shell: false,
      })
      child.on('error', reject)
      child.on('exit', (code, signal) =>
        code === 0
          ? resolve()
          : reject(
              new Error(
                `npm install stopped (${signal ?? code}). Project files were preserved; retry in ${join(plan.destination, directory)}.`,
              ),
            ),
      )
    })
}
