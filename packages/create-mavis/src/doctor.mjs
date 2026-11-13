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
  const project = config.portability?.existing
    ? existingProject(config)
    : checkProject({
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
        ? `${targetLabel(config.targets)} · ${catalog.authoring[config.authoring].label} · ${config.portability?.existing ? 'existing application; experimental Mac target' : availabilityLabel(availabilityOf(config))}`
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
      results.push(...(await checkMacVersions(cwd, config, compiler)))
      compiler.macAppSettings(config.macos, config.name)
      const { model } = await compiler.compileProject(
        await compiler.readShared(cwd, { roots: config.portability?.roots }),
        {
          theme: config.theme,
          root: config.portability?.entry ?? 'Welcome',
        },
      )
      compiler.startupPlan(model, config.portability?.startup)
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

function existingProject(config) {
  const ok =
    Array.isArray(config.targets) &&
    config.targets.includes('macos') &&
    config.targets.every((target) => catalog.targets[target]) &&
    ['vue', 'mitosis'].includes(config.authoring) &&
    catalog.packageManagers.includes(config.packageManager) &&
    (!config.targets.includes('web') ||
      catalog.hosts[config.web]?.rendering?.includes(config.rendering))
  return {
    ok,
    message:
      'Invalid targets, authoring, package manager or Web host/rendering in mavis.config.json.',
  }
}

/** Read-only release alignment check, independent of the Swift/NativeScript SDK probes. */
export async function checkMacVersions(cwd, config, compiler) {
  const results = []
  const manifests = []
  for (const name of ['package.json', 'apps/web/package.json', 'apps/mobile/package.json']) {
    try {
      manifests.push(JSON.parse(await readFile(join(cwd, name), 'utf8')))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  const dependencies = manifests.map((pkg) => ({ ...pkg.devDependencies, ...pkg.dependencies }))
  const declared = dependencies[0]?.['@getcortexlabs/mavis-compiler']
  const expected = config.versions?.mavis ?? compiler.compilerVersion
  const renderers = dependencies.flatMap((dep) =>
    ['@getcortexlabs/mavis-core', '@getcortexlabs/mavis-web', '@getcortexlabs/mavis'].flatMap(
      (name) => (dep[name] ? [dep[name]] : []),
    ),
  )
  results.push({
    name: 'Mavis compiler version',
    ok:
      declared === compiler.compilerVersion &&
      compiler.compilerVersion === expected &&
      renderers.every((version) => [expected, '^' + expected, '~' + expected].includes(version)),
    detail: `Installed compiler ${compiler.compilerVersion}; requested ${declared ?? 'missing'}; Mavis ${expected}. Upgrade Mavis and the compiler together.`,
  })
  const jolts = dependencies.flatMap((dep) =>
    dep['@rafaelaugusto/jolt'] ? [dep['@rafaelaugusto/jolt']] : [],
  )
  const swift = await readFile(join(cwd, 'apps/macos/Package.swift'), 'utf8')
  const pin = /jolt-swift[^\n]*exact:\s*"([^"]+)"/.exec(swift)?.[1]
  const expectedJolt = config.versions?.jolt ?? compiler.joltSwift.version
  results.push({
    name: 'Jolt / SwiftUI version',
    ok:
      pin === expectedJolt &&
      pin === compiler.joltSwift.version &&
      jolts.every((version) => version === pin),
    detail: `Jolt ${[...new Set(jolts)].join(', ') || expectedJolt}; SwiftUI ${pin ?? 'missing exact pin'}; compiler expects ${compiler.joltSwift.version}.`,
  })
  return results
}
