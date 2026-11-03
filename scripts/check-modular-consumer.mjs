import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const root = process.argv[2]
  ? resolve(process.argv[2])
  : join(JSON.parse(readFileSync('artifacts/release/consumers-tarballs.json', 'utf8')).directory, 'web')
const entries = {
  full: `import { createMavis } from '@getcortexlabs/mavis-web'; import '@getcortexlabs/mavis-web/style.css'; export const plugin = createMavis();`,
  services: `export { createMavisServices } from '@getcortexlabs/mavis-web/services';`,
  selected: `import { createMavisServices } from '@getcortexlabs/mavis-web/services'; import { MButton } from '@getcortexlabs/mavis-web'; import { h } from 'vue'; import '@getcortexlabs/mavis-web/base.css'; export const Button = MButton; export const plugin = createMavisServices({ icons: { search: { render: () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: 'M2 2L22 22' })]) } }, iconFallback: 'none' });`,
}
const results = {}
for (const [name, code] of Object.entries(entries)) {
  const entry = join(root, `.mavis-modular-${name}.ts`)
  writeFileSync(entry, code)
  try {
    const bundle = await build({
      root,
      configFile: false,
      logLevel: 'warn',
      build: {
        write: false,
        assetsInlineLimit: 0,
        minify: 'esbuild',
        rollupOptions: {
          input: entry,
          preserveEntrySignatures: 'strict',
          external: ['vue', '@vue/runtime-core'],
        },
      },
    })
    const output = (Array.isArray(bundle) ? bundle : [bundle]).flatMap((result) => result.output)
    const chunks = output.filter((item) => item.type === 'chunk')
    const js = chunks.map((chunk) => chunk.code).join('\n')
    const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules))
    const assets = output
      .filter((item) => item.type === 'asset')
      .map((asset) => ({ name: asset.fileName, bytes: Buffer.byteLength(asset.source) }))
    results[name] = {
      jsBytes: Buffer.byteLength(js),
      gzipBytes: gzipSync(js).byteLength,
      assets,
      modules,
    }
    if (name === 'services') {
      assert(
        !modules.some((path) => /\/components\//.test(path)),
        'Services must not include the component registry',
      )
      assert(
        !modules.some((path) => path.includes('@rafaelaugusto/jolt')),
        'Services must not include motion backends',
      )
    }
    if (name === 'selected') {
      assert(
        modules.some((path) => path.includes('/components/MButton')),
        'Selected Button missing',
      )
      assert(
        !modules.some((path) => /\/components\/(?:MSheet|MDatePicker|MGrid)/.test(path)),
        'Unselected components retained',
      )
      assert(
        !assets.some((asset) => /\.(woff2?|ttf)$/.test(asset.name)),
        'Selective SVG entry bundled the font',
      )
    }
  } finally {
    rmSync(entry, { force: true })
  }
}
assert(
  results.selected.jsBytes < results.full.jsBytes,
  'Selective entry must be smaller than full registration',
)
assert(
  results.full.assets.some((asset) => /\.woff2$/.test(asset.name)),
  'Full installation lost the default font',
)
mkdirSync('artifacts/release', { recursive: true })
writeFileSync(
  resolve('artifacts/release/modular-consumer.json'),
  JSON.stringify(results, null, 2) + '\n',
)
console.log(
  'Packed modular consumer:',
  JSON.stringify(
    Object.fromEntries(Object.entries(results).map(([name, { modules, ...size }]) => [name, size])),
  ),
)
