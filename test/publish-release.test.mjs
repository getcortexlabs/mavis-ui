import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  channelOf,
  checkRelease,
  compareVersions,
  planPublish,
  readPackages,
  shouldMoveLatest,
} from '../scripts/publish-release.mjs'

const names = [
  '@getcortexlabs/mavis-core',
  '@getcortexlabs/mavis',
  '@getcortexlabs/mavis-web',
  '@getcortexlabs/create-mavis',
]

function packages(version, overrides = {}) {
  const tag = channelOf(version)
  return names.map((name, index) => ({
    name,
    version,
    license: 'MIT',
    publishConfig: { access: 'public', tag },
    ...(index === 1 || index === 2 ? { dependencies: { [names[0]]: version } } : {}),
    ...overrides[name],
  }))
}

const entries = (version) =>
  names.map((name) => ({
    name,
    version,
    filename: `${name.slice(1).replace('/', '-')}-${version}.tgz`,
    integrity: `sha512-${name}`,
  }))

test('versions follow semantic version precedence, including dotted prereleases', () => {
  const ordered = [
    '0.1.0-alpha.11',
    '0.1.0-rc.9',
    '0.1.0-rc.11',
    '0.1.0-rc.11.1',
    '0.1.0-rc.12',
    '0.1.0-rc.12.1',
    '0.1.0-rc.12.2',
    '0.1.0',
    '0.1.1-rc.1',
    '1.0.0',
  ]
  for (let index = 1; index < ordered.length; index++) {
    assert(compareVersions(ordered[index - 1], ordered[index]) < 0, ordered[index])
    assert(compareVersions(ordered[index], ordered[index - 1]) > 0, ordered[index])
  }
  assert.equal(compareVersions('0.1.0-rc.12.2', '0.1.0-rc.12.2'), 0)
  assert.throws(() => compareVersions('v0.1.0', '0.1.0'))
})

test('prereleases publish to their channel; stable releases to latest', () => {
  assert.equal(channelOf('0.1.0-rc.12.2'), 'rc')
  assert.equal(channelOf('0.1.0-alpha.11'), 'alpha')
  assert.equal(channelOf('1.0.0'), 'latest')
  assert.throws(() => channelOf('0.1.0-12'))
})

test('latest follows the newest prerelease until a stable release, and never moves back', () => {
  assert.equal(shouldMoveLatest('0.1.0-rc.13', undefined), true)
  assert.equal(shouldMoveLatest('0.1.0-rc.13', '0.1.0-rc.12.2'), true)
  assert.equal(shouldMoveLatest('0.1.0-rc.12.1', '0.1.0-rc.12.2'), false)
  assert.equal(shouldMoveLatest('0.1.0-rc.12.2', '0.1.0-rc.12.2'), false)
  assert.equal(shouldMoveLatest('0.1.0', '0.1.0-rc.13'), true)
  assert.equal(shouldMoveLatest('0.2.0-rc.1', '0.1.0'), false)
  assert.equal(shouldMoveLatest('0.1.1', '0.1.0'), true)
})

test('the checked-out packages describe one coherent release', () => {
  const current = readPackages()
  const { version } = current[0]
  assert.deepEqual(checkRelease(`v${version}`, current), {
    version,
    channel: channelOf(version),
    prerelease: channelOf(version) !== 'latest',
  })
})

test('a release tag must match every package, channel and internal pin', () => {
  assert.deepEqual(checkRelease('v0.1.0-rc.13', packages('0.1.0-rc.13')), {
    version: '0.1.0-rc.13',
    channel: 'rc',
    prerelease: true,
  })
  assert.equal(checkRelease('v1.0.0', packages('1.0.0')).channel, 'latest')
  assert.throws(() => checkRelease('v0.1.0-rc.12', packages('0.1.0-rc.13')), /does not match/)
  assert.throws(
    () =>
      checkRelease(
        'v0.1.0-rc.13',
        packages('0.1.0-rc.13', { [names[3]]: { version: '0.1.0-rc.12' } }),
      ),
    /create-mavis/,
  )
  assert.throws(
    () =>
      checkRelease(
        'v0.1.0-rc.13',
        packages('0.1.0-rc.13', { [names[2]]: { dependencies: { [names[0]]: '^0.1.0-rc.13' } } }),
      ),
    /exactly/,
  )
  assert.throws(
    () =>
      checkRelease(
        'v1.0.0',
        packages('1.0.0', { [names[0]]: { publishConfig: { access: 'public', tag: 'rc' } } }),
      ),
    /latest/,
  )
})

test('a first publication uploads every package and moves the prerelease to latest', () => {
  const actions = planPublish(entries('0.1.0-rc.13'), {
    [names[0]]: { tags: { latest: '0.1.0-rc.12.2', rc: '0.1.0-rc.12.2', alpha: '0.1.0-alpha.11' } },
  })
  assert.deepEqual(
    actions.map(({ name, publish, tags }) => [name, publish, tags]),
    names.map((name) => [name, true, ['rc', 'latest']]),
  )
})

test('a re-run publishes only what is missing and finishes the tags', () => {
  const version = '0.1.0-rc.13'
  const [core, native, web, cli] = entries(version)
  const actions = planPublish([core, native, web, cli], {
    [core.name]: { integrity: core.integrity, tags: { latest: version, rc: version } },
    [native.name]: { integrity: native.integrity, tags: { latest: '0.1.0-rc.12.2', rc: version } },
    [web.name]: { tags: { latest: '0.1.0-rc.12.2', rc: '0.1.0-rc.12.2' } },
  })
  assert.deepEqual(
    actions.map(({ publish, tags }) => [publish, tags]),
    [
      [false, []],
      [false, ['latest']],
      [true, ['rc', 'latest']],
      [true, ['rc', 'latest']],
    ],
  )
})

test('an older hotfix keeps the newer latest and a stable release does not touch rc', () => {
  const hotfix = planPublish(entries('0.1.0-rc.12.3'), {
    [names[0]]: { tags: { latest: '0.1.0-rc.13', rc: '0.1.0-rc.13' } },
  })
  assert.deepEqual(hotfix[0].tags, ['rc'])
  const stable = planPublish(entries('0.1.0'), {
    [names[0]]: { tags: { latest: '0.1.0-rc.13', rc: '0.1.0-rc.13' } },
  })
  assert.deepEqual(stable[0].tags, ['latest'])
})

test('a version already on npm with other bytes is never replaced', () => {
  assert.throws(
    () =>
      planPublish(entries('0.1.0-rc.13'), {
        [names[1]]: { integrity: 'sha512-other', tags: {} },
      }),
    /different contents/,
  )
})
