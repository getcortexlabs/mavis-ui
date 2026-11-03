const { resolve } = require('node:path')
const webpack = require('@nativescript/webpack')
module.exports = (env) => {
  webpack.init(env)
  webpack.Utils.addCopyRule({
    from: 'lucide.ttf',
    to: 'fonts',
    context: resolve(__dirname, 'node_modules/@getcortexlabs/mavis/fonts'),
  })
  webpack.chainWebpack((config) => {
    config.resolve.alias.set('#shared-ui', resolve(__dirname, '__MAVIS_SHARED_ROOT__'))
    config.resolve.alias.set('#mavis$', resolve(__dirname, 'src/mavis.ts'))
    config.resolve.alias.set('vue$', resolve(__dirname, 'node_modules/nativescript-vue'))
    for (const name of [
      'nativescript-vue',
      '@nativescript/core',
      '@vue/runtime-core',
      '@vue/reactivity',
      '@vue/shared',
    ])
      config.resolve.alias.set(name, resolve(__dirname, 'node_modules', name))
  })
  return webpack.resolveConfig()
}
