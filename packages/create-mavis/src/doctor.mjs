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
  versions,
} from './capabilities.mjs'

export async function doctor(cwd = process.cwd()) {
  let config
  try {
    config = normalizeConfig(JSON.parse(await readFile(join(cwd, 'mavis.config.json'), 'utf8')))
  } catch (error) {
    if (error.message.includes('archived SwiftUI')) throw error
    throw new Error('Run --doctor from a generated project containing mavis.config.json.')
  }
  // The same check the creator runs before writing a project, on what this one records.
  const project = checkRecordedProject(config)
  const results = [
    {
      name: 'Project configuration',
      ok: project.ok,
      detail: project.ok
        ? `${targetLabel(config.targets)} · ${catalog.authoring[config.authoring]?.label ?? config.framework} · ${config.portability?.existing ? 'existing application; experimental Mac target' : availabilityLabel(availabilityOf(config))}`
        : project.message.split('\n')[0],
    },
    {
      name: `Node.js ${requirements.node}+`,
      ok: atLeast(process.versions.node, requirements.node),
      detail: process.version,
    },
    checkPackageManager(config.packageManager ?? 'npm'),
  ]
  if (config.target === 'desktop') {
    results.push({
      name: 'Desktop Node.js 22.23.3+',
      ok: atLeast(process.versions.node, '22.23.3'),
      detail: process.version,
    })
    for (const target of ['macos', 'windows']) {
      if (!config.targets.includes(target)) continue
      const matching = process.platform === (target === 'macos' ? 'darwin' : 'win32')
      results.push({
        name: `${target} build host`,
        ok: matching && (target !== 'macos' || process.arch === 'arm64'),
        detail: requirements[target],
      })
      const name =
        target === 'macos' ? '@nativescript/macos-node-api' : '@nativescript/windows-napi'
      try {
        const manifest = JSON.parse(
          await readFile(join(cwd, 'apps', target, 'package.json'), 'utf8'),
        )
        const expected = config.versions?.[target === 'macos' ? 'macosNodeApi' : 'windowsNapi']
        const resolver = createRequire(join(cwd, 'apps', target, 'package.json'))
        // Resolve only. Importing a native runtime would open platform resources during a diagnostic.
        resolver.resolve(name)
        results.push({
          name: `${target} runtime`,
          ok: manifest.dependencies?.[name] === expected,
          detail: `${name} ${manifest.dependencies?.[name] ?? 'missing'}; expected ${expected}`,
        })
      } catch (error) {
        results.push({
          name: `${target} runtime`,
          ok: false,
          detail: `Install dependencies in apps/${target} on the matching OS. ${error.message.split('\n')[0]}`,
        })
      }
      if (matching && target === 'windows') {
        const { findManifestTool } = await import('../templates/desktop/windows/prepare-host.mjs')
        const tool = findManifestTool()
        results.push({
          name: 'Windows SDK Manifest Tool',
          ok: Boolean(tool),
          detail: tool ?? 'Install the Windows SDK, or set MAVIS_MT to mt.exe.',
        })
      }
      if (matching && target === 'macos') {
        const clang = spawnSync('xcrun', ['--find', 'clang'], { encoding: 'utf8', timeout: 10000 })
        results.push({
          name: 'AppKit packaging toolchain',
          ok: clang.status === 0,
          detail: (clang.error?.message ?? clang.stdout ?? clang.stderr).trim(),
        })
      }
    }
    if (config.targets.includes('native')) nativeChecks(results)
    results.push({
      name: 'Desktop component contract',
      ok: true,
      detail:
        'Experimental subset; build and run each host to validate its controls. --capabilities --json lists exact accepted props.',
    })
    return results
  }
  if (config.target !== 'web') nativeChecks(results)
  if (config.framework !== 'vue') {
    results.push({
      name: 'Direct native adapter',
      ok: true,
      detail: `${config.framework}: MBox, MRow, MColumn, MText, MButton and MInput. Run typecheck and bundle:ios/bundle:android in this project.`,
    })
    return results
  }
  const portability = await checkPortability(cwd)
  results.push({
    name: 'Shared source portability',
    ok: portability.diagnostics.length === 0,
    detail: `${portability.files.length} files, ${portability.diagnostics.length} findings. Run --check-portability for locations and suggestions.`,
  })
  return results
}

/** Configuration choices only; compiler diagnostics validate custom theme modules separately. */
export function checkRecordedProject(config) {
  if (config.desktop?.existing)
    return {
      ok:
        config.mode === 'direct' &&
        config.framework === 'vue' &&
        config.targets.every((target) => catalog.targets[target]),
      message: 'Invalid NativeScript desktop configuration.',
    }
  return checkProject({
    name: config.name,
    targets: config.targets,
    web: config.web ?? undefined,
    rendering: config.rendering ?? undefined,
    framework: config.framework,
    macosRuntime: config.macosRuntime,
    authoring: config.authoring,
    example: config.example,
    theme: config.theme,
    packageManager: config.packageManager,
  })
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
