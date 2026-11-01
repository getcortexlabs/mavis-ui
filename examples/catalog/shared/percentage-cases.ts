import type { Dimension } from '@getcortexlabs/mavis-core'

interface PercentageCase {
  id: string
  container: string
  padding: number
  border: number
  width?: Dimension
  nested?: boolean
  align?: 'center' | 'end'
  style?: { width?: string; alignSelf?: string }
  expectedWidth?: Dimension
  skeleton?: boolean
}

export function percentageCases(expanded = false): PercentageCase[] {
  const cases: PercentageCase[] = ['MCard', 'MColumn', 'MRow', 'MBox'].flatMap((container) =>
    [0, 24].flatMap((padding) =>
      (['100%', '85%', 96, undefined] as const).map((width, index) => ({
        id: `padding-${container.slice(1).toLowerCase()}-${padding}-${index}`,
        container,
        padding,
        border: container === 'MCard' ? 1 : 0,
        width,
      })),
    ),
  )
  cases.push(
    ...(['100%', '85%'] as const).map((width, index) => ({
      id: `padding-nested-${index}`,
      container: 'MCard',
      padding: 24,
      border: 1,
      width,
      nested: true,
    })),
    {
      id: 'padding-start',
      container: 'MCard',
      padding: 24,
      border: 1,
      width: '100%',
      style: { alignSelf: 'flex-start' },
    },
    {
      id: 'padding-center',
      container: 'MColumn',
      padding: 24,
      border: 0,
      width: 96,
      align: 'center',
    },
    { id: 'padding-end', container: 'MColumn', padding: 24, border: 0, width: '85%', align: 'end' },
    ...['MCard', 'MBox'].map((container) => ({
      id: `padding-style-${container}`,
      container,
      padding: 24,
      border: container === 'MCard' ? 1 : 0,
      width: 96,
      style: { width: '85%' },
      expectedWidth: '85%' as const,
    })),
    ...(['100%', '85%'] as const).map((width, index) => ({
      id: `padding-skeleton-${index}`,
      container: 'MCard',
      padding: 24,
      border: 1,
      width,
      skeleton: true,
    })),
    {
      id: 'padding-dynamic',
      container: 'MCard',
      padding: expanded ? 12 : 24,
      border: 1,
      width: expanded ? '100%' : '85%',
    },
  )
  return cases
}
