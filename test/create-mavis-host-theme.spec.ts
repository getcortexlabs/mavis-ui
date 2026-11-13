import { describe, expect, it } from 'vitest'
// @ts-expect-error The compiler ships native ESM.
import { hostThemeModule } from '../packages/create-mavis/templates/macos/scripts/portable/host-theme.mjs'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'

describe('shared root themes in generated host bootstraps', () => {
  it('keeps builtin appearance and imports custom themes from their real shared module', () => {
    expect(hostThemeModule('midnight')).toContain("appAppearance = 'dark'")
    const pair = hostThemeModule(
      { module: 'src/shared/brand/theme.ts', export: 'day', dark: 'night' },
      'src/shared',
    )
    expect(pair).toContain(
      'import { day as appTheme, night as appDarkTheme } from "#shared-ui/brand/theme"',
    )
    expect(pair).toContain("appAppearance = 'system'")
    const single = hostThemeModule(
      { module: 'src/design/theme.ts', export: 'default' },
      'src/shared',
    )
    expect(single).toContain('import { default as appTheme } from "#shared-ui/../design/theme"')
    expect(single).toContain('appDarkTheme = undefined')
    expect(single).toContain('appAppearance = appTheme.appearance')
    expect(() => hostThemeModule({ module: 'theme.ts', export: 'bad-name' })).toThrow()
  })

  it.each(['welcome', 'tasks', 'directory'])(
    'uses the generated theme in every %s host without freezing Swift appearance',
    async (example) => {
      for (const web of ['vite', 'nuxt']) {
        const { files } = await projectFiles({
          name: 'studio',
          targets: 'web,native,macos',
          web,
          example,
        })
        const bootstrap =
          web === 'nuxt'
            ? 'apps/web/app/plugins/mavis.ts'
            : `apps/web/src/main.${example === 'directory' ? 'ts' : 'js'}`
        for (const path of [bootstrap, 'apps/mobile/src/app.ts']) {
          const text = files.get(path)
          expect(text).toContain('generated/theme')
          expect(text).toContain('theme: appTheme')
          expect(text).toContain('darkTheme: appDarkTheme')
          expect(text).not.toContain('theme: mavis')
        }
        if (web === 'nuxt') {
          const plugin = files.get(bootstrap)
          expect(plugin).toContain("appAppearance === 'dark' ? 'dark' : 'light'")
          expect(plugin).toContain(': appAppearance')
        }
        expect(files.get('apps/macos/Sources/MavisDesktop/App.swift')).not.toContain(
          '.preferredColorScheme(',
        )
      }
    },
  )
})
