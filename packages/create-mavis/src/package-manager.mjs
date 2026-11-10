import { spawn, spawnSync } from 'node:child_process'
import { catalog, requirements } from './capabilities.mjs'

export const packageManagers = catalog.packageManagers

export function detectPackageManager(userAgent = process.env.npm_config_user_agent ?? '') {
  const name = userAgent.split('/')[0]
  return packageManagers.includes(name) ? name : 'npm'
}

export function packageCommands(manager = 'npm') {
  if (!packageManagers.includes(manager))
    throw new Error('Package manager must be npm, pnpm or yarn.')
  const directoryFlag = { npm: '--prefix', pnpm: '--dir', yarn: '--cwd' }[manager]
  return {
    creator:
      manager === 'npm'
        ? 'npx @getcortexlabs/create-mavis'
        : `${manager} create @getcortexlabs/mavis`,
    install: `${manager} install`,
    setup: (shared) =>
      !shared
        ? `${manager} install`
        : manager === 'yarn'
          ? 'yarn install\nyarn --cwd apps/mobile install'
          : `${manager} run install:apps`,
    run: (script, directory) =>
      `${manager}${directory ? ` ${directoryFlag} ${directory}` : ''} run ${script}`,
    installAt: (directory) => `${manager} ${directoryFlag} ${directory} install`,
    lockfile: { npm: 'package-lock.json', pnpm: 'pnpm-lock.yaml', yarn: 'yarn.lock' }[manager],
  }
}

export function checkPackageManager(manager) {
  packageCommands(manager)
  const result = spawnSync(manager, ['--version'], {
    encoding: 'utf8',
    timeout: 10000,
    shell: process.platform === 'win32',
    env: { ...process.env, COREPACK_ENABLE_AUTO_PIN: '0' },
  })
  if (result.error?.code === 'ENOENT')
    return {
      name: manager,
      ok: false,
      detail: `${manager} was not found on this terminal's PATH. If you just changed your shell setup, restart the creator from the updated terminal.`,
    }
  if (result.error?.code === 'ETIMEDOUT')
    return {
      name: manager,
      ok: false,
      detail: `${manager} --version timed out after 10 seconds. Check its setup and try again.`,
    }
  if (result.error || result.status !== 0) {
    const detail = (
      result.error?.message ||
      result.stderr ||
      result.stdout ||
      `Exit ${result.status}`
    )
      .trim()
      .split('\n')[0]
    return { name: manager, ok: false, detail: `Could not run ${manager} --version: ${detail}` }
  }
  const version = result.stdout.trim().split('\n').at(-1)
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version))
    return {
      name: manager,
      ok: false,
      detail: `${manager} --version did not return a valid version.`,
    }
  const minimum = requirements.packageManagers[manager]
  const supported = !minimum || atLeast(version, minimum)
  return {
    name: manager,
    ok: supported,
    detail: supported ? version : `${manager} ${minimum}+ is required (found ${version}).`,
  }
}

/** Whether a major.minor version reaches a minimum such as 22.16. */
export function atLeast(version, minimum) {
  const [major, minor] = version.replace(/^v/, '').split('.').map(Number)
  const [wantedMajor, wantedMinor = 0] = minimum.split('.').map(Number)
  return major > wantedMajor || (major === wantedMajor && minor >= wantedMinor)
}

export async function runInstall(manager, cwd, signal) {
  packageCommands(manager)
  signal?.throwIfAborted()
  await new Promise((resolve, reject) => {
    const child = spawn(manager, ['install'], {
      cwd,
      stdio: 'inherit',
      // Commands and arguments are fixed; cwd is never interpolated into a shell command.
      shell: process.platform === 'win32',
      env: { ...process.env, COREPACK_ENABLE_AUTO_PIN: '0' },
    })
    const abort = () => child.kill('SIGINT')
    signal?.addEventListener('abort', abort, { once: true })
    const cleanup = () => signal?.removeEventListener('abort', abort)
    child.once('error', (error) => {
      cleanup()
      reject(error)
    })
    child.once('close', (code, stopped) => {
      cleanup()
      if (signal?.aborted) reject(signal.reason)
      else if (code === 0) resolve()
      else reject(new Error(`${manager} install stopped (${stopped ?? code}).`))
    })
  })
}
