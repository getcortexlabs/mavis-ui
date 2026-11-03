/** Equal-width grid columns; widths use CSS pixels on Web and DIPs on NativeScript. */
export function gridColumns(
  columns: number | undefined,
  minColumnWidth: number | undefined,
  gap: number,
  width?: number,
): number {
  if (columns !== undefined && (!Number.isSafeInteger(columns) || columns < 1))
    throw new RangeError('columns must be a positive integer.')
  if (minColumnWidth !== undefined && (!Number.isFinite(minColumnWidth) || minColumnWidth <= 0))
    throw new RangeError('minColumnWidth must be finite and positive.')
  if (!Number.isFinite(gap) || gap < 0)
    throw new RangeError('Grid gap must be finite and non-negative.')
  if (width !== undefined && (!Number.isFinite(width) || width < 0))
    throw new RangeError('Grid content width must be finite and non-negative.')
  if (minColumnWidth === undefined || width === undefined) return columns ?? 1
  const fit = Math.max(1, Math.floor((Math.max(0, width) + gap) / (minColumnWidth + gap)))
  return columns === undefined ? fit : Math.min(columns, fit)
}
