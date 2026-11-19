import { h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { mkdir, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createHost } from './host.mjs'
import { appkitRenderer } from './renderer'
import { routes } from '../../../packages/create-mavis/templates/directory/shared/routes'
import {
  createDirectory,
  directoryKey,
} from '../../../packages/create-mavis/templates/directory/shared/directory-store'
import { createDirectoryStorage } from '../../../packages/create-mavis/templates/directory/host/directory-storage'

const checking = process.argv.includes('--check') || process.argv.includes('--check-host')
const storageFile =
  process.env.MAVIS_APPKIT_STORAGE ??
  (checking
    ? join(await mkdtemp(join(tmpdir(), 'mavis-appkit-check-')), 'directory.json')
    : join(homedir(), 'Library/Application Support/Mavis AppKit Experiment/directory.json'))
let failNextWrite = false
let closed = false
const persistence = {
  async read() {
    try {
      return await readFile(storageFile, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  },
  async write(value: string) {
    if (failNextWrite) {
      failNextWrite = false
      throw new Error('Requested test failure')
    }
    if (closed) throw new Error('Window closed')
    await mkdir(dirname(storageFile), { recursive: true })
    const temp = `${storageFile}.${process.pid}.tmp`
    await writeFile(temp, value, 'utf8')
    await rename(temp, storageFile)
  },
}
const directory = createDirectory(createDirectoryStorage(persistence))
const router = createRouter({ history: createMemoryHistory(), routes })
let application: ReturnType<ReturnType<typeof appkitRenderer>['createApp']>
const host = createHost({
  onClose() {
    closed = true
    application?.unmount()
  },
})
host.addMenu('Navigate', [
  ['Back', 'activate:', '[', () => router.back()],
  ['Forward', 'activate:', ']', () => router.forward()],
  ['All places', 'activate:', '1', () => router.push('/')],
])
application = appkitRenderer(host).createApp({ render: () => h(RouterView) })
application.use(router)
application.provide(directoryKey, directory)
await router.push('/')
await router.isReady()
application.mount(host.root)
host.show()
await directory.restore()
if (checking) {
  try {
    const { checkDirectory } = await import('./check.mjs')
    await checkDirectory({
      host,
      directory,
      router,
      storageFile,
      hostOnly: process.argv.includes('--check-host'),
      failWrite() {
        failNextWrite = true
      },
    })
  } finally {
    host.window.performClose(null)
    host.stop()
  }
}
