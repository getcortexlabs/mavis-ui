import { defineComponent, inject, provide, watchEffect } from '@vue/runtime-core'
import { Comment, Fragment, isVNode, type VNode, type VNodeChild } from '@vue/runtime-core'

/** Adornments are decorative. Put any meaning in the button label, never another action. */
export function buttonContent(content: VNodeChild[] | undefined): VNodeChild[] {
  const visit = (node: VNodeChild): void => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!isVNode(node) || node.type === Comment) return
    const name =
      typeof node.type === 'string'
        ? node.type
        : typeof node.type === 'object'
          ? 'name' in node.type
            ? String(node.type.name)
            : ''
          : ''
    const props = node.props ?? {}
    if (
      /^(button|input|textarea|select|a|Button|TextField|TextView|Switch|Slider|WebView|MButton|MInput|MSwitch|MCheckbox|MRadioGroup|MSelect|MSlider|MTabs|MChip|MAccordion|MSegmentedControl|MSheet|MDialog|MToast)$/i.test(
        name,
      ) ||
      props.interactive ||
      props.contenteditable ||
      props.contentEditable ||
      props.tabindex !== undefined ||
      props.tabIndex !== undefined ||
      Object.keys(props).some((key) => /^on(Click|Tap|Touch|Pointer|Key|Focus|LongPress)/.test(key))
    ) {
      throw new TypeError(
        'Button leading/trailing content must be decorative, without nested controls or interaction handlers.',
      )
    }
    if (Array.isArray(node.children)) node.children.forEach((child) => visit(child as VNode))
    else if (node.type === Fragment && node.children) visit(node.children as VNodeChild)
  }
  content?.forEach(visit)
  return content ?? []
}

const decorationKey = Symbol('mavis.buttonDecoration')

/** @internal Also guards Mavis controls rendered inside custom decorative components. */
export const ButtonAdornment = defineComponent({
  setup(_props, { slots }) {
    provide(decorationKey, true)
    return () => slots.default?.()
  },
})

/** @internal Stateful controls cannot become descendants of a decorative button slot. */
export function useButtonAction(interactive: () => boolean = () => true) {
  if (!inject(decorationKey, false)) return
  watchEffect(() => {
    if (interactive())
      throw new TypeError('Button adornments cannot contain interactive Mavis components.')
  })
}
