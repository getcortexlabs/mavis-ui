import { packageCommands } from './package-manager.mjs'

export function directoryReadme(preset, shared) {
  const commands = packageCommands(preset.packageManager)
  const combined = preset.target === 'both'
  const start = [
    commands.setup(combined),
    preset.target === 'mobile'
      ? commands.run('ios')
      : combined
        ? commands.run('dev:web')
        : commands.run('dev'),
    ...(preset.target !== 'web'
      ? [commands.run('android'), ...(combined ? [commands.run('ios')] : [])]
      : []),
  ].join('\n')
  return `# ${preset.name}

A shared directory: search → details → edit → save. The same Vue screens run in Vue + Vite SPA, Nuxt SSR/SSG and NativeScript-Vue iOS/Android. This project selects ${preset.web ?? 'NativeScript'}${preset.target === 'both' ? ' + NativeScript' : ''}.

## Run

\`\`\`sh
${start}
\`\`\`

Edit \`${shared}/Directory.vue\`, \`Details.vue\` or \`Edit.vue\`. Components and types come from \`#mavis\`, resolved by each host. The entries use MGrid and shared props; MReveal supplies the saved-state animation through the existing motion implementation. No DOM/views or animation scheduler live in these screens.

Navigation is installed once with \`createRouterNavigation(router)\`. MLink, MButton and MCard keep their hrefs, and the host owns routing/history. Vue + Vite uses Vue Router; Nuxt uses its own router; NativeScript uses vue-router-ns. SPA history deployments need a server fallback to index.html. Nuxt wrappers pass route parameters into shared screen props.

The directory service is created per app/server request. Web persistence uses localStorage after mount/hydration; native persistence uses ApplicationSettings. Stored data is a local demonstration, not a backend or cross-device synchronization. Failed writes preserve the draft and can be retried. Replace the host storage service for your application.

## Check sharing

\`\`\`sh
${commands.creator} --check-portability
${commands.creator} --fix-imports # preview
${commands.creator} --fix-imports --write
\`\`\`

The audit follows local imports, reports locations and suggestions, and never converts arbitrary HTML/CSS or device APIs. Only named, shared renderer imports can be migrated automatically after host aliases exist. An empty report does not certify third-party dependencies or replace runtime testing.

${preset.web === 'nuxt' ? `Nuxt: use \`${commands.run('build')}\` for SSR, \`${commands.run('generate')}\` for static output, and \`${commands.run('typecheck')}\`. In a combined project these commands live in apps/web. Dynamic entry routes are reached through real links during prerendering.\n\n` : ''}${preset.target !== 'web' ? `Native: run \`${commands.run('typecheck')}\`, \`${commands.run('bundle:android')}\` and \`${commands.run('bundle:ios')}\` in the mobile directory. Runtime builds require the NativeScript CLI and SDKs (macOS/Xcode for iOS).\n\n` : ''}${combined ? `Web and mobile keep separate dependency trees. After the initial setup above, reinstall both with \`${commands.run('install:apps')}\`. Do not add apps/mobile to the Web workspace.\n\n` : ''}${preset.packageManager === 'pnpm' ? 'Use pnpm 10.26+. The generated workspace files configure hoisting, build scripts and separate mobile dependencies.\n\n' : ''}${preset.packageManager === 'yarn' ? 'Yarn Classic and modern Yarn use node_modules. The initial lockfiles mark project boundaries. If a fresh dependency is quarantined, retry after the configured minimum package age.\n\n' : ''}Commit ${combined ? 'both generated lockfiles' : `the generated ${commands.lockfile}`}. When testing an unreleased creator from source, install matching local Mavis tarballs. Package pins are updated together at release.
`
}
