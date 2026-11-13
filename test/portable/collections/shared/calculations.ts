export function setSummary(): string {
  const selected = new Set(['blue', 'red', 'blue'])
  const alias = selected
  alias.add('green')
  selected.delete('red')
  selected.add('red')
  const missing = selected.delete('missing')
  const result =
    [...selected].join(',') + ':' + selected.size + ':' + selected.has('green') + ':' + missing
  selected.clear()
  return result + ':' + selected.size
}

export function mapSummary(): string {
  const counts = new Map<string, number>([
    ['a', 1],
    ['b', 2],
    ['a', 3],
  ])
  const first = Array.from(counts.values())
    .map((value) => String(value))
    .join(',')
  counts.delete('a')
  counts.set('a', 4)
  const result =
    Array.from(counts.keys()).join(',') +
    ':' +
    first +
    ':' +
    (counts.get('a') ?? 0) +
    ':' +
    (counts.get('missing') ?? 0) +
    ':' +
    counts.has('b')
  counts.clear()
  return result + ':' + counts.size
}

export function keySummary(): string {
  const text = new Set(['é', 'e\u0301'])
  const numbers = new Set([0, -0, Number('not-a-number'), Number('not-a-number')])
  const first = [...numbers][0] ?? 1
  const counts = new Map<number, string>([[Number('not-a-number'), 'first']])
  counts.set(Number('not-a-number'), 'last')
  return (
    text.size +
    ':' +
    numbers.size +
    ':' +
    numbers.has(Number('not-a-number')) +
    ':' +
    1 / first +
    ':' +
    (counts.get(Number('not-a-number')) ?? 'missing')
  )
}
