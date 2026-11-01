import { Comment, Fragment, Text, defineComponent, type VNode } from '@vue/runtime-core'
import type { FontWeight, Palette } from '../theme/types.js'
import { validateWeight } from '../theme/typography.js'
import { spanProps } from './props.js'

export interface TextRun {
  text: string
  weight?: FontWeight
  tone?: keyof Palette
  strong?: boolean
  italic?: boolean
}

/** A declarative text run, consumed by MText before native/DOM views are created. */
export const MSpan = defineComponent({
  name: 'MSpan',
  inheritAttrs: false,
  props: spanProps,
  setup(): () => null {
    throw new TypeError('MSpan must be inside MText or another MSpan')
  },
})

export function inlineContent(
  nodes: VNode[] = [],
  inherited: Omit<TextRun, 'text'> = {},
): TextRun[] {
  const runs: TextRun[] = []
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    if (typeof node === 'string' || typeof node === 'number') {
      runs.push({ ...inherited, text: String(node) })
      continue
    }
    if (!node || typeof node === 'boolean') continue
    if (node.type === Comment) continue
    if (node.type === Text) {
      runs.push({ ...inherited, text: String(node.children ?? '') })
    } else if (node.type === Fragment) {
      runs.push(...inlineContent(node.children as VNode[], inherited))
    } else if (node.type === MSpan) {
      const props = node.props ?? {}
      for (const key of Object.keys(props)) {
        if (!['text', 'weight', 'tone', 'emphasis', 'key'].includes(key)) {
          throw new TypeError(`MSpan does not accept ${key}; use text, weight, tone or emphasis`)
        }
      }
      if (props.emphasis !== undefined && !['strong', 'em'].includes(props.emphasis))
        throw new RangeError('Unknown text emphasis')
      const next = { ...inherited }
      if (props.emphasis === 'strong') {
        next.strong = true
        next.weight = 'bold'
      }
      if (props.emphasis === 'em') next.italic = true
      if (props.weight !== undefined) next.weight = validateWeight(props.weight)
      if (props.tone !== undefined) next.tone = props.tone
      const children = node.children as { default?: () => VNode[] } | VNode[] | null
      if (props.text !== undefined) runs.push({ ...next, text: String(props.text) })
      else if (typeof node.children === 'string') runs.push({ ...next, text: node.children })
      else
        runs.push(
          ...inlineContent(Array.isArray(children) ? children : children?.default?.(), next),
        )
    } else {
      throw new TypeError(
        'MText accepts text and MSpan. Use a layout for views; links have a separate navigation contract.',
      )
    }
  }
  return runs
}
