// The layout relations a fixture step can assert between elements addressed by their id:
//
//   { "layout": [
//     { "of": "save", "in": "bar", "x": "end", "y": "center", "inset": 16 },
//     { "of": "box", "width": 120, "height": 48 },
//     { "order": ["a", "b", "c"], "axis": "x" },
//     { "equal": ["a", "b"], "size": "width" },
//     { "gap": ["a", "b"], "axis": "x", "is": 16 },
//     { "sameRow": ["a", "b"] },
//     { "nextRow": ["a", "c"] }
//   ] }
//
// x and y place an element in its container: start, center, end or fill; inset is the
// container's padding on that side (a number, or { x, y }). Relations are relative and
// tolerant, so they hold across renderers and fonts. The Web runner and the NativeScript probe
// run this file; the Mac harness in scripts/check-portable-conformance.mjs ports it to Swift.
export type Rect = { x: number; y: number; width: number; height: number }
export type Relation = Record<string, unknown>
type Axis = 'x' | 'y'

/** Renderers round to device pixels differently. */
export const tolerance = 1.5

const near = (a: number, b: number) => Math.abs(a - b) <= tolerance
const span = (axis: Axis) => (axis === 'x' ? 'width' : 'height')
const start = (rect: Rect, axis: Axis) => rect[axis]
const end = (rect: Rect, axis: Axis) => rect[axis] + rect[span(axis)]
const middle = (rect: Rect, axis: Axis) => rect[axis] + rect[span(axis)] / 2
const round = (value: number) => Math.round(value * 100) / 100

/** Every id a relation names. */
export function layoutIds(relation: Relation): string[] {
  const lists = ['order', 'equal', 'gap', 'sameRow', 'nextRow'].flatMap(
    (key) => (relation[key] as string[] | undefined) ?? [],
  )
  return [...new Set([relation.of, relation.in, ...lists].filter(Boolean) as string[])]
}

/** What does not hold, in words; empty when every relation does. */
export function layoutFailures(
  relations: Relation[],
  frame: (id: string) => Rect | undefined,
): string[] {
  const failures: string[] = []
  for (const relation of relations) {
    const fail = (detail: string) => failures.push(`${JSON.stringify(relation)}: ${detail}`)
    const missing = layoutIds(relation).filter((id) => !frame(id))
    if (missing.length) {
      fail(`no element with id ${missing.join(', ')}`)
      continue
    }
    const rect = (id: unknown) => frame(id as string)!
    const axis = (relation.axis ?? 'x') as Axis
    if (relation.of && relation.in) {
      const inner = rect(relation.of)
      const outer = rect(relation.in)
      const inset = relation.inset as number | { x?: number; y?: number } | undefined
      for (const side of ['x', 'y'] as const) {
        const edge = relation[side]
        if (!edge) continue
        const pad = typeof inset === 'number' ? inset : (inset?.[side] ?? 0)
        const atStart = near(start(inner, side), start(outer, side) + pad)
        const atEnd = near(end(inner, side), end(outer, side) - pad)
        const held =
          edge === 'start'
            ? atStart
            : edge === 'end'
              ? atEnd
              : edge === 'fill'
                ? atStart && atEnd
                : near(middle(inner, side), middle(outer, side))
        if (!held)
          fail(
            `${side} ${edge}: ${round(start(inner, side))}..${round(end(inner, side))} in ${round(start(outer, side))}..${round(end(outer, side))}`,
          )
      }
    }
    if (relation.of)
      for (const size of ['width', 'height'] as const)
        if (
          relation[size] !== undefined &&
          !near(rect(relation.of)[size], relation[size] as number)
        )
          fail(`${size} is ${round(rect(relation.of)[size])}`)
    if (relation.order) {
      const rects = (relation.order as string[]).map(rect)
      rects.slice(1).forEach((next, index) => {
        if (end(rects[index]!, axis) > start(next, axis) + tolerance)
          fail(`item ${index + 1} starts at ${round(start(next, axis))}, before the previous end`)
      })
    }
    if (relation.equal) {
      const [first, ...others] = (relation.equal as string[]).map(rect)
      const sizes = relation.size === 'both' ? (['width', 'height'] as const) : [relation.size]
      for (const size of sizes as ('width' | 'height')[])
        if (others.some((other) => !near(other[size], first![size])))
          fail(`${size}s are ${[first!, ...others].map((item) => round(item[size])).join(', ')}`)
    }
    if (relation.gap) {
      const [before, after] = (relation.gap as string[]).map(rect)
      const actual = start(after!, axis) - end(before!, axis)
      if (!near(actual, relation.is as number)) fail(`gap is ${round(actual)}`)
    }
    if (relation.sameRow) {
      const rects = (relation.sameRow as string[]).map(rect)
      const overlap = (a: Rect, b: Rect) =>
        a.y < end(b, 'y') - tolerance && b.y < end(a, 'y') - tolerance
      if (rects.some((a) => rects.some((b) => !overlap(a, b))))
        fail(
          `rows are ${rects.map((item) => `${round(item.y)}..${round(end(item, 'y'))}`).join(', ')}`,
        )
    }
    if (relation.nextRow) {
      const [above, below] = (relation.nextRow as string[]).map(rect)
      if (below!.y < end(above!, 'y') - tolerance)
        fail(
          `second starts at ${round(below!.y)}, above the first's end ${round(end(above!, 'y'))}`,
        )
    }
  }
  return failures
}
