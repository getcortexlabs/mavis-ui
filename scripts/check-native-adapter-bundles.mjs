import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const cwd = resolve('examples/native-adapters')
const output = resolve('artifacts/native-adapters/bundles')
mkdirSync(output, { recursive: true })
let failures = 0
for (const platform of ['android', 'ios']) for (const framework of ['plain', 'react', 'angular', 'svelte', 'solid']) {
  let log = '', status = 'passed'
  try {
    log = execFileSync(process.execPath, [resolve(cwd, 'node_modules/webpack-cli/bin/cli.js'), '--env', platform, '--env', `framework=${framework}`, '--env', 'adapterCheck', '--stats', 'errors-warnings'], { cwd, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024 })
  } catch (error) {
    status = 'failed'; failures++
    log = `${error.stdout ?? ''}\n${error.stderr ?? ''}`
  }
  writeFileSync(resolve(output, `${framework}-${platform}.log`), log)
  console.log(`${framework} / ${platform}: ${status}`)
  if (status === 'failed') console.log(log.slice(-7000))
}
if (failures) process.exitCode = 1
