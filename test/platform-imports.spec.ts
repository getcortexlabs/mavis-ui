import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../packages/nativescript/src')

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? sources(path) : path.endsWith('.ts') ? [path] : []
  })
}

const files = sources(root)
const platformModules = new Set(
  files
    .filter((file) => /\.(ios|android)\.ts$/.test(file))
    .map((file) => file.replace(/\.(ios|android)\.ts$/, '')),
)

const imports = files.flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)].map((match) => ({
    file: relative(root, file),
    specifier: match[1]!,
    target: resolve(dirname(file), match[1]!.replace(/\.js$/, '')),
  })),
)
const boundaries = imports.filter(({ target }) => platformModules.has(target))

describe('platform-split native modules', () => {
  it('are imported by the Vue components', () => {
    expect(boundaries.length).toBeGreaterThan(0)
  })

  it('keep a shared fallback next to the platform files', () => {
    for (const { target } of boundaries) expect(existsSync(`${target}.ts`), target).toBe(true)
  })

  it('are imported without an extension so webpack and Vite pick the platform file', () => {
    const offenders = boundaries
      .filter(({ specifier }) => /\.[cm]?[jt]s$/.test(specifier))
      .map(({ file, specifier }) => `${file}: ${specifier}`)
    expect(offenders).toEqual([])
  })
})
