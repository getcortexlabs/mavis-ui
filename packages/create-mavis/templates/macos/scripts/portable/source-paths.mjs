import { posix } from 'node:path'

/** Project-relative paths stay intact for diagnostics and host imports. */
export const componentName = (path) => posix.basename(path).replace(/\.(vue|lite\.tsx)$/, '')
export const moduleName = (path) => path.replace(/^shared\//, '').replace(/\.ts$/, '')
export const relativeImport = (path, from) => {
  if (!/^\.\.?\//.test(from) || from.includes('\\')) return null
  const target = posix.normalize(posix.join(posix.dirname(path), from))
  return target === '..' || target.startsWith('../') || posix.isAbsolute(target) ? null : target
}
