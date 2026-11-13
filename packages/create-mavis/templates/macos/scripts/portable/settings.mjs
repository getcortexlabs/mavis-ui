export function macAppSettings(input = {}, name = 'Mavis') {
  const settings = {
    name: input.name ?? name,
    bundleId:
      input.bundleId ?? `com.mavis.${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app'}`,
    minWidth: input.minWidth ?? 640,
    minHeight: input.minHeight ?? 480,
    ...(input.icon ? { icon: input.icon } : {}),
  }
  if (
    typeof settings.name !== 'string' ||
    !settings.name.trim() ||
    /[\x00-\x1f/\\]/.test(settings.name)
  )
    throw new Error('macos.name must be a non-empty app name without path separators.')
  if (
    typeof settings.bundleId !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+$/.test(settings.bundleId)
  )
    throw new Error(
      'macos.bundleId must be a reverse-domain identifier, such as com.example.studio.',
    )
  for (const key of ['minWidth', 'minHeight'])
    if (!Number.isInteger(settings[key]) || settings[key] < 240 || settings[key] > 16384)
      throw new Error(`macos.${key} must be an integer between 240 and 16384.`)
  if (settings.icon && (typeof settings.icon !== 'string' || !settings.icon.endsWith('.icns')))
    throw new Error('macos.icon must name an existing project-relative .icns file.')
  if (input.urlSchemes !== undefined) {
    if (
      !Array.isArray(input.urlSchemes) ||
      input.urlSchemes.length > 16 ||
      input.urlSchemes.some(
        (scheme) =>
          typeof scheme !== 'string' ||
          !/^[A-Za-z][A-Za-z0-9+.-]*$/.test(scheme) ||
          ['http', 'https', 'file'].includes(scheme.toLowerCase()),
      )
    )
      throw new Error('macos.urlSchemes must be up to 16 custom URL schemes without : or /.')
    settings.urlSchemes = input.urlSchemes.map((scheme) => scheme.toLowerCase())
    if (new Set(settings.urlSchemes).size !== settings.urlSchemes.length)
      throw new Error('macos.urlSchemes must not repeat a scheme, including different letter case.')
  }
  return settings
}
