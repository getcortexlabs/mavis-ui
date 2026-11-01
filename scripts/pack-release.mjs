import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const destination = resolve(process.argv[2] ?? 'artifacts/release/packages')
const folders = ['core', 'nativescript', 'web']
const packages = folders.map((folder) =>
  JSON.parse(readFileSync(`packages/${folder}/package.json`, 'utf8')),
)
const version = packages[0].version
assert.match(version, /^\d+\.\d+\.\d+-alpha\.\d+$/)
mkdirSync(destination, { recursive: true })

for (const [index, pkg] of packages.entries()) {
  assert.equal(pkg.version, version)
  assert.equal(pkg.private, undefined)
  assert.equal(pkg.license, 'MIT')
  assert.equal(pkg.publishConfig.tag, 'alpha')
  assert.equal(pkg.publishConfig.access, 'public')
  assert.equal(
    readFileSync(`packages/${folders[index]}/LICENSE`, 'utf8'),
    readFileSync('LICENSE', 'utf8'),
  )
  if (index > 0) assert.equal(pkg.dependencies[packages[0].name], version)
}

const packed = JSON.parse(
  execFileSync(
    'npm',
    [
      'pack',
      ...packages.flatMap(({ name }) => ['--workspace', name]),
      '--pack-destination',
      destination,
      '--json',
    ],
    { encoding: 'utf8' },
  ),
)

const manifest = packed.map((entry, index) => {
  const paths = new Set(entry.files.map((file) => file.path))
  for (const path of paths) {
    assert(!/(node_modules|artifacts|AGENTS\.md|App_Resources|\.aar$|\.tgz$)/.test(path), path)
    assert(
      /^(dist\/|src\/|fonts\/|platforms\/android\/(java\/|include\.gradle$)|package\.json$|README\.md$|LICENSE$)/.test(
        path,
      ),
      path,
    )
  }
  for (const path of ['LICENSE', 'README.md', 'dist/index.js', 'dist/index.d.ts'])
    assert(paths.has(path), path)
  const checkExport = (value) => {
    if (typeof value === 'string') assert(paths.has(value.replace(/^\.\//, '')), value)
    else for (const target of Object.values(value)) checkExport(target)
  }
  checkExport(packages[index].exports)
  if (index === 1) {
    assert(paths.has('platforms/android/include.gradle'))
    assert(paths.has('platforms/android/java/com/mavis/ui/FlexLayout.java'))
    assert(paths.has('platforms/android/java/com/mavis/ui/AccessibleSlider.java'))
    assert(paths.has('platforms/android/java/com/mavis/ui/Box.java'))
    assert(paths.has('platforms/android/java/com/mavis/ui/ContentWidth.java'))
    assert(paths.has('platforms/android/java/com/mavis/ui/MeasureMemo.java'))
    assert(paths.has('platforms/android/java/com/mavis/ui/Screen.java'))
    assert(paths.has('dist/native/flex-layout.ios.js'))
    assert(paths.has('fonts/lucide.ttf'))
    assert(paths.has('fonts/LICENSE'))
  }
  if (index === 2) {
    assert.deepEqual(packages[index].sideEffects, ['./src/style.css'])
    assert(paths.has('src/fonts/lucide.woff2'))
    assert(paths.has('src/fonts/LICENSE'))
  }
  const bytes = readFileSync(resolve(destination, entry.filename))
  assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, entry.integrity)
  return {
    name: entry.name,
    version: entry.version,
    filename: entry.filename,
    integrity: entry.integrity,
    shasum: entry.shasum,
    files: paths.size,
    size: entry.size,
  }
})
writeFileSync(resolve(destination, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
writeFileSync(
  resolve(destination, 'SHA256SUMS'),
  manifest
    .map(
      ({ filename }) =>
        `${createHash('sha256')
          .update(readFileSync(resolve(destination, filename)))
          .digest('hex')}  ${filename}\n`,
    )
    .join(''),
)
console.log(JSON.stringify({ destination, packages: manifest }, null, 2))
