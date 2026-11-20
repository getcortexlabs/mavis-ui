import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
const applicationData =
  process.platform === 'win32'
    ? (process.env.LOCALAPPDATA ?? join(homedir(), 'AppData/Local'))
    : join(homedir(), 'Library/Application Support')
export const storageFile =
  process.env.MAVIS_DESKTOP_STORAGE ??
  join(applicationData, '__MAVIS_NAME__', '__MAVIS_STORAGE_FILE__')
export function persistence(isClosed: () => boolean) {
  return {
    async read() {
      try {
        return await readFile(storageFile, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
      }
    },
    async write(value: string) {
      if (isClosed()) throw new Error('Window closed')
      await mkdir(dirname(storageFile), { recursive: true })
      const temporary = `${storageFile}.${process.pid}.tmp`
      await writeFile(temporary, value, 'utf8')
      await rename(temporary, storageFile)
    },
  }
}
