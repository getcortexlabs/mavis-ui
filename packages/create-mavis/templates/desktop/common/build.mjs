import { build } from 'esbuild'
import { parse, compileScript } from '@vue/compiler-sfc'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
await build({
  entryPoints: [resolve(here, 'src/main.ts')],
  outfile: resolve(here, 'dist/main.mjs'),
  bundle: true,
  packages: undefined,
  external: ['@nativescript/windows-napi'],
  nodePaths: [resolve(here, 'node_modules')],
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  alias: {
    '#mavis': resolve(here, 'src/components.ts'),
    '#shared-ui': resolve(here, '__MAVIS_SHARED_ROOT__'),
    '#desktop-host': resolve(here, 'src/host.mjs'),
    vue: resolve(here, 'node_modules/vue/dist/vue.runtime.esm-bundler.js'),
    'vue-router': resolve(here, 'node_modules/vue-router/dist/vue-router.mjs'),
  },
  plugins: [
    {
      name: 'shared-vue-screens',
      setup(build) {
        build.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
          const source = await readFile(path, 'utf8')
          const { descriptor, errors } = parse(source, { filename: path })
          if (errors.length) throw errors[0]
          const id = createHash('sha256').update(path).digest('hex').slice(0, 8)
          const script = compileScript(descriptor, { id, inlineTemplate: true })
          return { contents: script.content, loader: 'ts', resolveDir: dirname(path) }
        })
      },
    },
  ],
})
console.log('Built __MAVIS_NAME__ from shared Vue screens.')
