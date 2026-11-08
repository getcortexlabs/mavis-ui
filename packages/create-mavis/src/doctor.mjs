import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { checkPortability } from './portability.mjs'
import { join } from 'node:path'
import { checkPackageManager } from './package-manager.mjs'

export async function doctor(cwd = process.cwd()) {
  let config
  try {
    config = JSON.parse(await readFile(join(cwd, 'mavis.config.json'), 'utf8'))
  } catch {
    throw new Error('Run --doctor from a generated project containing mavis.config.json.')
  }
  const [major, minor] = process.versions.node.split('.').map(Number)
  const results = [
    {
      name: 'Node.js 22.16+',
      ok: major > 22 || (major === 22 && minor >= 16),
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
    const { validateSource } = await import('../templates/macos/scripts/portable.mjs')
    try {
      validateSource(await readFile(join(cwd, 'shared/Welcome.lite.tsx'), 'utf8'))
      results.push({
        name: 'Experimental source grammar',
        ok: true,
        detail:
          'Grammar accepted. Run generate to validate tokens and both outputs; this does not prove a native build.',
      })
    } catch (error) {
      results.push({ name: 'Experimental source grammar', ok: false, detail: error.message })
    }
    return results
  }
  if (config.target !== 'web') {
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
  const portability = await checkPortability(cwd)
  results.push({
    name: 'Shared source portability',
    ok: portability.diagnostics.length === 0,
    detail: `${portability.files.length} files, ${portability.diagnostics.length} findings. Run --check-portability for locations and suggestions.`,
  })
  return results
}
