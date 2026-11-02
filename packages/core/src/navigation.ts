import { validateChoices, type ChoiceOption, type ChoiceValue } from './choice.js'

export interface StepOption extends ChoiceOption {
  status?: 'pending' | 'complete' | 'error'
}
export function validateSteps(steps: readonly StepOption[], current: ChoiceValue | null) {
  validateChoices(steps, current)
  if (!steps.length) throw new RangeError('Steps require at least one item.')
  if (current !== null && !steps.some((step) => step.value === current))
    throw new RangeError('The current step must exist in steps.')
  for (const step of steps)
    if (step.status && !['pending', 'complete', 'error'].includes(step.status))
      throw new RangeError(`Unknown step status: ${step.status}`)
}

export type PaginationItem = { kind: 'page'; page: number } | { kind: 'gap'; key: string }
export function pageCount(total: number, pageSize: number) {
  if (!Number.isSafeInteger(total) || total < 0)
    throw new RangeError('total must be a non-negative safe integer.')
  if (!Number.isSafeInteger(pageSize) || pageSize < 1)
    throw new RangeError('pageSize must be a positive safe integer.')
  return Math.ceil(total / pageSize)
}
/** 1-based pages. Empty results retain page 1 without inventing a result page. */
export function pagination(total: number, pageSize: number, page: number, siblingCount = 1) {
  const count = pageCount(total, pageSize)
  if (!Number.isSafeInteger(page) || page < 1)
    throw new RangeError('page must be a positive safe integer.')
  if (!Number.isInteger(siblingCount) || siblingCount < 0 || siblingCount > 2)
    throw new RangeError('siblingCount must be 0, 1 or 2.')
  // A changed total can temporarily make the parent's page stale. Report it without mutation.
  const outOfRange = page > Math.max(1, count)
  const pages = new Set<number>()
  if (count > 0) {
    pages.add(1)
    pages.add(count)
  }
  const anchor = Math.min(page, count)
  for (
    let value = Math.max(1, anchor - siblingCount);
    value <= Math.min(count, anchor + siblingCount);
    value++
  )
    pages.add(value)
  const items: PaginationItem[] = []
  let previous = 0
  for (const value of [...pages].sort((a, b) => a - b)) {
    if (previous && value - previous === 2) items.push({ kind: 'page', page: previous + 1 })
    else if (previous && value - previous > 2)
      items.push({ kind: 'gap', key: `${previous}-${value}` })
    items.push({ kind: 'page', page: value })
    previous = value
  }
  return {
    count,
    items,
    outOfRange,
    previous: count > 0 && page > 1 ? Math.min(page - 1, count) : null,
    next: page < count ? page + 1 : null,
  }
}
