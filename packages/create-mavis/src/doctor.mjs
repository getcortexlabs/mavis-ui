import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { checkPortability } from './portability.mjs'
import { join } from 'node:path'

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
  ]
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
