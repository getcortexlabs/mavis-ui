import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileProject, readShared, PortableError } from './portable/index.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
// Each target's generated folder. They are replaced on every run; never edit their files.
const folders = {
  web: 'apps/web/src/generated',
  native: 'apps/mobile/src/generated',
  macos: 'apps/macos/Sources/MavisDesktop/Generated',
}
try {
  const config = JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
  const files = await readShared(root)
  const { model, vue, native, swift, environment } = await compileProject(files, {
    theme: config.theme,
    root: config.portability?.entry ?? 'Welcome',
  })
  const outputs = { web: vue, native, macos: swift }
  // Write only after every target compiled.
  for (const target of config.targets) {
    const folder = join(root, folders[target])
    await rm(folder, { recursive: true, force: true })
    await mkdir(folder, { recursive: true })
    for (const [name, text] of outputs[target]) await writeFile(join(folder, name), text)
  }
  await writeFile(join(root, 'mavis-env.d.ts'), environment)
  console.log(
    `Generated ${config.targets.join(', ')} for ${model.components.length} shared component(s).`,
  )
} catch (error) {
  if (!(error instanceof PortableError)) throw error
  console.error(error.message)
  process.exitCode = 1
}
