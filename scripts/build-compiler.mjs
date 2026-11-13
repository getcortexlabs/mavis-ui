// Transitional source location: families still edit portable/ while integration is in flight.
// The published package owns its complete compiler; consumers never copy these sources.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = join(root, 'packages/compiler/dist')
const { version } = JSON.parse(await readFile(join(root, 'packages/compiler/package.json'), 'utf8'))
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(
  join(root, 'packages/create-mavis/templates/macos/scripts/portable'),
  join(output, 'portable'),
  { recursive: true },
)
await writeFile(
  join(output, 'index.mjs'),
  `export const compilerVersion = ${JSON.stringify(version)}\nexport * from './portable/index.mjs'\nexport { generateProject } from './portable/project.mjs'\nexport { joltSwift } from './portable/emit-swift.mjs'\n`,
)
await writeFile(
  join(output, 'index.d.ts'),
  await readFile(join(root, 'packages/compiler/index.d.ts')),
)
console.log('Built @getcortexlabs/mavis-compiler.')
