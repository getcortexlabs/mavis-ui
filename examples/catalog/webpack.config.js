const { resolve } = require('node:path')
const webpack = require('@nativescript/webpack')

module.exports = (env) => {
  webpack.init(env)
  webpack.chainWebpack((config) => {
    config.plugin('DefinePlugin').tap((args) => {
      args[0].__LAYOUT_CHECK__ = JSON.stringify(Boolean(env.layoutCheck))
      args[0].__LAYOUT_ROTATE__ = JSON.stringify(env.layoutCheck === 'rotate')
      args[0].__SCREEN_CHECK__ = JSON.stringify(Boolean(env.screenCheck))
      args[0].__PERFORMANCE_CHECK__ = JSON.stringify(Boolean(env.performanceCheck))
      args[0].__PERFORMANCE_SUITE__ = JSON.stringify(
        env.performanceCheck === 'catalog' ? 'catalog' : 'standard',
      )
      args[0].__INPUT_CHECK__ = JSON.stringify(env.inputCheck || '')
      args[0].__ACCESSIBILITY_CHECK__ = JSON.stringify(Boolean(env.accessibilityCheck))
      return args
    })
    // The local package and the app must use the same renderer and native runtime.
    for (const name of [
      'nativescript-vue',
      '@nativescript/core',
      '@vue/runtime-core',
      '@vue/reactivity',
      '@vue/shared',
    ]) {
      config.resolve.alias.set(name, resolve(__dirname, 'node_modules', name))
    }
    for (const name of ['@rafaelaugusto/jolt', '@rafaelaugusto/jolt/vue']) {
      config.resolve.alias.set(`${name}$`, require.resolve(name))
    }
  })
  return webpack.resolveConfig()
}
