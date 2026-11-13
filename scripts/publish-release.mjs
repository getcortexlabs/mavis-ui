// Release checks and npm publication used by .github/workflows/release.yml.
//
//   node scripts/publish-release.mjs check <tag>           tag, versions and pins agree
//   node scripts/publish-release.mjs publish <dir> [--dry-run]
//
// `publish` takes the tarballs packed and tested by the release workflow, refuses
// to replace a version that already exists with other bytes, and can be re-run
// after a partial failure: packages already on the registry are only re-tagged.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
// Dependencies first, so a published package never points at a missing one.
export const folders = ['core', 'nativescript', 'web', 'compiler', 'create-mavis']

const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/

export function parseVersion(version) {
  const match = versionPattern.exec(version)
  if (!match) throw new Error(`${version} is not a semantic version`)
  return {
    core: match.slice(1, 4).map(Number),
    pre: match[4] ? match[4].split('.') : [],
  }
}

// Semantic Versioning 2.0 precedence.
export function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  for (let index = 0; index < 3; index++) {
    if (left.core[index] !== right.core[index]) return left.core[index] - right.core[index]
  }
  if (!left.pre.length || !right.pre.length) return right.pre.length - left.pre.length
  for (let index = 0; index < Math.max(left.pre.length, right.pre.length); index++) {
    const [x, y] = [left.pre[index], right.pre[index]]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x === y) continue
    const [numericX, numericY] = [/^\d+$/.test(x), /^\d+$/.test(y)]
    if (numericX && numericY) return Number(x) - Number(y)
    if (numericX !== numericY) return numericX ? -1 : 1
    return x < y ? -1 : 1
  }
  return 0
}

// Stable versions go to `latest`; prereleases to their first identifier (rc, alpha, beta).
export function channelOf(version) {
  const { pre } = parseVersion(version)
  if (!pre.length) return 'latest'
  assert.match(pre[0], /^[a-z]+$/, `${version} needs a channel such as rc.1, alpha.1 or beta.1`)
  return pre[0]
}

// `latest` follows the newest prerelease until the first stable release, and never moves back.
export function shouldMoveLatest(version, latest) {
  if (!latest) return true
  if (compareVersions(version, latest) <= 0) return false
  return !parseVersion(version).pre.length || parseVersion(latest).pre.length > 0
}

export function readPackages(directory = root) {
  return folders.map((folder) =>
    JSON.parse(readFileSync(join(directory, 'packages', folder, 'package.json'), 'utf8')),
  )
}

export function checkRelease(tag, packages) {
  const [core, ...rest] = packages
  const version = core.version
  if (tag !== `v${version}`) throw new Error(`Tag ${tag} does not match package version ${version}`)
  const channel = channelOf(version)
  for (const pkg of packages) {
    assert.equal(pkg.version, version, `${pkg.name} is ${pkg.version}, expected ${version}`)
    assert.notEqual(pkg.private, true, `${pkg.name} is private`)
    assert.equal(pkg.publishConfig?.access, 'public', `${pkg.name} must publish publicly`)
    assert.equal(
      pkg.publishConfig?.tag,
      channel,
      `${pkg.name} publishConfig.tag must be ${channel}`,
    )
  }
  for (const pkg of rest.filter((pkg) =>
    ['@getcortexlabs/mavis', '@getcortexlabs/mavis-web', '@getcortexlabs/mavis-compiler'].includes(
      pkg.name,
    ),
  )) {
    assert.equal(
      pkg.dependencies?.[core.name],
      version,
      `${pkg.name} must depend on ${core.name}@${version} exactly`,
    )
  }
  const compiler = packages.find((pkg) => pkg.name === '@getcortexlabs/mavis-compiler')
  const creator = packages.find((pkg) => pkg.name === '@getcortexlabs/create-mavis')
  if (compiler)
    assert.equal(
      creator?.dependencies?.[compiler.name],
      version,
      'The creator and compiler must upgrade together.',
    )
  return { version, channel, prerelease: channel !== 'latest' }
}

function readManifest(directory) {
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'))
  return manifest.map((entry) => {
    const bytes = readFileSync(join(directory, entry.filename))
    const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`
    assert.equal(integrity, entry.integrity, `${entry.filename} differs from manifest.json`)
    return entry
  })
}

// Pure: what to do for each package, from the registry's current state.
export function planPublish(entries, registry) {
  const version = entries[0].version
  const channel = channelOf(version)
  return entries.map(({ name, integrity, filename }) => {
    const state = registry[name] ?? {}
    if (state.integrity && state.integrity !== integrity)
      throw new Error(
        `${name}@${version} already exists on npm with different contents; a published version cannot be replaced.`,
      )
    const tags = [channel]
    if (channel !== 'latest' && shouldMoveLatest(version, state.tags?.latest)) tags.push('latest')
    return {
      name,
      filename,
      integrity,
      publish: !state.integrity,
      tags: tags.filter((tag) => state.tags?.[tag] !== version),
    }
  })
}

function npm(args, options = {}) {
  return execFileSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  })
}

// npm 12 prints one match as a list with one item; earlier versions print the value itself.
export function registryValue(data) {
  return Array.isArray(data) && data.length === 1 ? data[0] : data
}

function view(spec, field) {
  const result = spawnSync('npm', ['view', spec, field, '--json'], { cwd: root, encoding: 'utf8' })
  if (result.error) throw result.error
  const data = result.stdout.trim() ? JSON.parse(result.stdout) : undefined
  if (result.status === 0) return registryValue(data)
  if (data?.error?.code === 'E404') return undefined
  throw new Error(`Cannot query ${spec}: ${result.stderr || result.stdout}`)
}

function registryState(name, version) {
  return { integrity: view(`${name}@${version}`, 'dist.integrity'), tags: view(name, 'dist-tags') }
}

// The registry can take a few minutes before a new version or tag is visible everywhere.
async function waitForRegistry(name, version, { integrity, tags }) {
  let state
  for (let attempt = 0; attempt < 60; attempt++) {
    state = registryState(name, version)
    if (state.integrity && state.integrity !== integrity)
      throw new Error(`${name}@${version} is on npm with unexpected contents`)
    if (state.integrity && tags.every((tag) => state.tags?.[tag] === version)) return state
    await delay(10_000)
  }
  throw new Error(
    `${name}@${version} did not reach npm with tags ${tags.join(', ')} after ten minutes (last seen: ${JSON.stringify(state)})`,
  )
}

async function publish(directory, { dryRun }) {
  const entries = readManifest(directory)
  const packages = readPackages()
  assert.deepEqual(
    entries.map(({ name, version }) => `${name}@${version}`),
    packages.map(({ name, version }) => `${name}@${version}`),
    'manifest.json must contain the checked-out packages in dependency order',
  )
  const version = entries[0].version
  // Every query and comparison happens before the first registry mutation.
  const actions = planPublish(
    entries,
    Object.fromEntries(entries.map(({ name }) => [name, registryState(name, version)])),
  )
  const report = []
  for (const action of actions) {
    const spec = `${action.name}@${version}`
    const tarball = resolve(directory, action.filename)
    console.log(
      `${dryRun ? '[dry run] ' : ''}${action.publish ? 'Publish' : 'Already published'} ${spec}${action.tags.length ? `; tag ${action.tags.join(', ')}` : ''}`,
    )
    if (!dryRun) {
      if (action.publish) {
        const [channel] = action.tags
        try {
          process.stdout.write(
            npm(['publish', tarball, '--access', 'public', '--tag', channel, '--provenance']),
          )
        } catch (error) {
          // The registry may have accepted the upload before the command failed.
          if (view(spec, 'dist.integrity') !== action.integrity) throw error
        }
        await waitForRegistry(action.name, version, { integrity: action.integrity, tags: [] })
      }
      for (const tag of action.tags.slice(action.publish ? 1 : 0)) {
        npm(['dist-tag', 'add', spec, tag])
      }
      const state = await waitForRegistry(action.name, version, action)
      report.push({ spec, integrity: state.integrity, tags: state.tags })
    }
  }
  if (!dryRun) {
    writeFileSync(join(directory, 'registry.json'), `${JSON.stringify(report, null, 2)}\n`)
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        [
          `Published Mavis UI ${version} to npm.`,
          '',
          '| Package | Tags |',
          '| --- | --- |',
          ...report.map(
            ({ spec, tags }) =>
              `| \`${spec}\` | ${Object.entries(tags)
                .filter(([, value]) => value === version)
                .map(([tag]) => tag)
                .join(', ')} |`,
          ),
          '',
        ].join('\n'),
      )
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, argument] = process.argv.slice(2)
  if (command === 'check') {
    const release = checkRelease(argument, readPackages())
    // Set by the workflow from the GitHub release, so an RC is never marked "Latest" there.
    const marked = process.env.RELEASE_PRERELEASE
    if (marked && marked !== String(release.prerelease))
      throw new Error(
        `Mark the GitHub release as a pre-release ${release.prerelease ? 'for' : 'only for prerelease versions, not'} ${release.version}.`,
      )
    console.log(JSON.stringify(release))
    if (process.env.GITHUB_OUTPUT)
      for (const [name, value] of Object.entries(release))
        appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)
  } else if (command === 'publish' && argument) {
    await publish(resolve(argument), { dryRun: process.argv.includes('--dry-run') })
  } else {
    console.error('Usage: publish-release.mjs check <tag> | publish <dir> [--dry-run]')
    process.exitCode = 2
  }
}
