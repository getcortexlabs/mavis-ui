export function directoryReadme(preset, shared) {
  return `# ${preset.name}

A shared directory: search → details → edit → save. The same Vue screens run in Vue + Vite SPA, Nuxt SSR/SSG and NativeScript-Vue iOS/Android. This project selects ${preset.web ?? 'NativeScript'}${preset.target === 'both' ? ' + NativeScript' : ''}.

## Run

\`\`\`sh
${preset.target === 'both' ? 'npm run install:apps\nnpm run dev:web' : 'npm install\n' + (preset.target === 'mobile' ? 'npm run android # or npm run ios' : 'npm run dev')}
\`\`\`

Edit \`${shared}/Directory.vue\`, \`Details.vue\` or \`Edit.vue\`. Components and types come from \`#mavis\`, resolved by each host. The entries use MGrid and shared props; MReveal supplies the saved-state animation through the existing motion implementation. No DOM/views or animation scheduler live in these screens.

Navigation is installed once with \`createRouterNavigation(router)\`. MLink, MButton and MCard keep their hrefs, and the host owns routing/history. Vue + Vite uses Vue Router; Nuxt uses its own router; NativeScript uses vue-router-ns. SPA history deployments need a server fallback to index.html. Nuxt wrappers pass route parameters into shared screen props.

The directory service is created per app/server request. Web persistence uses localStorage after mount/hydration; native persistence uses ApplicationSettings. Stored data is a local demonstration, not a backend or cross-device synchronization. Failed writes preserve the draft and can be retried. Replace the host storage service for your application.

## Check sharing

\`\`\`sh
npx @getcortexlabs/create-mavis --check-portability
npx @getcortexlabs/create-mavis --fix-imports # preview
npx @getcortexlabs/create-mavis --fix-imports --write
\`\`\`

The audit follows local imports, reports locations and suggestions, and never converts arbitrary HTML/CSS or device APIs. Only named, shared renderer imports can be migrated automatically after host aliases exist. An empty report does not certify third-party dependencies or replace runtime testing.

${preset.web === 'nuxt' ? 'Nuxt: run build for SSR, generate for static output, and typecheck. In a combined project these commands live in apps/web. Dynamic entry routes are reached through real links during prerendering.\n\n' : ''}${preset.target !== 'web' ? 'Native: run typecheck, bundle:android and bundle:ios in the mobile directory. Runtime builds require the NativeScript CLI and SDKs (macOS/Xcode for iOS).\n\n' : ''}When testing an unreleased creator from source, install matching local Mavis tarballs. Package pins are updated together at release.
`
}
