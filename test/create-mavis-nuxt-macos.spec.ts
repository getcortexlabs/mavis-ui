import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships native ESM.
import { projectSummary } from '../packages/create-mavis/src/ui.mjs'

describe('Nuxt and Mac share the chosen source', () => {
  it.each(['welcome', 'tasks', 'directory'])(
    'plans %s for both Nuxt rendering modes and every package manager',
    async (example) => {
      for (const rendering of ['ssr', 'ssg'])
        for (const packageManager of ['npm', 'pnpm', 'yarn']) {
          const { preset, files } = await projectFiles({
            name: 'studio',
            targets: 'web,native,macos',
            web: 'nuxt',
            rendering,
            example,
            packageManager,
          })
          const config = JSON.parse(files.get('mavis.config.json'))
          const web = JSON.parse(files.get('apps/web/package.json'))
          const root = JSON.parse(files.get('package.json'))
          expect(config).toMatchObject({
            web: 'nuxt',
            rendering,
            targets: ['web', 'native', 'macos'],
          })
          expect(web.dependencies.nuxt).toBeDefined()
          expect(web.scripts).toMatchObject({
            build: 'nuxt build',
            generate: 'nuxt generate',
            postinstall: 'nuxt prepare',
            typecheck: 'nuxt typecheck',
          })
          expect(web.devDependencies.vite).toBeUndefined()
          expect(root.scripts['build:web']).toContain(
            `run ${rendering === 'ssg' ? 'generate' : 'build'}`,
          )
          expect(files.has('apps/web/index.html')).toBe(false)
          expect(files.has('apps/web/src/main.js')).toBe(false)
          expect(files.get('apps/web/nuxt.config.ts')).toContain(
            "new URL('../../shared', import.meta.url)",
          )
          expect(projectSummary(preset)).toContain(`Nuxt · ${rendering.toUpperCase()}`)
          expect(files.get('README.md')).toContain(`Nuxt (${rendering})`)
          expect(files.get('apps/web/app/plugins/mavis.ts')).toContain("from '../generated/theme'")
          expect(files.get('apps/web/app/plugins/mavis.ts')).toContain('theme: appTheme')
          expect(files.get('apps/mobile/src/app.ts')).toContain("from './generated/theme'")
          expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
          if (example === 'directory') {
            const plugin = files.get('apps/web/app/plugins/mavis.ts')
            expect(plugin).toContain('const directory = createDirectory(')
            expect(plugin).toContain('onNuxtReady(() => {')
            expect(plugin).toContain('void directory.restore()')
            expect(files.has('apps/web/app/utils/directory-storage.ts')).toBe(true)
            expect(files.has('apps/web/app/pages/entries/[id]/edit.vue')).toBe(true)
            expect(files.get('apps/macos/Sources/MavisDesktop/App.swift')).toContain(
              'UserDefaultsDirectoryStorage()',
            )
          } else {
            expect(files.get('apps/web/app/app.vue')).toContain("from './generated/entry'")
            expect(files.get('apps/web/app/assets/main.css')).toContain('.mavis-page')
            expect(files.get('apps/web/app/plugins/mavis.ts')).toContain('createMavis(')
          }
        }
    },
  )

  it.each(['welcome', 'tasks', 'directory'])(
    'generates the %s Nuxt entry, native screens and Swift from the same compiler package',
    async (example) => {
      const root = await mkdtemp(join(tmpdir(), 'mavis-nuxt-mac-'))
      try {
        const { files } = await projectFiles({
          name: 'studio',
          targets: 'web,native,macos',
          web: 'nuxt',
          example,
        })
        for (const [name, text] of files) {
          await mkdir(dirname(join(root, name)), { recursive: true })
          await writeFile(join(root, name), text)
        }
        await symlink(
          join(import.meta.dirname, '../node_modules'),
          join(root, 'node_modules'),
          'dir',
        )
        execFileSync(process.execPath, ['scripts/generate.mjs'], { cwd: root, stdio: 'pipe' })
        const entry =
          example === 'directory' ? 'Directory' : example === 'tasks' ? 'Tasks' : 'Welcome'
        expect(await readFile(join(root, 'apps/web/app/generated/entry.ts'), 'utf8')).toContain(
          entry,
        )
        expect(await readFile(join(root, 'apps/mobile/src/generated/entry.ts'), 'utf8')).toContain(
          entry,
        )
        await expect(access(join(root, 'apps/web/src/generated'))).rejects.toThrow()
        expect(
          await readFile(
            join(root, `apps/macos/Sources/MavisDesktop/Generated/${entry}.swift`),
            'utf8',
          ),
        ).toContain(`struct ${entry}`)
        expect(
          await readFile(
            join(root, 'apps/macos/Sources/MavisDesktop/Generated/MavisAppConfiguration.swift'),
            'utf8',
          ),
        ).toContain('static let name = "studio"')
      } finally {
        await rm(root, { recursive: true, force: true })
      }
    },
  )
})
