import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
  watch,
  useId,
  type Component,
} from '@vue/runtime-core'
import { choiceKey, type ChoiceValue } from '../choice.js'
import { treeBranch, treeEntries, type TreeNode } from '../discovery.js'
import { treeViewProps } from './discovery-props.js'
import { useMavisTheme } from './theme.js'

export function createTreeView(
  ui: {
    Column: Component
    Row: Component
    Text: Component
    Button: Component
    Reveal: Component
    Icon: Component
    focus?: (id: string) => void
    containsFocus?: (id: string) => boolean
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MTreeView',
    inheritAttrs: false,
    props: treeViewProps,
    emits: {
      'update:modelValue': (_key: ChoiceValue) => true,
      'update:expanded': (_keys: ChoiceValue[]) => true,
      load: (_node: TreeNode) => true,
    },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme()
      const treeId = `m-tree-${useId()}`
      const entries = computed(() => treeEntries(props.nodes, props.expanded))
      const focused = ref<ChoiceValue | null>(props.modelValue)
      const idFor = (key: ChoiceValue) => `${treeId}-${encodeURIComponent(choiceKey(key))}`
      function isOpen(key: ChoiceValue) {
        return props.expanded.includes(key)
      }
      function select(node: TreeNode) {
        if (!props.disabled && !node.disabled) emit('update:modelValue', node.key)
      }
      function toggle(node: TreeNode, open = !isOpen(node.key)) {
        if (
          props.disabled ||
          node.disabled ||
          !treeBranch(node) ||
          props.loadingKeys.includes(node.key)
        )
          return
        if (open === isOpen(node.key)) return
        emit(
          'update:expanded',
          open ? [...props.expanded, node.key] : props.expanded.filter((key) => key !== node.key),
        )
        if (open && node.children === undefined) emit('load', node)
      }
      function focus(key: ChoiceValue) {
        focused.value = key
        void nextTick(() => ui.focus?.(idFor(key)))
      }
      watch(
        entries,
        (visible, previous) => {
          if (visible.some((entry) => entry.node.key === focused.value)) return
          const restore = focused.value !== null && ui.containsFocus?.(idFor(focused.value))
          // Prefer the collapsed ancestor; never reset a retained logical node by array index.
          let parent = previous?.find((entry) => entry.node.key === focused.value)?.parent
          while (parent != null && !visible.some((entry) => entry.node.key === parent))
            parent = previous?.find((entry) => entry.node.key === parent)?.parent
          focused.value = parent ?? visible.find((entry) => !entry.node.disabled)?.node.key ?? null
          if (restore && focused.value !== null) focus(focused.value)
        },
        { immediate: true },
      )
      function keydown(event: KeyboardEvent, node: TreeNode) {
        if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing || props.disabled)
          return
        const visible = entries.value.filter((entry) => !entry.node.disabled)
        const index = visible.findIndex((entry) => entry.node.key === node.key)
        let next: ChoiceValue | undefined
        if (event.key === 'ArrowDown')
          next = visible[Math.min(visible.length - 1, index + 1)]?.node.key
        else if (event.key === 'ArrowUp') next = visible[Math.max(0, index - 1)]?.node.key
        else if (event.key === 'Home') next = visible[0]?.node.key
        else if (event.key === 'End') next = visible.at(-1)?.node.key
        else if (event.key === 'ArrowRight') {
          if (!isOpen(node.key)) toggle(node, true)
          else next = node.children?.find((child) => !child.disabled)?.key
        } else if (event.key === 'ArrowLeft') {
          if (isOpen(node.key)) toggle(node, false)
          else
            next = entries.value.find((entry) => entry.node.key === node.key)?.parent ?? undefined
        } else if (event.key === 'Enter' || event.key === ' ') select(node)
        else if (event.key.length === 1) {
          const order = [...visible.slice(index + 1), ...visible.slice(0, index + 1)]
          next = order.find((entry) =>
            entry.node.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()),
          )?.node.key
        } else return
        event.preventDefault()
        if (next !== undefined) focus(next)
      }
      function render(nodes: readonly TreeNode[], level = 1): ReturnType<typeof h>[] {
        return nodes.map((node, index) => {
          const branch = treeBranch(node),
            open = isOpen(node.key),
            selected = props.modelValue === node.key
          const busy = props.loadingKeys.includes(node.key)
          const unavailable = props.disabled || node.disabled
          return h(ui.Column, { key: choiceKey(node.key), gap: 'none' }, () => [
            h(
              ui.Row,
              {
                id: idFor(node.key),
                gap: 'xs',
                padding: 'xs',
                radius: 'md',
                backgroundColor: selected ? theme.value.colors.primarySoft : 'transparent',
                ...(platform === 'web'
                  ? {
                      role: 'treeitem',
                      tabindex: !unavailable && focused.value === node.key ? 0 : -1,
                      'aria-level': level,
                      'aria-posinset': index + 1,
                      'aria-setsize': nodes.length,
                      'aria-selected': selected,
                      'aria-expanded': branch ? open : undefined,
                      'aria-disabled': unavailable || undefined,
                      'aria-busy': busy || undefined,
                      'aria-label': node.label,
                      onFocus: () => {
                        focused.value = node.key
                      },
                      onKeydown: (event: KeyboardEvent) => keydown(event, node),
                    }
                  : {}),
              },
              () => [
                branch
                  ? h(ui.Button, {
                      icon: open ? 'chevron-down' : 'chevron-right',
                      variant: 'ghost',
                      accessibilityLabel: `${node.label}: ${open ? props.expandedLabel : props.collapsedLabel}`,
                      disabled: unavailable || busy,
                      ...(platform === 'web' ? { tabindex: -1 } : {}),
                      onClick: () => toggle(node),
                    })
                  : h(ui.Icon, { name: 'file', tone: 'muted', size: 18, style: { margin: 12 } }),
                h(ui.Button, {
                  text: node.label,
                  style:
                    platform === 'web'
                      ? { justifyContent: 'flex-start', textAlign: 'start' }
                      : { textAlignment: 'left' },
                  variant: 'ghost',
                  grow: platform === 'web' ? 1 : 0,
                  shrink: 1,
                  disabled: unavailable,
                  ...(platform === 'web'
                    ? { tabindex: -1 }
                    : { accessibilityValue: selected ? 'Selected' : '' }),
                  onClick: () => select(node),
                }),
                busy
                  ? h(ui.Text, { text: props.loadingLabel, variant: 'caption', tone: 'muted' })
                  : null,
              ],
            ),
            branch
              ? h(
                  ui.Reveal,
                  {
                    show: open,
                    style:
                      platform === 'web'
                        ? { paddingInlineStart: `${theme.value.space.lg}px` }
                        : { paddingLeft: theme.value.space.lg },
                  },
                  () => render(node.children ?? [], level + 1),
                )
              : null,
          ])
        })
      }
      return () => {
        void entries.value
        return h(
          ui.Column,
          mergeProps(
            { id: props.id, gap: 'sm' },
            attrs,
            platform === 'web' ? { class: 'm-tree-view' } : {},
          ),
          () => [
            h(ui.Text, { as: 'h2', variant: 'heading', text: props.label }),
            props.nodes.length
              ? h(
                  ui.Column,
                  {
                    gap: 'xs',
                    ...(platform === 'web' ? { role: 'tree', 'aria-label': props.label } : {}),
                  },
                  () => render(props.nodes),
                )
              : h(ui.Text, { text: props.emptyLabel, tone: 'muted' }),
          ],
        )
      }
    },
  })
}
