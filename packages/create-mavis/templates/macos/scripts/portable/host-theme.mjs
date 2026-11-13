import { posix } from 'node:path'

/** Hosts import the same statically checked theme module as Swift generation. */
export function hostThemeModule(input = 'mavis', sourceRoot = 'shared') {
  const notice = '// Generated from mavis.config.json. Do not edit.\n'
  if (typeof input === 'string') {
    if (!['mavis', 'midnight'].includes(input)) throw new Error('Unknown starter theme.')
    return `${notice}export { mavis as appTheme, midnight as appDarkTheme } from '@getcortexlabs/mavis-core'\nexport const appAppearance = '${input === 'midnight' ? 'dark' : 'light'}' as 'light' | 'dark' | 'system'\n`
  }
  if (
    !input ||
    typeof input !== 'object' ||
    typeof input.module !== 'string' ||
    !input.module.endsWith('.ts') ||
    !/^[A-Za-z_$][\w$]*$/.test(input.export ?? '') ||
    (input.dark !== undefined && !/^[A-Za-z_$][\w$]*$/.test(input.dark))
  )
    throw new Error(
      'A shared theme names its .ts module, exported light theme and optional dark export.',
    )
  const module = `#shared-ui/${posix.relative(sourceRoot, input.module).replace(/\.ts$/, '')}`
  return `${notice}import { ${input.export} as appTheme${input.dark ? `, ${input.dark} as appDarkTheme` : ''} } from ${JSON.stringify(module)}\nexport { appTheme${input.dark ? ', appDarkTheme' : ''} }\n${input.dark ? "export const appAppearance = 'system' as 'light' | 'dark' | 'system'" : 'export const appDarkTheme = undefined\nexport const appAppearance = appTheme.appearance'}\n`
}
