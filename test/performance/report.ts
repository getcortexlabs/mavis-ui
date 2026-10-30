interface Report {
  version: number
  complete: boolean
  error?: string
  environment: Record<string, unknown>
  samples: Record<string, number[]>
  checks: Record<string, unknown>
}

export function summarize(values: number[], warm = false) {
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Invalid or missing performance samples')
  }
  const sorted = (warm ? values.slice(1) : values).toSorted((a, b) => a - b)
  if (!sorted.length) {
    throw new Error('Invalid or missing performance samples')
  }
  const middle = Math.floor(sorted.length / 2)
  return {
    count: values.length,
    first: values[0]!,
    median: sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1]!,
    max: sorted.at(-1)!,
  }
}

export const isWarmMeasurement = (name: string) => /^(mount-|navigate|back)/.test(name)

export function validateReport(report: Report) {
  if (report.version !== 1 || !report.complete || report.error) {
    throw new Error(report.error ?? 'Incomplete performance report')
  }
  if (report.environment.suite === 'catalog') {
    if (report.samples['navigate/']?.length !== 1) throw new Error('Missing catalog measurement')
    return { 'navigate/': summarize(report.samples['navigate/']) }
  }
  const expected: Record<string, number> = {
    'bootstrap-to-frame': 1,
    'theme-32': 20,
    'text-32': 20,
    'loading-32': 20,
    slider: 30,
    'reveal-update': 10,
    'press-down': 10,
    'press-up': 10,
  }
  for (const [count, depth] of [
    [4, 0],
    [4, 2],
    [4, 4],
    [4, 6],
    [8, 0],
    [32, 0],
    [64, 0],
  ]) {
    if (depth === 0 || !report.checks[`skipped-depth-${depth}`])
      expected[`mount-${count}-depth-${depth}`] = 6
  }
  for (const path of ['/components/input', '/showcase/profile', '/showcase/focus']) {
    expected[`navigate${path}`] = expected[`back${path}`] = 6
    for (let i = 0; i < 6; i++) checkDetached(`popped${path}-${i}`)
  }
  for (const [name, count] of Object.entries(expected)) {
    if (report.samples[name]?.length !== count) throw new Error(`Missing ${name} samples`)
  }
  if ((report.samples['motion-frame-interval']?.length ?? 0) < 100) {
    throw new Error('Missing motion frame intervals')
  }
  for (const name of ['detachedCards', 'detachedDuringPress']) checkDetached(name)
  function checkDetached(name: string) {
    const check = report.checks[name] as Record<string, number> | undefined
    if (!check || !check.captured) throw new Error(`${name}: no controls inspected`)
    const fields =
      report.environment.renderer === 'web'
        ? ['connected', 'animations']
        : ['loaded', 'touchObservers', 'unrestoredScale']
    for (const key of fields) {
      if (typeof check[key] !== 'number') throw new Error(`${name}: missing ${key}`)
    }
    for (const key of ['loaded', 'connected', 'touchObservers', 'unrestoredScale', 'animations']) {
      if (check[key]) throw new Error(`${name}: ${key} = ${check[key]}`)
    }
  }
  for (const name of ['idleWithControls', 'idleAfterRemoval', 'idleAfterNavigation']) {
    const check = report.checks[name] as Record<string, number> | undefined
    if (!check || check.duration !== 750) throw new Error(`Missing ${name} observation`)
    const count = report.environment.renderer === 'web' ? 'nodes' : 'views'
    if (!Number.isInteger(check[count]) || check[count]! < 1)
      throw new Error(`${name}: missing ${count}`)
    for (const key of ['layoutEvents', 'mutations', 'animations']) {
      if (check[key]) throw new Error(`${name}: ${key} = ${check[key]}`)
    }
    for (const key of ['views', 'nodes']) {
      if (check[key] !== check[`${key}After`]) throw new Error(`${name}: ${key} changed`)
    }
  }
  const before = report.checks.idleAfterRemoval as Record<string, number>
  const after = report.checks.idleAfterNavigation as Record<string, number>
  if (before.views !== after.views || before.nodes !== after.nodes) {
    throw new Error('Navigation did not return to the original view count')
  }
  return Object.fromEntries(
    Object.entries(report.samples).map(([name, values]) => [
      name,
      summarize(values, isWarmMeasurement(name)),
    ]),
  )
}

// Relative limits detect regressions on the same target. The 50 ms allowance covers
// scheduling noise in small samples; it is not a responsiveness or frame-rate promise.
export function compareReports(current: Report, baseline: Report) {
  const next = validateReport(current)
  const previous = validateReport(baseline)
  for (const key of [
    'renderer',
    'build',
    'model',
    'os',
    'screen',
    'viewport',
    'browserVersion',
    'host',
    'core',
    'jolt',
    'target',
    'suite',
    'hardware',
    'osBuild',
    'fontScale',
    'contentSize',
  ]) {
    if (JSON.stringify(current.environment[key]) !== JSON.stringify(baseline.environment[key])) {
      throw new Error(`Cannot compare different ${key}`)
    }
  }
  const regressions: string[] = []
  for (const [name, value] of Object.entries(next)) {
    const reference = previous[name]
    // Startup has one observation; Web press includes Playwright transport and scrolling.
    if (
      !reference ||
      reference.count < 2 ||
      value.count < 2 ||
      name === 'bootstrap-to-frame' ||
      (current.environment.renderer === 'web' && name.startsWith('press-'))
    )
      continue
    for (const [stat, ratio] of [
      ['median', 1.25],
      ['p95', 1.5],
    ] as const) {
      const allowance = name === 'motion-frame-interval' ? 4 : 50
      const limit = Math.max(reference[stat] * ratio, reference[stat] + allowance)
      if (value[stat] > limit)
        regressions.push(
          `${name} ${stat}: ${value[stat].toFixed(1)} ms exceeds ${limit.toFixed(1)} ms`,
        )
    }
  }
  for (const name of Object.keys(previous)) {
    if (!(name in next)) regressions.push(`${name}: workload was skipped`)
  }
  return regressions
}
