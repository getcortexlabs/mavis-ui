import { build } from 'esbuild'
import { parse, compileScript } from '@vue/compiler-sfc'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const jolt = dirname(require.resolve('@rafaelaugusto/jolt/package.json'))
const version = JSON.parse(await readFile(resolve(jolt, 'package.json'), 'utf8')).version
if (version !== '0.1.0-rc.17')
  throw new Error(`This private adapter requires Jolt RC.17, found ${version}`)
await build({
  entryPoints: [resolve(here, 'src/main.ts')],
  outfile: resolve(here, 'dist/main.mjs'),
  bundle: true,
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
    // Private, version-checked experiment. No public AppKit API is claimed.
    '#jolt-track': resolve(jolt, 'dist/core/track.js'),
    '#jolt-transition': resolve(jolt, 'dist/core/transition.js'),
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
console.log('Built Directory from the existing shared Vue screens and store.')
