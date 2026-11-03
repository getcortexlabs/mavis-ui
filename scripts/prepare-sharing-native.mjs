import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
const mobile = resolve(process.argv[2] ?? '')
const backup = join(mobile, '.mavis-sharing-backup.json')
const paths = ['src/app.ts', 'webpack.config.js']
if (process.argv.includes('--restore')) {
  const contents = JSON.parse(readFileSync(backup, 'utf8'))
  for (const file of paths) writeFileSync(join(mobile, file), contents[file])
  unlinkSync(join(mobile, 'src/sharing-probe.ts'))
  unlinkSync(backup)
} else {
  if (existsSync(backup)) throw new Error('A sharing probe is already prepared. Restore it first.')
  const contents = Object.fromEntries(paths.map((file) => [file, readFileSync(join(mobile, file), 'utf8')]))
  if (!contents['src/app.ts'].includes('createDirectory') || !contents['src/app.ts'].includes('ApplicationSettings.setString')) throw new Error('Use the generated directory reference mobile host.')
  if (existsSync(join(mobile, 'src/sharing-probe.ts'))) throw new Error('Existing probe file; nothing changed.')
  writeFileSync(backup, JSON.stringify(contents, null, 2))
  let app = contents['src/app.ts']
  app = `declare const __SHARING_CHECK__: boolean\nlet failNextWrite = false\n${app}`
  app = app.replace('const directory = createDirectory(', "if (__SHARING_CHECK__) ApplicationSettings.remove('mavis:directory')\nconst directory = createDirectory(")
  app = app.replace("ApplicationSettings.setString('mavis:directory', value)", "if (failNextWrite) { failNextWrite = false; throw new Error('Test storage failure') }\n      ApplicationSettings.setString('mavis:directory', value)")
  app += "\nif (__SHARING_CHECK__) void import('./sharing-probe').then(({runSharingProbe}) => runSharingProbe(router, () => { failNextWrite = true }))\n"
  writeFileSync(join(mobile, 'src/app.ts'), app)
  const webpack = contents['webpack.config.js'].replace('webpack.chainWebpack((config) => {', "webpack.chainWebpack((config) => {\n    config.plugin('DefinePlugin').tap((args) => { args[0].__SHARING_CHECK__ = JSON.stringify(Boolean(env.sharingCheck)); return args })")
  writeFileSync(join(mobile, 'webpack.config.js'), webpack)
  copyFileSync(resolve(import.meta.dirname, '../test/sharing/native-probe.ts'), join(mobile, 'src/sharing-probe.ts'))
}
