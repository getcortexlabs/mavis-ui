export type LinkTarget = '_self' | '_blank'
export type LinkNavigate = (href: string) => void | Promise<unknown>
export interface NavigationOptions {
  href?: string
  navigate?: LinkNavigate
  target?: LinkTarget
  rel?: string
}

/** Navigation belongs to the host; the shared contract only validates its destination. */
export function linkDestination(href: string): string {
  const value = href.trim()
  if (!value || /[\u0000-\u001f\u007f]/.test(value))
    throw new TypeError('MLink requires a nonempty destination without control characters.')
  if (/^(?:javascript|data|vbscript):/i.test(value))
    throw new TypeError('MLink does not accept executable destinations.')
  return value
}

export function linkRel(target: LinkTarget, rel = ''): string | undefined {
  const tokens = new Set(rel.split(/\s+/).filter(Boolean))
  if (target === '_blank') {
    tokens.delete('opener')
    tokens.add('noopener')
    tokens.add('noreferrer')
  }
  return [...tokens].join(' ') || undefined
}
