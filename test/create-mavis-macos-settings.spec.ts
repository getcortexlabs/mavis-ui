import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
// @ts-expect-error The generated host scripts ship ESM.
import { macAppSettings } from '../packages/create-mavis/templates/macos/scripts/portable/settings.mjs'
// @ts-expect-error The generated host scripts ship ESM.
import { macAppManifest } from '../packages/create-mavis/templates/macos/scripts/macos-manifest.mjs'
// @ts-expect-error The creator ships ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'

describe('Mac custom URL delivery', () => {
  it('writes custom schemes into the same manifest as app identity and icon', () => {
    const settings = macAppSettings({
      name: 'Studio & Friends',
      bundleId: 'org.example.studio',
      urlSchemes: ['Studio', 'studio-preview'],
      icon: 'assets/App.icns',
    })
    expect(settings.urlSchemes).toEqual(['studio', 'studio-preview'])
    const manifest = macAppManifest(settings)
    expect(manifest).toContain('<string>Studio &amp; Friends</string>')
    expect(manifest).toContain('<key>CFBundleURLSchemes</key>')
    expect(manifest).toContain('<string>studio</string><string>studio-preview</string>')
    if (process.platform === 'darwin') {
      const plist = JSON.parse(
        execFileSync('plutil', ['-convert', 'json', '-o', '-', '-'], {
          input: manifest,
          encoding: 'utf8',
        }),
      )
      expect(plist.CFBundleName).toBe('Studio & Friends')
      expect(plist.CFBundleIdentifier).toBe('org.example.studio')
      expect(plist.CFBundleIconFile).toBe('AppIcon.icns')
      expect(plist.CFBundleURLTypes).toEqual([
        {
          CFBundleTypeRole: 'Editor',
          CFBundleURLName: 'org.example.studio',
          CFBundleURLSchemes: ['studio', 'studio-preview'],
        },
      ])
    }
  })
  it('keeps URL handling opt-in', () => {
    expect(macAppManifest(macAppSettings())).not.toContain('CFBundleURLTypes')
    expect(macAppManifest(macAppSettings({ urlSchemes: [] }))).not.toContain('CFBundleURLTypes')
  })
  it.each([
    'studio',
    null,
    [null],
    [''],
    ['1studio'],
    ['studio:'],
    ['studio/path'],
    ['https'],
    ['file'],
    Array(17).fill('x'),
  ])('rejects malformed or non-custom schemes %j', (urlSchemes) =>
    expect(() => macAppSettings({ urlSchemes })).toThrow('macos.urlSchemes'),
  )
  it('rejects duplicate schemes case-insensitively', () => {
    expect(() => macAppSettings({ urlSchemes: ['studio', 'STUDIO'] })).toThrow('must not repeat')
  })
  it('ships the same manifest writer in new Mac projects and omits it without Mac', async () => {
    const mac = await projectFiles({ name: 'studio', targets: 'web,macos' })
    expect(mac.files.get('scripts/macos.mjs')).toContain("from './macos-manifest.mjs'")
    expect(mac.files.get('scripts/macos-manifest.mjs')).toContain('CFBundleURLTypes')
    const web = await projectFiles({ name: 'studio', targets: 'web', authoring: 'vue' })
    expect(web.files.has('scripts/macos-manifest.mjs')).toBe(false)
  })
})
