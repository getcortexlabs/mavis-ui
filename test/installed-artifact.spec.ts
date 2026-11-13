import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error Validation helpers ship ESM.
import { verifyInstalledArtifact } from '../scripts/lib/installed-artifact.mjs'

const folders: string[] = []
afterEach(async () => {
  await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })))
})

async function consumer() {
  const root = await mkdtemp(join(tmpdir(), 'mavis-installed-artifact-'))
  folders.push(root)
  const name = '@example/compiler',
    packageRoot = join(root, 'node_modules', name)
  await mkdir(packageRoot, { recursive: true })
  await writeFile(
    join(packageRoot, 'package.json'),
    JSON.stringify({ name, version: '1.0.0', exports: './index.js' }),
  )
  await writeFile(join(packageRoot, 'index.js'), '')
  const artifact = {
    path: join(root, 'compiler.tgz'),
    version: '1.0.0',
    integrity: 'sha512-fixture',
  }
  await writeFile(artifact.path, '')
  const locked = {
    version: artifact.version,
    resolved: 'file:compiler.tgz',
    integrity: artifact.integrity,
  }
  await writeFile(
    join(root, 'package-lock.json'),
    JSON.stringify({ packages: { [`node_modules/${name}`]: locked } }),
  )
  return { root, name, from: join(root, 'package.json'), packageRoot, artifact }
}

describe('clean consumer dependency resolution', () => {
  it('confirms the local artifact, version and integrity from the actual resolution', async () => {
    const setup = await consumer()
    await expect(verifyInstalledArtifact(setup)).resolves.toMatchObject({
      name: setup.name,
      version: '1.0.0',
      integrity: setup.artifact.integrity,
    })
  })

  it('rejects a same-version registry fallback and another local artifact', async () => {
    const setup = await consumer()
    const lock = JSON.parse(await readFile(join(setup.root, 'package-lock.json'), 'utf8'))
    lock.packages[`node_modules/${setup.name}`].resolved = 'https://registry.npmjs.org/compiler.tgz'
    await writeFile(join(setup.root, 'package-lock.json'), JSON.stringify(lock))
    await expect(verifyInstalledArtifact(setup)).rejects.toThrow('local tarball')
    await writeFile(join(setup.root, 'other.tgz'), '')
    lock.packages[`node_modules/${setup.name}`].resolved = 'file:other.tgz'
    await writeFile(join(setup.root, 'package-lock.json'), JSON.stringify(lock))
    await expect(verifyInstalledArtifact(setup)).rejects.toThrow('expected release artifact')
  })

  it('rejects an installed symlink back to the repository', async () => {
    const setup = await consumer()
    const checkout = await mkdtemp(join(tmpdir(), 'mavis-checkout-artifact-'))
    folders.push(checkout)
    await writeFile(
      join(checkout, 'package.json'),
      await readFile(join(setup.packageRoot, 'package.json')),
    )
    await writeFile(join(checkout, 'index.js'), '')
    await rm(setup.packageRoot, { recursive: true })
    await symlink(checkout, setup.packageRoot, 'dir')
    await expect(verifyInstalledArtifact(setup)).rejects.toThrow('must resolve inside')
  })
})
