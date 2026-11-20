import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const root = resolve(import.meta.dirname, '..')
const creator = process.env.MAVIS_PACKED_CREATOR ?? resolve(root, 'packages/create-mavis')
const { projectFiles } = await import(pathToFileURL(resolve(creator, 'src/scaffold.mjs')).href)
const selected = process.argv[2]
for (const framework of selected ? [selected] : ['plain', 'react', 'angular', 'svelte', 'solid']) {
  const { files } = await projectFiles({
    name: `native-${framework}`,
    targets: ['native'],
    framework,
    packageManager: process.env.MAVIS_CREATOR_MANAGER ?? 'npm',
  })
  const destination = resolve(
    process.env.MAVIS_CREATOR_CONSUMERS ?? 'artifacts/native-creator',
    framework,
  )
  const pkg = JSON.parse(files.get('package.json'))
  for (const [name, version] of Object.entries(pkg.dependencies))
    if (name.startsWith('@getcortexlabs/'))
      pkg.dependencies[name] =
        `file:${resolve(root, 'artifacts/release/packages', `${name.slice(1).replace('/', '-')}-${version}.tgz`)}`
  // Yarn and pnpm resolve exact transitive pins separately from root file deps.
  // Before publication every Mavis edge must use the same tested tarballs.
  const localMavis = Object.fromEntries(
    Object.entries(pkg.dependencies).filter(([name]) => name.startsWith('@getcortexlabs/')),
  )
  if (process.env.MAVIS_CREATOR_MANAGER === 'yarn')
    pkg.resolutions = { ...pkg.resolutions, ...localMavis }
  if (process.env.MAVIS_CREATOR_MANAGER === 'pnpm')
    files.set(
      'pnpm-workspace.yaml',
      files.get('pnpm-workspace.yaml') + `overrides: ${JSON.stringify(localMavis)}\n`,
    )
  files.set('package.json', JSON.stringify(pkg, null, 2) + '\n')
  if (process.env.MAVIS_CREATOR_RUNTIME_CHECK) {
    files.set(
      'src/acceptance.ts',
      (
        await readFile(resolve(root, 'examples/native-adapters/src/_acceptance.ts'), 'utf8')
      ).replace("'./_model'", "'./model'"),
    )
    files.set(
      'src/app.ts',
      "import { beginAcceptance } from './acceptance'\n" +
        files.get('src/app.ts').replace('start()', 'beginAcceptance()\nstart()'),
    )
  }
  for (const [file, contents] of files) {
    const path = resolve(destination, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, contents)
  }
  console.log(destination)
}
