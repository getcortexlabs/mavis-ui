import type { MavisTheme, Spacing } from './types.js'

export function resolveSpace(theme: MavisTheme, value: Spacing): number {
  const resolved = typeof value === 'number' ? value : theme.space[value]
  if (!Number.isFinite(resolved) || resolved < 0) {
    throw new RangeError(`Unknown or invalid spacing: ${String(value)}`)
  }
  return resolved
}
