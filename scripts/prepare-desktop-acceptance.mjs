import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const creator = process.env.MAVIS_PACKED_CREATOR ?? resolve('packages/create-mavis')
const { projectFiles } = await import(pathToFileURL(resolve(creator, 'src/scaffold.mjs')).href)
const target = process.platform === 'win32' ? 'windows' : 'macos'
for (const example of ['welcome', 'directory']) {
  const plan = await projectFiles({ name: `desktop-${example}`, targets: [target], example })
  const root = resolve('artifacts/desktop-creator', example)
  for (const [file, content] of plan.files) {
    await mkdir(dirname(resolve(root, file)), { recursive: true })
    let source = content
    if (process.env.MAVIS_PACKED_DESKTOP && file.endsWith('package.json')) {
      const pkg = JSON.parse(content)
      for (const [name, version] of Object.entries(pkg.dependencies ?? {}))
        if (name.startsWith('@getcortexlabs/'))
          pkg.dependencies[name] =
            `file:${resolve('artifacts/release/packages', `${name.slice(1).replace('/', '-')}-${version}.tgz`)}`
      source = JSON.stringify(pkg, null, 2) + '\n'
    }
    await writeFile(resolve(root, file), source)
  }
}
