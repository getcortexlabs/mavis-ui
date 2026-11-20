const { resolve, dirname } = require('node:path')
const webpack = require('@nativescript/webpack')
module.exports = (env) => {
  const framework = env.framework || 'plain'
  if (!['plain', 'react', 'angular', 'svelte', 'solid'].includes(framework))
    throw new Error('Unknown framework')
  webpack.init(env)
  webpack.useConfig('typescript')
  webpack.Utils.addCopyRule({
    from: 'lucide.ttf',
    to: 'fonts',
    context: resolve(__dirname, 'node_modules/@getcortexlabs/mavis/fonts'),
  })
  webpack.chainWebpack((config) => {
    config.resolve.alias.set('#adapter', resolve(__dirname, `src/_${framework}.ts`))
    config.resolve.alias.set(
      '@nativescript/core',
      resolve(__dirname, 'node_modules/@nativescript/core'),
    )
    config.resolve.alias.set('@rafaelaugusto/jolt$', require.resolve('@rafaelaugusto/jolt'))
    config.resolve.merge({ conditionNames: ['svelte', 'browser', '...'] })
    config.plugin('NoVueInDirectAdapters').use(
      class {
        apply(compiler) {
          compiler.hooks.afterCompile.tap('NoVueInDirectAdapters', (compilation) => {
            for (const module of compilation.modules) {
              const file = module.resource?.replaceAll('\\', '/') ?? ''
              if (
                /\/node_modules\/(vue|@vue|nativescript-vue)\//.test(file) ||
                /\/mavis\/dist\/vue\//.test(file)
              )
                throw new Error(`Direct ${framework} adapter imported Vue: ${file}`)
            }
          })
        }
      },
    )
    config.plugin('DefinePlugin').tap((args) => {
      Object.assign(args[0], {
        __DEV__: 'true',
        __TEST__: 'false',
        __FRAMEWORK__: JSON.stringify(framework),
        __ADAPTER_CHECK__: JSON.stringify(!!env.adapterCheck),
      })
      return args
    })
    // NativeScript's resolver otherwise chooses Solid's nonreactive Node/server condition.
    for (const name of ['solid-js', '@solidjs/signals', '@solidjs/universal']) {
      const manifest = resolve(__dirname, 'node_modules', name, 'package.json')
      const pkg = require(manifest)
      let entry = pkg.exports['.']
      while (typeof entry !== 'string') entry = entry.browser ?? entry.default
      config.resolve.alias.set(`${name}$`, resolve(dirname(manifest), entry))
    }
    config.module
      .rule('svelte')
      .test(/\.svelte$/)
      .use('svelte-loader')
      .loader('svelte-loader')
      .options({
        compilerOptions: { dev: false, namespace: 'foreign' },
        preprocess: {
          script: ({ content, attributes }) => {
            if (attributes.lang !== 'ts') return undefined
            const ts = require('typescript')
            return {
              code: ts.transpileModule(content, {
                compilerOptions: {
                  target: ts.ScriptTarget.ES2022,
                  module: ts.ModuleKind.ESNext,
                  verbatimModuleSyntax: true,
                },
              }).outputText,
            }
          },
        },
      })
  })
  return webpack.resolveConfig()
}
