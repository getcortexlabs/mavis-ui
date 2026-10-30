import { readFileSync } from 'node:fs'
import { compareReports, validateReport } from '../test/performance/report.ts'

const [file, baseline] = process.argv.slice(2)
if (!file) throw new Error('Usage: node scripts/compare-performance.mjs REPORT [BASELINE]')
const report = JSON.parse(readFileSync(file, 'utf8'))
const summary = validateReport(report)
console.table(summary)
if (baseline) {
  const regressions = compareReports(report, JSON.parse(readFileSync(baseline, 'utf8')))
  if (regressions.length) throw new Error(regressions.join('\n'))
}
