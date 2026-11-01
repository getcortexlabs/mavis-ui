export function checkEmptyStateTitle(title: string) {
  if (typeof title !== 'string' || !title.trim())
    throw new TypeError('EmptyState needs a non-empty title.')
}
