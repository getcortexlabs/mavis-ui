const { resolve } = require('node:path')
const webpack = require('@nativescript/webpack')

module.exports = (env) => {
  webpack.init(env)
  // The icon font ships with the package; NativeScript loads fonts from the app's fonts folder.
  webpack.Utils.addCopyRule({
    from: 'lucide.ttf',
    to: 'fonts',
    context: resolve(__dirname, 'node_modules/@getcortexlabs/mavis/fonts'),
  })
  webpack.chainWebpack((config) => {
    config.plugin('DefinePlugin').tap((args) => {
      args[0].__LAYOUT_CHECK__ = JSON.stringify(Boolean(env.layoutCheck))
      args[0].__LAYOUT_ROTATE__ = JSON.stringify(env.layoutCheck === 'rotate')
      args[0].__LAYOUT_NATIVE__ = JSON.stringify(/^native/.test(String(env.layoutCheck)))
      args[0].__LAYOUT_SCROLL__ = JSON.stringify(env.layoutCheck === 'native-scroll')
      args[0].__SCREEN_CHECK__ = JSON.stringify(Boolean(env.screenCheck))
      // `keyboard` opens the Screen fixture for manual keyboard checks, without the stage probe.
      args[0].__SCREEN_PROBE__ = JSON.stringify(
        Boolean(env.screenCheck) && env.screenCheck !== 'keyboard',
      )
      args[0].__PERFORMANCE_CHECK__ = JSON.stringify(Boolean(env.performanceCheck))
      args[0].__PERFORMANCE_SUITE__ = JSON.stringify(
        env.performanceCheck === 'catalog' ? 'catalog' : 'standard',
      )
      args[0].__INPUT_CHECK__ = JSON.stringify(env.inputCheck || '')
      args[0].__TOAST_CHECK__ = JSON.stringify(Boolean(env.toastCheck))
      args[0].__SELECT_CHECK__ = JSON.stringify(Boolean(env.selectCheck))
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
    for (const name of [
      '@rafaelaugusto/jolt',
      '@rafaelaugusto/jolt/vue',
      '@rafaelaugusto/jolt/bottom-sheet',
    ]) {
      config.resolve.alias.set(`${name}$`, require.resolve(name))
    }
  })
  return webpack.resolveConfig()
}
