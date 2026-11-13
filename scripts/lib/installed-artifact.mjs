import assert from 'node:assert/strict'
import { readFile, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'

/** The consumer must resolve the packed dependency, not a same-version registry/workspace copy. */
export async function verifyInstalledArtifact({ from, root, name, entry = name, artifact }) {
  const resolved = await realpath(createRequire(from).resolve(entry))
  const consumer = await realpath(root)
  const local = relative(consumer, resolved).split(sep).join('/')
  assert.ok(local.startsWith('node_modules/'), `${name} must resolve inside ${root}/node_modules`)
  let packageRoot = dirname(resolved)
  let pkg
  while (packageRoot !== consumer) {
    try {
      const candidate = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
      if (candidate.name === name) {
        pkg = candidate
        break
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    packageRoot = dirname(packageRoot)
  }
  assert.ok(pkg, `${name} has an installed package manifest`)
  assert.equal(pkg.version, artifact.version, `${name} uses the packed version`)
  const lock = JSON.parse(await readFile(join(consumer, 'package-lock.json'), 'utf8'))
  const path = relative(consumer, packageRoot).split(sep).join('/')
  const locked = lock.packages[path]
  assert.ok(locked?.resolved?.startsWith('file:'), `${name} must come from its local tarball`)
  assert.equal(
    await realpath(resolve(consumer, locked.resolved.slice(5))),
    await realpath(artifact.path),
    `${name} resolves to the expected release artifact`,
  )
  assert.equal(locked.integrity, artifact.integrity, `${name} has the packed integrity`)
  return { name, version: pkg.version, entry: resolved, integrity: locked.integrity }
}
