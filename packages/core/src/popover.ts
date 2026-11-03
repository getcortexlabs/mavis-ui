export type PopoverPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
export type PopoverCloseReason = 'trigger' | 'outside' | 'escape' | 'back' | 'select' | 'program'
export interface PopoverRect {
  x: number
  y: number
  width: number
  height: number
}

/** Coordinates share one CSS-pixel/DIP space. Flip vertically, then clamp to the viewport. */
export function placePopover(
  anchor: PopoverRect,
  panel: { width: number; height: number },
  viewport: PopoverRect,
  placement: PopoverPlacement,
  rtl = false,
  gap = 8,
  margin = 8,
) {
  const bottom = anchor.y + anchor.height + gap
  const top = anchor.y - gap - panel.height
  const lower = viewport.y + viewport.height - margin
  const upper = viewport.y + margin
  let above = placement.startsWith('top')
  if (above && top < upper && bottom + panel.height <= lower) above = false
  else if (!above && bottom + panel.height > lower && top >= upper) above = true
  const end = placement.endsWith('end') !== rtl
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)))
  return {
    x: clamp(
      end ? anchor.x + anchor.width - panel.width : anchor.x,
      viewport.x + margin,
      viewport.x + viewport.width - panel.width - margin,
    ),
    y: clamp(above ? top : bottom, upper, lower - panel.height),
  }
}
