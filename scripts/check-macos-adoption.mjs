// Run from the authorized validation terminal after build + release:pack.
// Checks the actual RC.13 CLI output, explicit source migration, packed compiler,
// Nuxt SSR/SSG builds and Swift compilation. It never launches a Mac app.
// --prepare-only checks source migration with the checkout; it does not install or build.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { verifyInstalledArtifact } from './lib/installed-artifact.mjs'

const root = resolve(import.meta.dirname, '..')
const prepare = process.argv.includes('--prepare-only')
const artifacts = join(root, 'artifacts/macos-adoption')
await mkdir(artifacts, { recursive: true })
const work = await mkdtemp(join(artifacts, 'run-'))
const report = { passed: false, prepareOnly: prepare, work, cases: [] }
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const run = (command, args, cwd = work, capture = false) =>
  execFileSync(command, args, {
    cwd,
    env: process.env,
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  })
const put = async (path, text) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, text)
}
const json = async (path) => JSON.parse(await readFile(path, 'utf8'))
const digest = (text) => createHash('sha256').update(text).digest('hex')
async function snapshot(directory) {
  const out = {}
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true }))
    if (entry.isFile()) {
      const path = join(entry.parentPath, entry.name)
      out[path.slice(directory.length + 1)] = digest(await readFile(path))
    }
  return out
}

try {
  let cli = join(root, 'packages/create-mavis/src/cli.mjs')
  let compiler
  let packagePaths
  let artifactsByName
  const verify = (from, root, name, entry) =>
    verifyInstalledArtifact({ from, root, name, entry, artifact: artifactsByName[name] })
  let legacyParent = work
  if (prepare) compiler = await import('@getcortexlabs/mavis-compiler')
  else {
    const manifest = await json(join(root, 'artifacts/release/packages/manifest.json'))
    packagePaths = Object.fromEntries(
      manifest.map((entry) => [
        entry.name,
        join(root, 'artifacts/release/packages', entry.filename),
      ]),
    )
    artifactsByName = Object.fromEntries(
      manifest.map((entry) => [entry.name, { ...entry, path: packagePaths[entry.name] }]),
    )
    for (const name of [
      '@getcortexlabs/mavis-core',
      '@getcortexlabs/mavis-web',
      '@getcortexlabs/mavis',
      '@getcortexlabs/mavis-compiler',
      '@getcortexlabs/create-mavis',
    ])
      assert.ok(packagePaths[name], `Missing packed ${name}`)
    const creatorFiles = run(
      'tar',
      ['-tzf', packagePaths['@getcortexlabs/create-mavis']],
      work,
      true,
    )
    assert.ok(
      !creatorFiles.includes('templates/macos/scripts/portable/'),
      'Creator must use the compiler package instead of shipping another compiler copy',
    )
    const tool = join(work, 'tool')
    await put(
      join(tool, 'package.json'),
      JSON.stringify({
        private: true,
        type: 'module',
        dependencies: Object.fromEntries(
          [
            '@getcortexlabs/mavis-core',
            '@getcortexlabs/mavis-compiler',
            '@getcortexlabs/create-mavis',
          ].map((name) => [name, `file:${packagePaths[name]}`]),
        ),
      }),
    )
    run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund'], tool)
    cli = join(tool, 'node_modules/@getcortexlabs/create-mavis/src/cli.mjs')
    const creatorArtifact = await verify(
      join(tool, 'package.json'),
      tool,
      '@getcortexlabs/create-mavis',
      '@getcortexlabs/create-mavis/src/cli.mjs',
    )
    const compilerArtifact = await verify(
      creatorArtifact.entry,
      tool,
      '@getcortexlabs/mavis-compiler',
    )
    report.toolArtifacts = [
      creatorArtifact,
      compilerArtifact,
      await verify(compilerArtifact.entry, tool, '@getcortexlabs/mavis-core'),
    ]
    const compilerPath = compilerArtifact.entry
    compiler = await import(pathToFileURL(compilerPath))
    legacyParent = tool
  }

  // The old CLI, including its templates, comes from the actual published tag.
  const legacy = join(legacyParent, 'rc13-creator')
  await mkdir(legacy)
  const archive = execFileSync('git', ['archive', 'v0.1.0-rc.13', 'packages/create-mavis'], {
    cwd: root,
  })
  execFileSync('tar', ['-xf', '-', '--strip-components=2', '-C', legacy], { input: archive })
  run(process.execPath, [
    join(legacy, 'src/cli.mjs'),
    'published-directory',
    '--targets',
    'web,native',
    '--web',
    'nuxt',
    '--rendering',
    'ssr',
    '--example',
    'directory',
    '--yes',
    '--no-install',
  ])
  const project = join(work, 'published-directory')
  assert.equal((await json(join(project, 'mavis.config.json'))).versions.jolt, '0.1.0-rc.13')
  // Upgrading dependencies is an explicit prerequisite, separate from source migration.
  const upgrades = []
  for (const path of ['package.json', 'apps/web/package.json', 'apps/mobile/package.json']) {
    const pkg = await json(join(project, path))
    for (const group of ['dependencies', 'devDependencies'])
      for (const [name, version] of Object.entries(pkg[group] ?? {})) {
        const next = name.startsWith('@getcortexlabs/mavis')
          ? compiler.compilerVersion
          : name === '@rafaelaugusto/jolt'
            ? compiler.joltSwift.version
            : version
        if (version !== next) {
          upgrades.push({ path, name, from: version, to: next })
          pkg[group][name] = next
        }
      }
    await put(join(project, path), JSON.stringify(pkg, null, 2) + '\n')
  }
  await put(join(work, 'dependency-upgrades.json'), JSON.stringify(upgrades, null, 2) + '\n')
  const before = await snapshot(project)
  const preview = JSON.parse(
    run(process.execPath, [cli, '--add-macos', '--migrate-directory', '--json'], project, true),
  )
  assert.deepEqual(await snapshot(project), before, 'Migration preview must not write')
  assert.equal(preview.applied, false)
  assert.ok(preview.migration.some((change) => change.file === 'shared/directory-store.ts'))
  await put(join(work, 'migration-preview.json'), JSON.stringify(preview, null, 2) + '\n')
  run(process.execPath, [cli, '--add-macos', '--migrate-directory', '--write'], project)
  for (const path of [
    'shared/Directory.vue',
    'shared/Details.vue',
    'shared/routes.ts',
    'apps/web/nuxt.config.ts',
    'apps/mobile/webpack.config.js',
  ])
    assert.equal(
      digest(await readFile(join(project, path))),
      before[path],
      `${path} must remain unchanged`,
    )
  const repeated = JSON.parse(
    run(process.execPath, [cli, '--add-macos', '--migrate-directory', '--json'], project, true),
  )
  assert.equal(repeated.alreadyAdded, true)
  const adopted = {
    name: 'published-directory',
    sourceTag: 'v0.1.0-rc.13',
    project,
    previewUnchanged: true,
    idempotent: true,
    dependencyUpgrades: upgrades,
    compiled: false,
  }
  report.cases.push(adopted)

  // Also cover the newly offered Nuxt SSG + Mac path using the packed current CLI.
  run(process.execPath, [
    cli,
    'fresh-tasks',
    '--targets',
    'web,macos',
    '--web',
    'nuxt',
    '--rendering',
    'ssg',
    '--example',
    'tasks',
    '--yes',
    '--no-install',
  ])
  const fresh = { name: 'fresh-tasks', project: join(work, 'fresh-tasks'), compiled: false }
  report.cases.push(fresh)

  for (const item of report.cases) {
    if (prepare) continue
    const hasNative = item === adopted
    for (const path of [
      'package.json',
      'apps/web/package.json',
      ...(hasNative ? ['apps/mobile/package.json'] : []),
    ]) {
      const pkg = await json(join(item.project, path))
      for (const group of ['dependencies', 'devDependencies'])
        for (const name of Object.keys(pkg[group] ?? {}))
          if (packagePaths[name]) pkg[group][name] = `file:${packagePaths[name]}`
      await put(join(item.project, path), JSON.stringify(pkg, null, 2) + '\n')
    }
    run(npm, ['install', '--no-audit', '--no-fund'], item.project)
    if (hasNative)
      run(npm, ['install', '--no-audit', '--no-fund'], join(item.project, 'apps/mobile'))
    const compilerArtifact = await verify(
      join(item.project, 'package.json'),
      item.project,
      '@getcortexlabs/mavis-compiler',
    )
    const webArtifact = await verify(
      join(item.project, 'apps/web/package.json'),
      item.project,
      '@getcortexlabs/mavis-web',
    )
    item.artifacts = [
      compilerArtifact,
      webArtifact,
      await verify(compilerArtifact.entry, item.project, '@getcortexlabs/mavis-core'),
      await verify(webArtifact.entry, item.project, '@getcortexlabs/mavis-core'),
    ]
    if (hasNative) {
      const mobile = join(item.project, 'apps/mobile')
      const nativeArtifact = await verify(
        join(mobile, 'package.json'),
        mobile,
        '@getcortexlabs/mavis',
      )
      item.artifacts.push(
        nativeArtifact,
        await verify(nativeArtifact.entry, mobile, '@getcortexlabs/mavis-core'),
      )
    }
    run(npm, ['run', hasNative ? 'generate:macos' : 'generate'], item.project)
    run(npm, ['run', 'typecheck'], join(item.project, 'apps/web'))
    run(npm, ['run', hasNative ? 'build' : 'generate'], join(item.project, 'apps/web'))
    if (hasNative) {
      run(npm, ['run', 'typecheck'], join(item.project, 'apps/mobile'))
      for (const platform of ['android', 'ios'])
        run(npm, ['run', `bundle:${platform}`], join(item.project, 'apps/mobile'))
    }
    assert.equal(process.platform, 'darwin', 'SwiftUI consumer build needs macOS')
    run('swift', ['build'], join(item.project, 'apps/macos'))
    item.compiled = true
  }
  report.passed = true
} finally {
  await put(join(work, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  await put(join(artifacts, 'latest.json'), JSON.stringify(report, null, 2) + '\n')
}
console.log(
  `${prepare ? 'Prepared, not built' : 'Validated packed compiler, Nuxt and Swift'}: ${work}`,
)
