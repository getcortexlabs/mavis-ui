/** Validated published dependencies, deliberately separate from unreleased source capabilities. */
export const versions = Object.freeze({
  mavis: '0.1.0-alpha.8',
  jolt: '0.1.0-rc.10',
  vue: '3.5.44',
  nuxt: '4.6.3',
  vite: '6.4.5',
  vuePlugin: '5.2.4',
  typescript: '6.0.3',
  vueTsc: '3.3.13',
  nativeCore: '9.1.3',
  nativeVue: '3.1.3',
  android: '9.1.1',
  ios: '9.1.0',
  webpack: '5.0.39',
})

export function resolvePreset(options) {
  const {
    name,
    target = 'web',
    web = 'vite',
    rendering = web === 'nuxt' ? 'ssr' : 'client',
    theme = 'mavis',
    framework = 'vue',
    authoring = 'vue',
  } = options
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(name ?? ''))
    throw new Error(
      'Use a project name of 1–64 lowercase letters, numbers or hyphens, starting with a letter.',
    )
  if (framework !== 'vue')
    throw new Error(
      'This creator currently supports Vue. Other framework adapters are tracked in Mavis #145 and #35–39.',
    )
  if (authoring !== 'vue')
    throw new Error(
      'Portable JSX/React-style authoring for Vue is planned in Mavis #167; use Vue templates in this version.',
    )
  if (!['mobile', 'web', 'both'].includes(target))
    throw new Error('Target must be mobile, web or both.')
  if (!['vite', 'nuxt'].includes(web))
    throw new Error('Web host must be vite or nuxt. React/Next are not available yet.')
  if (!['mavis', 'midnight'].includes(theme)) throw new Error('Theme must be mavis or midnight.')
  if (target === 'mobile' && (web !== 'vite' || rendering !== 'client'))
    throw new Error('A mobile-only project has no Web rendering mode.')
  if (
    (web === 'vite' && rendering !== 'client') ||
    (web === 'nuxt' && !['ssr', 'ssg'].includes(rendering))
  )
    throw new Error('Choose client rendering for Vite or ssr/ssg for Nuxt.')
  return Object.freeze({
    schemaVersion: 1,
    name,
    target,
    framework,
    authoring,
    web: target === 'mobile' ? null : web,
    rendering: target === 'mobile' ? null : rendering,
    theme,
    versions,
  })
}
