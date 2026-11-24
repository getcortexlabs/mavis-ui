export function plural(count: number, word: string): string {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`
}

export const padded = (value: number, width: number): string => String(value).padStart(width, '0')

export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('')
}

export function slug(name: string): string {
  return name.trim().toLowerCase().replaceAll(' ', '-')
}
