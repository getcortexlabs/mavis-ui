// Validate generated bootstrap scripts and renderer isolation with local fixture packages.
// Full published dependency builds are covered separately by check-project-creator.mjs.
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { packageCommands } from '../packages/create-mavis/src/package-manager.mjs'
import { scaffold } from '../packages/create-mavis/src/scaffold.mjs'
const manager = process.argv[2]
const root = await mkdtemp(join(tmpdir(), 'mavis-cli-workspaces-'))
const json = (v) => JSON.stringify(v, null, 2) + '\n'
try {
  const plan = await scaffold({ name: 'consumer', target: 'both', packageManager: manager }, root)
  for (const platform of ['web', 'mobile']) {
    const dependency = join(root, platform)
    await mkdir(dependency)
    await writeFile(
      join(dependency, 'package.json'),
      json({
        name: 'mavis-runtime-probe',
        version: platform === 'web' ? '1.0.0' : '2.0.0',
        main: 'index.cjs',
      }),
    )
    await writeFile(join(dependency, 'index.cjs'), `module.exports=${JSON.stringify(platform)}\n`)
    const host = join(plan.destination, 'apps', platform)
    const pkg = JSON.parse(await readFile(join(host, 'package.json'), 'utf8'))
    pkg.dependencies = { 'mavis-runtime-probe': `file:${dependency}` }
    delete pkg.devDependencies
    pkg.scripts = Object.fromEntries(Object.keys(pkg.scripts).map((s) => [s, 'node probe.cjs']))
    await writeFile(join(host, 'package.json'), json(pkg))
    await writeFile(
      join(host, 'probe.cjs'),
      `require('node:assert/strict').equal(require('mavis-runtime-probe'),${JSON.stringify(platform)});console.log(${JSON.stringify(platform + ' runtime isolated')})\n`,
    )
  }
  const env = {
    ...process.env,
    COREPACK_ENABLE_AUTO_PIN: '0',
    YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
    YARN_ENABLE_NETWORK: '0',
    YARN_ENABLE_TELEMETRY: '0',
    YARN_GLOBAL_FOLDER: join(root, 'yarn-cache'),
    npm_config_cache: join(root, 'npm-cache'),
    npm_config_offline: 'true',
    npm_config_update_notifier: 'false',
  }
  for (const command of packageCommands(manager).setup(true).split('\n'))
    execFileSync(manager, command.split(' ').slice(1), {
      cwd: plan.destination,
      env,
      stdio: 'inherit',
      timeout: 30000,
    })
  for (const script of ['install:apps', 'dev:web', 'android', 'ios'])
    execFileSync(manager, ['run', script], {
      cwd: plan.destination,
      env,
      stdio: 'inherit',
      timeout: 30000,
    })
  console.log(`${manager} real workspace commands and dependency isolation passed`)
} finally {
  await rm(root, { recursive: true, force: true })
}
