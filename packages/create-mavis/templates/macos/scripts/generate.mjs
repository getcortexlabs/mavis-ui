import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileProject, readShared, PortableError } from './portable/index.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
try {
  const files = await readShared(root)
  const { model, vue, swift, environment } = await compileProject(files, {
    theme: '__MAVIS_THEME__',
  })
  // Replace the generated folders only after both targets compiled. Never edit their files.
  for (const [folder, outputs] of [
    ['web/generated', vue],
    ['native/Sources/MavisDesktop/Generated', swift],
  ]) {
    await rm(join(root, folder), { recursive: true, force: true })
    await mkdir(join(root, folder), { recursive: true })
    for (const [name, text] of outputs) await writeFile(join(root, folder, name), text)
  }
  await writeFile(join(root, 'mavis-env.d.ts'), environment)
  console.log(`Generated Vue and SwiftUI for ${model.components.length} shared component(s).`)
} catch (error) {
  if (!(error instanceof PortableError)) throw error
  console.error(error.message)
  process.exitCode = 1
}
