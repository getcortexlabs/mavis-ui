import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareWindowsHost } from './prepare-host.mjs'
const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const output = resolve(here, `artifacts/__MAVIS_NAME__-win32-${process.arch}`)
if (process.platform !== 'win32') throw new Error('Package the Windows app on Windows.')
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
prepareWindowsHost(join(output, 'node.exe'))
cpSync(join(here, 'dist/main.mjs'), join(output, 'dist/main.mjs'))
const runtime = dirname(require.resolve('@nativescript/windows-napi'))
cpSync(runtime, join(output, 'node_modules/@nativescript/windows-napi'), { recursive: true })
writeFileSync(
  join(output, '__MAVIS_NAME__.cmd'),
  '@echo off\r\n"%~dp0node.exe" "%~dp0dist\\main.mjs" %*\r\n',
)
const licenses = join(output, 'Licenses')
mkdirSync(licenses)
for (const [name, source] of [
  ['Mavis', join(here, 'LICENSE')],
  ['Vue', join(here, 'node_modules/vue/LICENSE')],
  ['VueRouter', join(here, 'node_modules/vue-router/LICENSE')],
  ['Jolt', join(here, 'node_modules/@rafaelaugusto/jolt/LICENSE')],
  ['NativeScript', join(here, 'NativeScript-LICENSE')],
])
  cpSync(source, join(licenses, `${name}.txt`))
const nodeLicense = [
  join(dirname(process.execPath), 'LICENSE'),
  join(dirname(process.execPath), '../LICENSE'),
].find(existsSync)
if (!nodeLicense)
  throw new Error(
    'Use the official Node distribution including its LICENSE to package the runtime.',
  )
cpSync(nodeLicense, join(licenses, 'Node.txt'))
writeFileSync(
  join(here, 'artifacts/package.json'),
  JSON.stringify(
    {
      directory: output,
      node: process.version,
      arch: process.arch,
      runtime: JSON.parse(readFileSync(join(runtime, 'package.json'), 'utf8')).version,
      minimumWindows: '10 build 18362',
      signing: 'unsigned portable folder; not an installer',
    },
    null,
    2,
  ) + '\n',
)
console.log(output)
