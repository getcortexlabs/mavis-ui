import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { checkPortability } from './portability.mjs'
import { join } from 'node:path'
import { atLeast, checkPackageManager } from './package-manager.mjs'
import {
  availabilityLabel,
  availabilityOf,
  catalog,
  checkProject,
  normalizeConfig,
  requirements,
  targetLabel,
} from './capabilities.mjs'

export async function doctor(cwd = process.cwd()) {
  let config
  try {
    config = normalizeConfig(JSON.parse(await readFile(join(cwd, 'mavis.config.json'), 'utf8')))
  } catch {
    throw new Error('Run --doctor from a generated project containing mavis.config.json.')
  }
  // The same check the creator runs before writing a project, on what this one records.
  const project = checkProject({
    name: config.name,
    targets: config.targets,
    web: config.web ?? undefined,
    rendering: config.rendering ?? undefined,
    framework: config.framework,
    authoring: config.authoring,
    example: config.example,
    theme: config.theme,
    packageManager: config.packageManager,
  })
  const results = [
    {
      name: 'Project configuration',
      ok: project.ok,
      detail: project.ok
        ? `${targetLabel(config.targets)} · ${catalog.authoring[config.authoring].label} · ${availabilityLabel(availabilityOf(config))}`
        : project.message.split('\n')[0],
    },
    {
      name: `Node.js ${requirements.node}+`,
      ok: atLeast(process.versions.node, requirements.node),
      detail: process.version,
    },
    checkPackageManager(config.packageManager ?? 'npm'),
  ]
  if (config.target === 'macos') {
    const result =
      process.platform === 'darwin'
        ? spawnSync('xcrun', ['swift', '--version'], { encoding: 'utf8', timeout: 10000 })
        : null
    results.push({
      name: 'SwiftUI build host',
      ok: result?.status === 0,
      detail: result
        ? (result.error?.message ?? (result.stdout || result.stderr)).trim().split('\n')[0]
        : 'macOS 14+ and Xcode are required for the native app. Web remains available.',
    })
    // Use the compiler installed in this project, not a copied implementation.
    try {
      const compiler = await import(
        pathToFileURL(
          createRequire(join(cwd, 'package.json')).resolve('@getcortexlabs/mavis-compiler'),
        )
      )
      const { model } = await compiler.compileProject(
        await compiler.readShared(cwd, { roots: config.portability?.roots }),
        {
          theme: config.theme,
          root: config.portability?.entry ?? 'Welcome',
        },
      )
      results.push({
        name: 'Shared sources',
        ok: true,
        detail: `${model.components.length} component(s) type-checked for ${config.targets.join(', ')}. Run generate to write them; this does not prove a build.`,
      })
    } catch (error) {
      results.push({
        name: 'Shared sources',
        ok: false,
        detail:
          error.code === 'ERR_MODULE_NOT_FOUND'
            ? 'Install the project dependencies, then run doctor again.'
            : error.message,
      })
    }
    if (config.targets.includes('native')) nativeChecks(results)
    return results
  }
  if (config.target !== 'web') nativeChecks(results)
  const portability = await checkPortability(cwd)
  results.push({
    name: 'Shared source portability',
    ok: portability.diagnostics.length === 0,
    detail: `${portability.files.length} files, ${portability.diagnostics.length} findings. Run --check-portability for locations and suggestions.`,
  })
  return results
}

function nativeChecks(results) {
  const probe = (name, command, args) => {
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000 })
    results.push({
      name,
      ok: result.status === 0,
      detail: (result.error?.message ?? (result.stdout || result.stderr || 'No output'))
        .trim()
        .split('\n')[0],
    })
  }
  probe('NativeScript CLI', process.platform === 'win32' ? 'ns.cmd' : 'ns', ['--version'])
  probe('Java (Android)', 'java', ['-version'])
  results.push({
    name: 'Android SDK',
    ok: Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT),
    detail: 'Set ANDROID_HOME for Android builds.',
  })
  if (process.platform === 'darwin') probe('Xcode (iOS)', 'xcodebuild', ['-version'])
  else
    results.push({
      name: 'iOS host',
      ok: false,
      detail: 'iOS builds require macOS and Xcode; Android remains available.',
    })
}
