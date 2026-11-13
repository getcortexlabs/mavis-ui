import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { macAppSettings } from './settings.mjs'
import { swiftString } from './swift-text.mjs'
import { startupPlan, swiftStartup } from './startup.mjs'
import { compileProject, isScreen, readAssets, readShared, PortableError } from './index.mjs'

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

export async function generateProject(root) {
  const config = JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
  const roots = config.portability?.roots ?? ['shared']
  const sourceRoot = config.portability?.sourceRoot ?? roots[0]
  const files = await readShared(root, { roots })
  const entry = config.portability?.entry ?? 'Welcome'
  const assetsRoot = config.portability?.assets ?? `${sourceRoot}/assets`
  const assets = await readAssets(root, { folder: assetsRoot })
  const { model, vue, native, swift, direct, environment } = await compileProject(files, {
    theme: config.theme,
    sourceRoot,
    root: entry,
    destinations: config.portability?.destinations,
    assets,
  })
  // With a route table (shared/routes.ts) the app opens its navigation at /, not one screen.
  const { navigation } = model
  // The screen every app opens: generated here, or the shared file itself when the Web and
  // NativeScript run it as written. One with an MScreen of its own fills the window; the hosts
  // put any other on a scrolling page.
  const opens = model.components.find(
    (component) => component.name === (navigation?.home ?? entry) || component.path === entry,
  )
  const screen = isScreen(opens.view)
  const opened = direct.includes(opens.path)
    ? `#shared-ui/${posix.relative(sourceRoot, opens.path)}`
    : `./${opens.name}.vue`
  const notice =
    '// Generated: the screen this app opens (portability.entry in mavis.config.json). Do not edit.'
  const settings = macAppSettings(config.macos, config.name)
  const stores = storeEntry(model)
  const startup = startupPlan(model, config.portability?.startup)
  const content = navigation
    ? 'MavisNavigationHost()'
    : screen
      ? `${opens.name}()`
      : `MavisPage { ${opens.name}() }`
  const outputs = {
    web: vue,
    native,
    macos: new Map([
      ...swift,
      [
        'MavisAppConfiguration.swift',
        `import SwiftUI\n\nenum MavisAppConfiguration {\n    static let name = ${swiftString(settings.name)}\n    static let minWidth: CGFloat = ${settings.minWidth}\n    static let minHeight: CGFloat = ${settings.minHeight}\n}\n`,
      ],
      [
        'MavisEntry.swift',
        [
          notice,
          'import SwiftUI',
          '',
          'struct MavisEntry: View {',
          ...stores.fields,
          '    var body: some View {',
          `        ${startup.length ? `MavisEntryStartup(content: ${content})` : content}${stores.modifier}\n            .mavisAppToastScope()`,
          '    }',
          '}',
          '',
          ...swiftStartup(startup).split('\n'),
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
  const targets = config.portability?.generate ?? config.targets
  if (
    !Array.isArray(targets) ||
    !targets.length ||
    targets.some((target) => !folders[target] || !config.targets.includes(target))
  )
    throw new PortableError(
      'portability.generate must contain configured targets: web, native or macos.',
    )
  // Write only after every target compiled and startup/configuration are valid.
  for (const target of targets) {
    const folder = join(
      root,
      target === 'web' && config.web === 'nuxt' ? 'apps/web/app/generated' : folders[target],
    )
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
      await cp(join(root, assetsRoot, name), join(root, assetFolders[target], name), {
        recursive: true,
      })
  }
  await writeFile(join(root, 'mavis-env.d.ts'), environment)
  return { targets, components: model.components.length }
}
