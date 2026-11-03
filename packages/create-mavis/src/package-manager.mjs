import { spawn, spawnSync } from 'node:child_process'

export const packageManagers = ['npm', 'pnpm', 'yarn']

export function detectPackageManager(userAgent = process.env.npm_config_user_agent ?? '') {
  const name = userAgent.split('/')[0]
  return packageManagers.includes(name) ? name : 'npm'
}

export function packageCommands(manager = 'npm') {
  if (!packageManagers.includes(manager))
    throw new Error('Package manager must be npm, pnpm or yarn.')
  const directoryFlag = { npm: '--prefix', pnpm: '--dir', yarn: '--cwd' }[manager]
  return {
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
  const [major, minor] = version.split('.').map(Number)
  const supported = manager !== 'pnpm' || major > 10 || (major === 10 && minor >= 26)
  return {
    name: manager,
    ok: supported,
    detail: supported ? version : `pnpm 10.26+ is required (found ${version}).`,
  }
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
