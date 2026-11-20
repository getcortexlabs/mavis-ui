import { defineComponent, h, inject } from 'vue'
import { routerKey } from 'vue-router'

function component(name: string, tag: string) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.())
    },
  })
}
function action(name: string, tag: string) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const router = inject(routerKey, null)
      return () =>
        h(
          tag,
          {
            ...attrs,
            onClick: () => {
              if (attrs.disabled || attrs.loading) return
              const listeners = Array.isArray(attrs.onClick) ? attrs.onClick : [attrs.onClick]
              for (const listener of listeners) if (typeof listener === 'function') listener()
              if (typeof attrs.href === 'string') void router?.push(attrs.href)
            },
          },
          slots.default?.(),
        )
    },
  })
}
export const MScreen = component('MScreen', 'screen')
export const MColumn = component('MColumn', 'column')
export const MRow = component('MRow', 'row')
export const MGrid = component('MGrid', 'grid')
export const MText = component('MText', 'text')
export const MInput = component('MInput', 'input')
export const MReveal = component('MReveal', 'reveal')
export const MButton = action('MButton', 'button')
export const MLink = action('MLink', 'link')
export const MCard = action('MCard', 'card')
function message(name: string) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_props, { attrs }) {
      return () =>
        h('column', { id: attrs.id, padding: 'md', gap: 'sm' }, [
          h('text', { variant: 'heading', tone: attrs.tone }, String(attrs.title ?? '')),
          h('text', { tone: 'muted' }, String(attrs.description ?? '')),
        ])
    },
  })
}
export const MAlert = message('MAlert')
export const MEmptyState = message('MEmptyState')
