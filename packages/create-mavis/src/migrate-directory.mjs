import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'

const templates = new URL('../templates/', import.meta.url)
const hash = (text) => createHash('sha256').update(text).digest('hex')
const posix = (path) => path.split(sep).join('/')
const ignored = new Set([
  'node_modules',
  '.git',
  '.nuxt',
  '.output',
  '.build',
  'dist',
  'platforms',
  'hooks',
  'artifacts',
])
const refusal = (name) =>
  new Error(
    `Directory migration stopped: ${name} differs from the published RC.13 template. Preserve your changes and migrate its typed storage adapter manually; no files changed.`,
  )

/** Only the exact published reference app is rewritten, and only by explicit opt-in. */
export async function directoryMigration({ root, sources, enabled, hostPaths, appearance, read }) {
  const manifest = JSON.parse(
    await readFile(new URL('migrations/directory-rc13.json', templates), 'utf8'),
  )
  const store = [...sources.keys()].find((name) => name.endsWith('/directory-store.ts'))
  const files = new Map(),
    diffs = []
  if (!store) {
    if (enabled) throw refusal('directory-store.ts (not found)')
    return { files, diffs }
  }
  const currentStore = await readFile(
    new URL('directory/shared/directory-store.ts', templates),
    'utf8',
  )
  if (sources.get(store) === currentStore) return { files, diffs }
  const legacy = hash(sources.get(store)) === manifest.files['shared/directory-store.ts'].source
  if (!legacy) {
    if (enabled) throw refusal(store)
    return { files, diffs }
  }
  if (!enabled)
    throw new Error(
      'This is the published RC.13 Directory store. Preview its typed host migration with --add-macos --migrate-directory; apply the reviewed changes with --write.',
    )
  const shared = posix(dirname(store)),
    recognized = new Set()
  for (const name of Object.keys(manifest.files).filter((name) => name.startsWith('shared/'))) {
    const path = `${shared}/${name.slice('shared/'.length)}`
    if (!sources.has(path) || hash(sources.get(path)) !== manifest.files[name].source)
      throw refusal(path)
    recognized.add(path)
  }
  for (const [path, template] of hostPaths) {
    const value = await read(path)
    if (!value || hash(value) !== manifest.files[template]?.[appearance]) throw refusal(path)
    recognized.add(path)
    const next = (await readFile(new URL('directory/' + template, templates), 'utf8'))
      .replaceAll('__MAVIS_SHARED__', '#shared-ui')
      .replaceAll('__MAVIS_APPEARANCE__', appearance)
    files.set(path, next)
    const adapter = template.startsWith('nuxt/')
      ? `${posix(dirname(dirname(path)))}/utils/directory-storage.ts`
      : `${posix(dirname(path))}/directory-storage.ts`
    if ((await read(adapter)) !== undefined) throw refusal(adapter)
    files.set(
      adapter,
      (await readFile(new URL('directory/host/directory-storage.ts', templates), 'utf8')).replace(
        "'../shared/directory-store'",
        "'#shared-ui/directory-store'",
      ),
    )
  }
  // An extra consumer may depend on the legacy read/write interface. Never migrate only half
  // the application, even when its shared files happen to match the reference.
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ignored.has(entry.name)) continue
      const full = join(directory, entry.name),
        path = posix(relative(root, full))
      if (entry.isSymbolicLink()) throw refusal(path + ' (linked source)')
      if (entry.isDirectory()) await inspect(full)
      else if (/\.(vue|[cm]?[jt]sx?)$/.test(entry.name) && !recognized.has(path)) {
        const text = await readFile(full, 'utf8')
        if (/directory-store|createDirectory\s*\(/.test(text))
          throw refusal(path + ' (additional consumer)')
      }
    }
  }
  await inspect(root)
  for (const name of ['directory-store.ts', 'Edit.vue']) {
    const path = `${shared}/${name}`
    files.set(path, await readFile(new URL(`directory/shared/${name}`, templates), 'utf8'))
  }
  for (const [path, after] of files) {
    const before = sources.get(path) ?? (await read(path))
    diffs.push({ file: path, before: before ?? '', after })
  }
  return { files, diffs }
}

/** Complete old/new lines keep an opt-in migration reviewable without guessing edits. */
export function migrationDiff({ file, before, after }) {
  return [
    `--- a/${file}`,
    `+++ b/${file}`,
    ...before
      .trimEnd()
      .split('\n')
      .filter((line) => before || line)
      .map((line) => '-' + line),
    ...after
      .trimEnd()
      .split('\n')
      .map((line) => '+' + line),
  ].join('\n')
}
