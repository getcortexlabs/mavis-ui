import { mavis, type MavisTheme } from '@getcortexlabs/mavis-core'

/** An application or an explicitly isolated theme scope. No process-wide mutable theme. */
export class MavisThemeScope {
  private listeners = new Set<() => void>()
  constructor(private current: MavisTheme = mavis) {}
  get theme() {
    return this.current
  }
  setTheme(theme: MavisTheme) {
    if (theme === this.current) return
    this.current = theme
    for (const listener of [...this.listeners]) listener()
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export function createMavisTheme(theme: MavisTheme = mavis) {
  return new MavisThemeScope(theme)
}
