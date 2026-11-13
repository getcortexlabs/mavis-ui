const xml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// Kept beside the launcher so both a new project and --add-macos package the
// same identity and custom URL handlers. The route table still resolves URLs.
export function macAppManifest(settings) {
  const schemes = settings.urlSchemes ?? []
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>MavisDesktop</string>
<key>CFBundleIdentifier</key><string>${xml(settings.bundleId)}</string>
<key>CFBundleName</key><string>${xml(settings.name)}</string>
${settings.icon ? '<key>CFBundleIconFile</key><string>AppIcon.icns</string>' : ''}
${
  schemes.length
    ? `<key>CFBundleURLTypes</key><array><dict>
<key>CFBundleTypeRole</key><string>Editor</string>
<key>CFBundleURLName</key><string>${xml(settings.bundleId)}</string>
<key>CFBundleURLSchemes</key><array>${schemes.map((scheme) => `<string>${xml(scheme)}</string>`).join('')}</array>
</dict></array>`
    : ''
}
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.0.0</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>`
}
