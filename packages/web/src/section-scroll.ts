import type { WebMotionScope } from '@rafaelaugusto/jolt/web'
import {
  sectionScrollRange,
  type MotionScrollFrames,
  type SectionScrollOptions,
} from '@getcortexlabs/mavis-core/experimental'

export function webSectionScroll(
  owner: Pick<WebMotionScope, 'scrollLinked'>,
  source: HTMLElement,
  section: HTMLElement,
  target: HTMLElement,
  frames: MotionScrollFrames,
  options: SectionScrollOptions,
) {
  if (!source.contains(section))
    throw new TypeError('The section must belong to the scrolling MScreen.')
  const view = source.ownerDocument.defaultView!
  let link: ReturnType<WebMotionScope['scrollLinked']> | undefined
  let previous = '',
    disposed = false
  const observed = new Set<Element>()
  const refresh = () => {
    if (disposed || !section.isConnected) return
    const bounds = section.getBoundingClientRect(),
      container = source.getBoundingClientRect()
    const measured = sectionScrollRange(
      bounds.top - container.top - source.clientTop + source.scrollTop,
      bounds.height,
      source.clientHeight,
      Math.max(0, source.scrollHeight - source.clientHeight),
      options,
    )
    const key = `${measured.range}:${measured.settled}`
    if (key === previous) {
      link?.refresh()
      return
    }
    const values = measured.settled
      ? Object.fromEntries(
          Object.entries(frames).map(([property, values]) => [
            property,
            [values.at(-1)!, values.at(-1)!],
          ]),
        )
      : frames
    link?.dispose()
    link = owner.scrollLinked(source, target, values, { range: measured.range })
    previous = key
  }
  const resize = new view.ResizeObserver(refresh)
  const observe = () => {
    const wanted = new Set<Element>([source, ...source.children])
    for (
      let node: Element | null = section;
      node && source.contains(node);
      node = node.parentElement
    ) {
      wanted.add(node)
      for (const sibling of node.parentElement?.children ?? []) wanted.add(sibling)
    }
    for (const node of observed)
      if (!wanted.has(node)) {
        resize.unobserve(node)
        observed.delete(node)
      }
    for (const node of wanted)
      if (!observed.has(node)) {
        resize.observe(node)
        observed.add(node)
      }
    refresh()
  }
  const mutations = new view.MutationObserver(observe)
  const dispose = () => {
    if (disposed) return
    disposed = true
    resize.disconnect()
    mutations.disconnect()
    observed.clear()
    view.removeEventListener('resize', refresh)
    source.ownerDocument.fonts?.removeEventListener('loadingdone', refresh)
    link?.dispose()
  }
  try {
    observe()
    mutations.observe(source, { childList: true, characterData: true, subtree: true })
    view.addEventListener('resize', refresh)
    source.ownerDocument.fonts?.addEventListener('loadingdone', refresh)
  } catch (error) {
    dispose()
    throw error
  }
  return {
    get execution() {
      return disposed ? ('released' as const) : (link?.execution ?? ('released' as const))
    },
    refresh,
    dispose,
  }
}
