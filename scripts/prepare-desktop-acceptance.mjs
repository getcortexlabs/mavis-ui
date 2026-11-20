import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
const target = process.platform === 'win32' ? 'windows' : 'macos'
for (const example of ['welcome', 'directory']) {
  const plan = await projectFiles({ name: `desktop-${example}`, targets: [target], example })
  const root = resolve('artifacts/desktop-creator', example)
  for (const [file, content] of plan.files) {
    await mkdir(dirname(resolve(root, file)), { recursive: true })
    await writeFile(resolve(root, file), content)
  }
}
