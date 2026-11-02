import { fontFamily } from '@getcortexlabs/mavis-core'
import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  useId,
  watch,
  type SlotsType,
} from 'vue'
import {
  useButtonAction,
  accordionProps,
  accordionEmits,
  useMavisTheme,
} from '@getcortexlabs/mavis-core/vue'
import {
  choiceKey,
  validateAccordion,
  toggleAccordion,
  accordionFocusTarget,
  type AccordionItem,
  type AccordionPanelProps,
} from '@getcortexlabs/mavis-core'
import { MColumn } from './layout.js'
import { MIcon } from './MIcon.js'
import { MReveal } from './MReveal.js'
import { MSeparator } from './MSeparator.js'

export const MAccordion = defineComponent({
  name: 'MAccordion',
  inheritAttrs: false,
  props: accordionProps,
  emits: accordionEmits,
  slots: Object as SlotsType<{ default: AccordionPanelProps }>,
  setup(props, { attrs, emit, slots }) {
    useButtonAction()
    const { theme } = useMavisTheme()
    const generated = `m-accordion-${useId()}`
    const headers = new Map<string, HTMLButtonElement>()
    const panels = new Map<string, HTMLElement>()
    let alive = true
    onBeforeUnmount(() => {
      alive = false
      headers.clear()
      panels.clear()
    })
    watch(
      () => [props.items, props.modelValue, props.disabled],
      () => {
        if (typeof document === 'undefined') return
        const focused = document.activeElement
        if (!focused) return
        const panel = [...panels].find(([, element]) => element.contains(focused))
        const header = [...headers].find(([, element]) => element === focused)
        const key = panel?.[0] ?? header?.[0]
        if (!key) return
        const item = props.items.find((item) => choiceKey(item.value) === key)
        if (panel && item && props.modelValue.includes(item.value)) return
        if (header && item && !item.disabled && !props.disabled) return
        void nextTick(() => {
          if (!alive || props.disabled) return
          const target =
            (item && !item.disabled ? item : undefined) ??
            props.items.find((item) => !item.disabled)
          if (target) headers.get(choiceKey(target.value))?.focus({ preventScroll: true })
        })
      },
      { deep: true, flush: 'pre' },
    )
    function keydown(event: KeyboardEvent, item: AccordionItem) {
      if (props.disabled || item.disabled || event.altKey || event.ctrlKey || event.metaKey) return
      const next = accordionFocusTarget(props.items, item.value, event.key)
      if (!next) return
      event.preventDefault()
      headers.get(choiceKey(next.value))?.focus({ preventScroll: true })
    }
    return () => {
      validateAccordion(
        props.items,
        props.modelValue,
        props.multiple,
        props.label,
        props.expandedLabel,
        props.collapsedLabel,
      )
      const { colors, typography, space, radius } = theme.value
      const id = props.id ?? generated
      return h(
        MColumn,
        mergeProps(attrs, {
          id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          gap: 'sm',
          accessibilityHidden: props.accessibilityHidden,
          class: 'm-accordion',
          role: 'group',
          'aria-label': props.label,
          style: { '--m-focus': colors.primary },
        }),
        {
          default: () =>
            props.items.map((item) => {
              const key = choiceKey(item.value),
                expanded = props.modelValue.includes(item.value)
              const headerId = `${id}-${encodeURIComponent(key)}`,
                panelId = `${headerId}-panel`
              return h(
                MColumn,
                {
                  key,
                  radius: 'md',
                  backgroundColor: colors.surface,
                  class: 'm-accordion-item',
                  'data-expanded': expanded,
                  style: { border: `1px solid ${expanded ? colors.primarySoft : colors.border}` },
                },
                {
                  default: () => [
                    h('h3', { class: 'm-accordion-heading' }, [
                      h(
                        'button',
                        {
                          id: headerId,
                          type: 'button',
                          class: 'm-accordion-trigger',
                          ref: (element: unknown) => {
                            if (element) headers.set(key, element as HTMLButtonElement)
                            else headers.delete(key)
                          },
                          disabled: props.disabled || item.disabled,
                          'aria-label': item.title,
                          'aria-describedby': item.description
                            ? `${headerId}-description`
                            : undefined,
                          'aria-expanded': expanded,
                          'aria-controls': expanded ? panelId : undefined,
                          style: {
                            padding: `${space.md}px`,
                            gap: `${space.md}px`,
                            borderRadius: `${radius.md}px`,
                            color: colors.text,
                            fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
                            fontSize: `${typography.body.fontSize}px`,
                          },
                          onClick() {
                            const next = toggleAccordion(
                              item,
                              props.modelValue,
                              props.multiple,
                              props.disabled,
                            )
                            if (next) emit('update:modelValue', next)
                          },
                          onKeydown: (event: KeyboardEvent) => keydown(event, item),
                        },
                        [
                          item.icon
                            ? h(MIcon, {
                                name: item.icon,
                                tone: expanded ? 'primary' : 'muted',
                                style: { flexShrink: 0 },
                              })
                            : null,
                          h('span', { class: 'm-accordion-copy' }, [
                            h('span', { style: { display: 'block', fontWeight: 600 } }, item.title),
                            item.description
                              ? h(
                                  'span',
                                  {
                                    id: `${headerId}-description`,
                                    style: {
                                      display: 'block',
                                      color: colors.muted,
                                      marginTop: `${space.xs}px`,
                                      fontSize: `${typography.caption.fontSize}px`,
                                    },
                                  },
                                  item.description,
                                )
                              : null,
                          ]),
                          h(MIcon, {
                            name: expanded ? 'chevron-up' : 'chevron-down',
                            size: 'sm',
                            tone: expanded ? 'primary' : 'muted',
                            style: { flexShrink: 0 },
                          }),
                        ],
                      ),
                    ]),
                    h(
                      MReveal,
                      {
                        show: expanded,
                        padding: 'md',
                        gap: 'md',
                        style: { paddingTop: 0 },
                        accessibilityHidden: props.accessibilityHidden,
                      },
                      {
                        default: () => [
                          h(MSeparator),
                          h(
                            'div',
                            {
                              id: panelId,
                              role: 'region',
                              'aria-labelledby': headerId,
                              ref: (element: unknown) => {
                                if (element) panels.set(key, element as HTMLElement)
                                else panels.delete(key)
                              },
                            },
                            slots.default?.({ item }),
                          ),
                        ],
                      },
                    ),
                  ],
                },
              )
            }),
        },
      )
    }
  },
})
