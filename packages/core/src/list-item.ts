/** Slot content needs an explicit label when it adds meaning to an interactive row. */
export function listItemLabel(title: string, description: string, label?: string): string {
  if (!title?.trim()) throw new RangeError('ListItem requires a non-empty title.')
  return label?.trim() || [title.trim(), description.trim()].filter(Boolean).join('. ')
}
