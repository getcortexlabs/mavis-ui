import assert from 'node:assert/strict'

// A small PR interaction gate, not a claim of complete component parity. The full
// corpus is still compiled separately and replayed by release/manual full jobs.
export const nativeSmokeFixtures = [
  'basicInputs',
  'basicInputsVue',
  'calendar',
  'calendarVue',
  'motionAvailability',
  'motionAvailabilityVue',
  'motionImage',
  'motionImageVue',
]

export function portableSelection(names, { args = [], fixtures } = {}) {
  const all = [...names].sort()
  const smoke = args.includes('--smoke')
  const buildOnly = args.includes('--build-only')
  const shardAt = args.indexOf('--shard')
  const shard = shardAt < 0 ? null : args[shardAt + 1]
  if (smoke || buildOnly || shardAt >= 0) {
    assert.ok(args.includes('--native'), 'Native selection requires --native.')
    assert.ok(
      !args.includes('--web') && !args.includes('--offscreen'),
      'Run native selections separately from Web/offscreen.',
    )
    assert.ok(
      Number(smoke) + Number(buildOnly) + Number(shardAt >= 0) === 1,
      'Choose only one of --smoke, --build-only or --shard.',
    )
  }
  assert.ok(
    !fixtures || (!smoke && shardAt < 0),
    'MAVIS_FIXTURES cannot be combined with --smoke or --shard.',
  )
  let selected = fixtures ? fixtures.split(',') : all
  let scope = fixtures ? 'focused' : 'full'
  if (smoke) {
    selected = nativeSmokeFixtures
    scope = 'smoke'
  }
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
  return { names: [...selected], scope, shard, buildOnly, totalFixtures: all.length }
}
