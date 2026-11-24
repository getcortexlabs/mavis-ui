import assert from 'node:assert/strict'

export function portableSelection(names, { args = [], fixtures } = {}) {
  const all = [...names].sort()
  for (const flag of ['--native', '--offscreen', '--build-only', '--smoke'])
    assert.ok(!args.includes(flag), `Unsupported selection: ${flag}`)
  const shardAt = args.indexOf('--shard')
  const shard = shardAt < 0 ? null : args[shardAt + 1]
  if (shardAt >= 0) {
    assert.ok(
      args.includes('--web') && !args.includes('--nativescript'),
      'Shard selection requires --web.',
    )
    assert.ok(!fixtures, 'MAVIS_FIXTURES cannot be combined with --shard.')
  }
  let selected = fixtures ? fixtures.split(',') : all
  let scope = fixtures ? 'focused' : 'full'
  if (shardAt >= 0) {
    assert.match(shard ?? '', /^[1-9]\d*\/[1-9]\d*$/, '--shard must be index/count, starting at 1.')
    const [index, count] = shard.split('/').map(Number)
    assert.ok(
      index <= count && count <= all.length,
      'Shard index/count exceeds the fixture corpus.',
    )
    selected = all.filter((_, offset) => offset % count === index - 1)
    scope = 'shard'
  }
  assert.ok(selected.length, 'Select at least one fixture.')
  for (const name of selected) assert.ok(all.includes(name), `Unknown portable fixture: ${name}`)
  assert.equal(
    new Set(selected).size,
    selected.length,
    'Portable fixture selection contains duplicates.',
  )
  return { names: [...selected], scope, shard, totalFixtures: all.length }
}
