export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** The same geometry checks run against real browser and native view measurements. */
export function checkLayout(views: Record<string, Bounds>): string[] {
  const failures: string[] = []
  const near = (actual: number, expected: number, label: string) => {
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1.01) {
      failures.push(`${label}: expected ${expected}, got ${actual}`)
    }
  }
  const bounds = (id: string) => {
    const value = views[id]
    if (!value || value.width <= 0 || value.height <= 0) {
      throw new Error(`Missing layout for ${id}`)
    }
    return value
  }
  const inside = (parent: Bounds, child: Bounds, label: string) => {
    if (
      child.x < parent.x - 1 ||
      child.x + child.width > parent.x + parent.width + 1 ||
      child.y < parent.y - 1 ||
      child.y + child.height > parent.y + parent.height + 1
    ) {
      failures.push(`${label} extends outside its parent`)
    }
  }

  for (const group of ['percent', 'grow']) {
    const row = bounds(`${group}-row`)
    const first = bounds(`${group}-0`)
    const second = bounds(`${group}-1`)
    near(first.width, second.width, `${group} equal widths`)
    near(second.x - first.x - first.width, 14, `${group} gap`)
    near(first.width + second.width + 14, row.width, `${group} fills row`)
    inside(row, first, `${group} first card`)
    inside(row, second, `${group} second card`)
    for (let i = 0; i < 2; i++) {
      inside(bounds(`${group}-${i}`), bounds(`${group}-body-${i}`), `${group} text ${i}`)
    }
  }
  near(bounds('grow-row').height, bounds('percent-row').height, 'content height after growth')

  const wrap = bounds('wrap-row')
  for (let i = 1; i <= 3; i++) inside(wrap, bounds(`wrap-${i}`), `wrapped card ${i}`)
  const first = bounds('wrap-1')
  const last = bounds('wrap-3')
  if (wrap.width < 378) near(last.y - first.y - first.height, 9, 'wrapped row gap')
  else near(last.y, first.y, 'wide row stays on one line')

  near(bounds('ratio-2').width, bounds('ratio-1').width * 2, '1:2 growth')
  near(bounds('fixed').width, 48, 'shrink=0')
  inside(bounds('shrink-row'), bounds('long-text'), 'long localized text')
  const rtlFirst = bounds('rtl-first')
  const rtlSecond = bounds('rtl-second')
  near(rtlFirst.x - rtlSecond.x - rtlSecond.width, 13, 'RTL order and gap')

  const card = bounds('dynamic-card')
  const toggle = bounds('details-toggle')
  const lastChild = views.details ?? toggle
  near(card.y + card.height - lastChild.y - lastChild.height, 17, 'card bottom padding')
  if (views.details) {
    near(views.details.y - toggle.y - toggle.height, 16, 'Reveal gap')
    inside(card, views.details, 'revealed details')
  }
  return failures
}
