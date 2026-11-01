import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const source = resolve('.')
const registry = process.argv.includes('--registry')
const version = JSON.parse(readFileSync('packages/core/package.json', 'utf8')).version
const destination = resolve('artifacts/release/packages')
const manifest = JSON.parse(readFileSync(join(destination, 'manifest.json'), 'utf8'))
const directory = mkdtempSync(join(tmpdir(), 'mavis-consumers-'))
const json = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
const run = (cwd, command, args) => execFileSync(command, args, { cwd, stdio: 'inherit' })

const pascal = (template) =>
  template.replaceAll(
    /<(\/?)m-([a-z]+(?:-[a-z]+)*)/g,
    (_, slash, name) =>
      `<${slash}M${name
        .split('-')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('')}`,
  )

for (const platform of ['web', 'native', 'native-vite']) {
  const cwd = join(directory, platform)
  mkdirSync(join(cwd, 'src'), { recursive: true })
  const vite = platform === 'native-vite'
  const renderer = platform === 'web' ? '@getcortexlabs/mavis-web' : '@getcortexlabs/mavis/vue'
  for (const file of ['Consumer.vue', 'Types.vue']) {
    const template = readFileSync(`test/consumers/${file}`, 'utf8').replaceAll(
      'mavis-renderer',
      renderer,
    )
    // @nativescript/vite compiles hyphenated tags as native elements, so its templates use PascalCase.
    writeFileSync(
      join(cwd, 'src', file),
      vite && file === 'Consumer.vue' ? pascal(template) : template,
    )
  }
  const dependencies =
    platform === 'web'
      ? { vue: '3.5.42', '@vue/server-renderer': '3.5.42' }
      : {
          '@nativescript/core': '9.1.3',
          'nativescript-vue': '3.1.3',
          '@rafaelaugusto/jolt': '0.1.0-rc.1',
        }
  for (const pkg of manifest.filter(
    ({ name }) => name.endsWith('-core') || name === renderer.replace('/vue', ''),
  )) {
    dependencies[pkg.name] = registry ? version : `file:${join(destination, pkg.filename)}`
  }
  json(join(cwd, 'package.json'), {
    name: `mavis-${platform}-consumer`,
    version: '0.0.0',
    private: true,
    ...(platform === 'web' ? { type: 'module' } : { main: 'src/main.ts' }),
    dependencies,
    devDependencies: {
      typescript: '6.0.3',
      'vue-tsc': '3.3.13',
      ...(platform === 'web'
        ? { vite: '6.4.5', '@vitejs/plugin-vue': '5.2.4' }
        : vite
          ? {
              '@nativescript/types': '9.1.1',
              '@nativescript/vite': '8.0.21',
              '@vitejs/plugin-vue': '6.0.5',
              '@vitejs/plugin-vue-jsx': '5.1.5',
              vite: '8.3.5',
            }
          : {
              '@nativescript/android': '9.1.1',
              '@nativescript/ios': '9.1.0',
              '@nativescript/types': '9.1.1',
              '@nativescript/webpack': '5.0.39',
            }),
    },
  })
  json(join(cwd, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      lib: ['ES2023', 'DOM'],
      types: [],
      ...(platform !== 'web' ? { paths: { vue: ['./node_modules/nativescript-vue'] } } : {}),
    },
    vueCompilerOptions: {
      strictTemplates: true,
      ...(platform !== 'web' ? { target: 3, lib: 'nativescript-vue' } : {}),
    },
    include: ['src'],
  })
  if (platform === 'web') {
    writeFileSync(
      join(cwd, 'index.html'),
      '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mavis consumer</title><div id="app"></div><script type="module" src="/src/main.ts"></script></html>\n',
    )
    writeFileSync(
      join(cwd, 'vite.config.mjs'),
      "import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nexport default defineConfig({ plugins: [vue()] })\n",
    )
    writeFileSync(
      join(cwd, 'src/main.ts'),
      `import { createApp } from 'vue'\nimport { createMavis } from '${renderer}'\nimport '${renderer}/style.css'\nimport Consumer from './Consumer.vue'\ncreateApp(Consumer).use(createMavis()).mount('#app')\n`,
    )
  } else {
    cpSync(join(source, 'examples/catalog/App_Resources'), join(cwd, 'App_Resources'), {
      recursive: true,
    })
    writeFileSync(
      join(cwd, 'src/env.d.ts'),
      "declare module '*.vue' { import type { DefineComponent } from 'nativescript-vue'; const component: DefineComponent; export default component }\n",
    )
    writeFileSync(
      join(cwd, 'nativescript.config.ts'),
      "export default { id: 'com.getcortexlabs.mavis.consumer', appPath: 'src', appResourcesPath: 'App_Resources' }\n",
    )
    if (vite) {
      writeFileSync(
        join(cwd, 'vite.config.mts'),
        "import { defineConfig, mergeConfig } from 'vite'\nimport { vueConfig } from '@nativescript/vite/vue'\nexport default defineConfig(({ mode }) => mergeConfig(vueConfig({ mode }), {}))\n",
      )
    } else {
      writeFileSync(
        join(cwd, 'webpack.config.js'),
        "const webpack = require('@nativescript/webpack')\nmodule.exports = (env) => { webpack.init(env); return webpack.resolveConfig() }\n",
      )
    }
    writeFileSync(
      join(cwd, 'src/main.ts'),
      `import { createApp, h } from 'nativescript-vue'\nimport { createMavis } from '${renderer}'\nimport Consumer from './Consumer.vue'\ncreateApp({ render: () => h('Frame', {}, [h(Consumer)]) }).use(createMavis()).start()\n`,
    )
  }
  run(cwd, 'npm', ['install', '--no-audit', '--no-fund'])
  writeFileSync(
    join(cwd, 'singleton.cjs'),
    `const assert = require('node:assert/strict')\nconst { createRequire } = require('node:module')\nconst { realpathSync } = require('node:fs')\nconst local = createRequire(require.resolve('${renderer}'))\nconst shared = createRequire(require.resolve('@getcortexlabs/mavis-core/vue'))\nfor (const name of ['@vue/runtime-core', '@vue/reactivity', '@vue/shared']) {\n  assert.equal(realpathSync(local.resolve(name)), realpathSync(shared.resolve(name)), name)\n  assert.equal(realpathSync(require.resolve(name)), realpathSync(shared.resolve(name)), name)\n}\nconsole.log('Single Vue runtime confirmed')\n`,
  )
  run(cwd, 'node', ['singleton.cjs'])
  run(cwd, 'npx', ['--no-install', 'vue-tsc', '--noEmit'])
  if (platform === 'web') {
    writeFileSync(
      join(cwd, 'ssr.mjs'),
      "import assert from 'node:assert/strict'\nimport { createSSRApp, h } from 'vue'\nimport { renderToString } from '@vue/server-renderer'\nimport { createMavis, MButton } from '@getcortexlabs/mavis-web'\nconst html = await renderToString(createSSRApp({ render: () => h(MButton, {}, () => 'Ready') }).use(createMavis()))\nassert.match(html, /<button/)\nassert.match(html, /Ready/)\nconsole.log('SSR import/render passed')\n",
    )
    run(cwd, 'node', ['ssr.mjs'])
    run(cwd, 'npx', ['--no-install', 'vite', 'build'])
    const lock = readFileSync(join(cwd, 'package-lock.json'), 'utf8')
    assert(!/node_modules\/(?:@nativescript\/|nativescript-vue|@rafaelaugusto\/jolt)/.test(lock))
  } else {
    run(cwd, 'node', [
      '--input-type=module',
      '-e',
      "import { mavis } from '@getcortexlabs/mavis'; if (!mavis.name) throw Error('Missing theme'); console.log('Native theme import is platform-independent')",
    ])
    if (vite) {
      // Each platform bundle must carry its own Mavis platform files, not the shared fallbacks (#58).
      const markers = {
        android: ['com.mavis.ui.FlexLayout', 'com.mavis.ui.AccessibleSlider', 'com.mavis.ui.Box'],
        ios: ['measureAtWidth', 'UIKeyboardWillChangeFrameNotification', 'releaseNativeObject'],
      }
      for (const target of ['android', 'ios']) {
        rmSync(join(cwd, '.ns-vite-build'), { recursive: true, force: true })
        run(cwd, 'npx', ['--no-install', 'vite', 'build', '--', `--env.${target}`])
        const bundle = readdirSync(join(cwd, '.ns-vite-build'))
          .filter((file) => file.endsWith('.mjs'))
          .map((file) => readFileSync(join(cwd, '.ns-vite-build', file), 'utf8'))
          .join('\n')
        const other = target === 'android' ? 'ios' : 'android'
        for (const marker of markers[target])
          assert(bundle.includes(marker), `${target} bundle lacks ${marker}`)
        for (const marker of markers[other])
          assert(!bundle.includes(marker), `${target} bundle includes ${marker}`)
        console.log(`Vite ${target} bundle uses the ${target} platform files`)
      }
    } else {
      run(cwd, 'npx', ['--no-install', 'webpack', '--env', 'android'])
      run(cwd, 'npx', ['--no-install', 'webpack', '--env', 'ios'])
      // Bundle-only output is not a NativeScript platform project. Let the CLI create it later.
      rmSync(join(cwd, 'platforms'), { recursive: true, force: true })
    }
  }
}
const result = {
  source: registry ? 'registry' : 'tarballs',
  version,
  directory,
  checked: ['web', 'native', 'native-vite'],
}
json(resolve(`artifacts/release/consumers-${registry ? 'registry' : 'tarballs'}.json`), result)
console.log(JSON.stringify(result, null, 2))
