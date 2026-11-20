import { h } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createHost } from '#desktop-host'
import { desktopRenderer } from './renderer'
import { persistence, storageFile } from './storage'
import { routes } from '#shared-ui/routes'
import { createDirectory, directoryKey } from '#shared-ui/directory-store'
import { createDirectoryStorage } from './directory-storage'
let application: ReturnType<ReturnType<typeof desktopRenderer>['createApp']>
const host = createHost({
  title: '__MAVIS_NAME__',
  onClose() {
    application?.unmount()
  },
})
const directory = createDirectory(createDirectoryStorage(persistence(() => host.closed)))
const router = createRouter({ history: createMemoryHistory(), routes })
application = desktopRenderer(host).createApp({ render: () => h(RouterView) })
application.use(router).provide(directoryKey, directory)
host.addMenu?.('Navigate', [
  ['Back', 'activate:', '[', () => router.back()],
  ['Forward', 'activate:', ']', () => router.forward()],
  ['All places', 'activate:', '1', () => router.push('/')],
])
await router.push('/')
await router.isReady()
host.setTheme('__MAVIS_THEME__' === 'midnight')
application.mount(host.root)
host.show()
await directory.restore()
if (process.env.MAVIS_DESKTOP_CHECK) {
  const { pathToFileURL } = await import('node:url')
  const { default: check } = await import(pathToFileURL(process.env.MAVIS_DESKTOP_CHECK).href)
  await check({ host, application, storageFile, directory, router })
}
