import { createHost } from '#desktop-host'
import { desktopRenderer } from './renderer'
import { persistence, storageFile } from './storage'
import Welcome from '#shared-ui/Welcome.vue'
import { projectServiceKey } from '#shared-ui/services'
let application: ReturnType<ReturnType<typeof desktopRenderer>['createApp']>
const host = createHost({
  title: '__MAVIS_NAME__',
  onClose() {
    application?.unmount()
  },
})
const storage = persistence(() => host.closed)
application = desktopRenderer(host).createApp(Welcome)
application.provide(projectServiceKey, { save: (name: string) => storage.write(name) })
host.setTheme('__MAVIS_THEME__' === 'midnight')
application.mount(host.root)
host.show()
// A local acceptance hook is loaded only when explicitly supplied by the developer.
if (process.env.MAVIS_DESKTOP_CHECK) {
  const { pathToFileURL } = await import('node:url')
  const { default: check } = await import(pathToFileURL(process.env.MAVIS_DESKTOP_CHECK).href)
  await check({ host, application, storageFile })
}
