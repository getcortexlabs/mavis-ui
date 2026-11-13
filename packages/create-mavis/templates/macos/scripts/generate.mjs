import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  compileProject,
  isScreen,
  readAssets,
  readShared,
  PortableError,
} from './portable/index.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
// Each target's generated folder. They are replaced on every run; never edit their files.
const folders = {
  web: 'apps/web/src/generated',
  native: 'apps/mobile/src/generated',
  macos: 'apps/macos/Sources/MavisDesktop/Generated',
}
// Where each app keeps the pictures of shared/assets, which a screen names ~/assets/name.png:
// the Web serves them under that path, NativeScript reads its own ~/assets, and the Mac app
// carries them in its resources.
const assetFolders = {
  web: 'apps/web/public/~/assets',
  native: 'apps/mobile/src/assets',
  macos: 'apps/macos/Sources/MavisDesktop/Generated/Assets',
}
// What MavisEntry adds for the project's stores: they live around the screen. Stores that take
// host services get them from App.swift, MavisEntry(services: MavisServices(…)), as the Web and
// NativeScript apps provide theirs; one that is missing there does not compile.
function storeEntry(model) {
  if (!model.modules.some((module) => module.stores.length)) return { fields: [], modifier: '' }
  return {
    fields: [
      model.services.length
        ? '    let services: MavisServices'
        : '    var services = MavisServices()',
    ],
    modifier: '\n            .mavisServices(services)',
  }
}

try {
  const config = JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
  const files = await readShared(root)
  const entry = config.portability?.entry ?? 'Welcome'
  const assets = await readAssets(root)
  const { model, vue, native, swift, direct, environment } = await compileProject(files, {
    theme: config.theme,
    root: entry,
    destinations: config.portability?.destinations,
    assets,
  })
  // With a route table (shared/routes.ts) the app opens its navigation at /, not one screen.
  const { navigation } = model
  // The screen every app opens: generated here, or the shared file itself when the Web and
  // NativeScript run it as written. One with an MScreen of its own fills the window; the hosts
  // put any other on a scrolling page.
  const opens = model.components.find((component) => component.name === (navigation?.home ?? entry))
  const screen = isScreen(opens.view)
  const opened = direct.includes(opens.path)
    ? `#shared-ui/${opens.path.slice('shared/'.length)}`
    : `./${entry}.vue`
  const notice =
    '// Generated: the screen this app opens (portability.entry in mavis.config.json). Do not edit.'
  const stores = storeEntry(model)
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
          ...stores.fields,
          '    var body: some View {',
          `        ${navigation ? 'MavisNavigationHost()' : screen ? `${entry}()` : `MavisPage { ${entry}() }`}${stores.modifier}`,
          '    }',
          '}',
          '',
          "/// The app's menu commands: with a route table, the Go menu of its navigation.",
          'struct MavisEntryCommands: Commands {',
          '    var body: some Commands {',
          `        ${navigation ? 'MavisNavigationCommands()' : 'EmptyCommands()'}`,
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
    // The Mac's copy is replaced with its generated folder; the Swift package always has one.
    if (target === 'macos') await mkdir(join(root, assetFolders.macos), { recursive: true })
    for (const name of assets)
      await cp(join(root, 'shared/assets', name), join(root, assetFolders[target], name), {
        recursive: true,
      })
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
