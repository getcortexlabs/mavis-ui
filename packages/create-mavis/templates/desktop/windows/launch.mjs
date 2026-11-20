import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareWindowsHost } from './prepare-host.mjs'
const here = dirname(fileURLToPath(import.meta.url))
const executable = prepareWindowsHost(resolve(here, '.mavis/runtime/node.exe'))
const child = spawn(executable, [resolve(here, 'dist/main.mjs'), ...process.argv.slice(2)], {
  stdio: 'inherit',
})
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
