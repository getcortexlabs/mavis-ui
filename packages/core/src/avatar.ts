export const avatarSizes = { sm: 32, md: 48, lg: 64, xl: 96 } as const
export type AvatarSize = keyof typeof avatarSizes

/** First and last words, normalized before extracting Unicode code points. */
export function avatarInitials(name: string): string {
  const words = name.trim().normalize('NFC').split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  const first = Array.from(words[0]!)[0]!
  const last = words.length > 1 ? Array.from(words.at(-1)!)[0]! : ''
  return (first + last).toUpperCase()
}
