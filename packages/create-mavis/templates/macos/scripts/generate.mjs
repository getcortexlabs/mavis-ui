import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileProject, isScreen, readShared, PortableError } from './portable/index.mjs'

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
  const entry = config.portability?.entry ?? 'Welcome'
  const { model, vue, native, swift, direct, environment } = await compileProject(files, {
    theme: config.theme,
    root: entry,
  })
  // The screen every app opens: generated here, or the shared file itself when the Web and
  // NativeScript run it as written. One with an MScreen of its own fills the window; the hosts
  // put any other on a scrolling page.
  const opens = model.components.find((component) => component.name === entry)
  const screen = isScreen(opens.view)
  const opened = direct.includes(opens.path)
    ? `#shared-ui/${opens.path.slice('shared/'.length)}`
    : `./${entry}.vue`
  const notice =
    '// Generated: the screen this app opens (portability.entry in mavis.config.json). Do not edit.'
  const outputs = {
    web: vue,
    native,
    macos: new Map([
      ...swift,
      [
        'MavisEntry.swift',
        [
          notice,
          'import SwiftUI',
          '',
          'struct MavisEntry: View {',
          '    var body: some View {',
          `        ${screen ? `${entry}()` : `MavisPage { ${entry}() }`}`,
          '    }',
          '}',
          '',
        ].join('\n'),
      ],
    ]),
  }
  // Write only after every target compiled.
  for (const target of config.targets) {
    const folder = join(root, folders[target])
    await rm(folder, { recursive: true, force: true })
    await mkdir(folder, { recursive: true })
    for (const [name, text] of outputs[target]) await writeFile(join(folder, name), text)
    if (target !== 'macos')
      await writeFile(
        join(folder, 'entry.ts'),
        `${notice}\nexport { default } from '${opened}'\nexport const screen = ${screen}\n`,
      )
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
