import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  watch,
} from 'vue'
import { canChoose, choiceKey, validateChoices, type ChoiceOption } from '@getcortexlabs/mavis-core'
import { selectProps, selectEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'
import { MSheet } from './MSheet.js'

export const MSelect = defineComponent({
  name: 'MSelect',
  inheritAttrs: false,
  props: selectProps,
  emits: selectEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const generatedId = `m-select-${useId()}`
    const open = ref(false)
    const trigger = ref<HTMLButtonElement>()
    const active = ref<string>()
    const list = ref<HTMLElement>()
    const rows = new Map<string, HTMLElement>()
    let alive = true
    let search = ''
    let searchedAt = 0
    const options = computed(() => {
      validateChoices(props.options, props.modelValue)
      return props.options
    })
    const enabled = computed(() => options.value.filter((option) => !option.disabled))
    function resetActive(preferSelection = false) {
      const selected = enabled.value.find((option) => option.value === props.modelValue)
      if (
        preferSelection ||
        !enabled.value.some((option) => choiceKey(option.value) === active.value)
      ) {
        const target = selected ?? enabled.value[0]
        active.value = target ? choiceKey(target.value) : undefined
      }
    }
    function revealActive() {
      void nextTick(() => {
        if (alive && open.value && active.value)
          rows.get(active.value)?.scrollIntoView?.({ block: 'nearest' })
      })
    }
    watch(
      options,
      () => {
        resetActive()
        revealActive()
      },
      { deep: true },
    )
    watch(
      () => props.modelValue,
      () => {
        resetActive(true)
        revealActive()
      },
    )
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) open.value = false
      },
    )
    onBeforeUnmount(() => {
      alive = false
      rows.clear()
    })
    function show() {
      if (props.disabled || open.value) return
      // Safari does not focus buttons on pointer activation. Give the dialog a reliable opener,
      // including when activation came through the field's label.
      trigger.value?.focus?.({ preventScroll: true })
      resetActive(true)
      search = ''
      open.value = true
    }
    function choose(option: ChoiceOption) {
      const current = options.value.find((item) => item.value === option.value)
      if (!open.value || props.disabled || !current || current.disabled) return
      if (canChoose(current, props.modelValue)) emit('update:modelValue', current.value)
      open.value = false
    }
    function keydown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return
      const choices = enabled.value
      const index = choices.findIndex((option) => choiceKey(option.value) === active.value)
      let target: ChoiceOption | undefined
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const direction = event.key === 'ArrowDown' ? 1 : -1
        target = choices[(index + direction + choices.length) % choices.length]
      } else if (event.key === 'Home') target = choices[0]
      else if (event.key === 'End') target = choices.at(-1)
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (choices[index]) choose(choices[index])
        return
      } else if (event.key.length === 1) {
        const now = Date.now()
        search = now - searchedAt < 700 ? search + event.key : event.key
        searchedAt = now
        const query = [...search].every((char) => char === search[0]) ? search[0]! : search
        const ordered = [...choices.slice(index + 1), ...choices.slice(0, index + 1)]
        target = ordered.find((option) =>
          option.label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()),
        )
      } else return
      event.preventDefault()
      if (target) {
        active.value = choiceKey(target.value)
        revealActive()
      }
    }
    return () => {
      const { colors, typography, radius, control } = theme.value
      const id = props.id ?? generatedId
      const selected = options.value.find((option) => option.value === props.modelValue)
      const message = props.error || props.helperText
      const optionId = (key: string) => `${id}-option-${encodeURIComponent(key)}`
      return h(
        MColumn,
        mergeProps(attrs, {
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          gap: 'sm',
          accessibilityHidden: props.accessibilityHidden,
        }),
        {
          default: () => [
            h(
              'label',
              {
                id: `${id}-label`,
                for: id,
                style: {
                  color: colors.text,
                  fontSize: `${typography.caption.fontSize}px`,
                  fontWeight: 600,
                  lineHeight: 1.4,
                },
              },
              props.label,
            ),
            h(
              'button',
              {
                ref: trigger,
                id,
                type: 'button',
                class: 'm-select-trigger',
                disabled: props.disabled,
                'aria-haspopup': 'dialog',
                'aria-expanded': open.value,
                'aria-controls': `${id}-dialog`,
                'aria-labelledby': `${id}-label ${id}-value`,
                'aria-describedby': message ? `${id}-message` : undefined,
                'aria-invalid': props.error ? 'true' : undefined,
                style: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  minHeight: `${control.md.height}px`,
                  padding: '14px 16px',
                  border: `1px solid ${props.error ? colors.danger : open.value ? colors.primary : colors.border}`,
                  borderRadius: `${radius.md}px`,
                  backgroundColor: colors.surface,
                  color: selected ? colors.text : colors.muted,
                  fontFamily: 'inherit',
                  fontSize: `${typography.body.fontSize}px`,
                  lineHeight: 1.5,
                  textAlign: 'start',
                  opacity: props.disabled ? 0.45 : 1,
                  '--m-focus': props.error ? colors.danger : colors.primary,
                },
                onClick: show,
                onKeydown: (event: KeyboardEvent) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    show()
                  }
                },
              },
              [
                h(
                  'span',
                  {
                    id: `${id}-value`,
                    style: {
                      flex: '1 1 min-content',
                      minWidth: 0,
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                    },
                  },
                  selected?.label ?? props.placeholder,
                ),
                h(MIcon, {
                  name: 'chevron-down',
                  tone: open.value ? 'primary' : 'muted',
                  style: { flexShrink: 0 },
                }),
              ],
            ),
            message
              ? h(MText, {
                  id: `${id}-message`,
                  text: message,
                  variant: 'caption',
                  tone: props.error ? 'danger' : 'muted',
                })
              : null,
            h(
              MSheet,
              {
                id: `${id}-dialog`,
                open: open.value,
                title: props.label,
                closeLabel: props.closeLabel,
                'onUpdate:open': (value: boolean) => {
                  open.value = value && !props.disabled
                },
              },
              {
                default: () => [
                  h(
                    'div',
                    {
                      ref: list,
                      role: 'listbox',
                      tabindex: 0,
                      class: 'm-select-list',
                      'aria-label': props.label,
                      'aria-activedescendant': active.value ? optionId(active.value) : undefined,
                      style: { '--m-focus': colors.primary },
                      onKeydown: keydown,
                      onVnodeMounted: () => {
                        void nextTick(() => {
                          if (!alive || !open.value) return
                          list.value?.focus?.({ preventScroll: true })
                          revealActive()
                        })
                      },
                    },
                    options.value.map((option) => {
                      const key = choiceKey(option.value)
                      const checked = option.value === props.modelValue
                      return h(
                        'div',
                        {
                          key,
                          id: optionId(key),
                          role: 'option',
                          class: 'm-select-option',
                          ref: (element: unknown) => {
                            if (element) rows.set(key, element as HTMLElement)
                            else rows.delete(key)
                          },
                          'aria-selected': checked,
                          'aria-disabled': option.disabled || undefined,
                          'aria-label': option.label,
                          'aria-describedby': option.helperText
                            ? `${optionId(key)}-help`
                            : undefined,
                          'data-active': active.value === key,
                          style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                            minHeight: '48px',
                            boxSizing: 'border-box',
                            borderRadius: `${radius.md}px`,
                            padding: '12px 14px',
                            color: colors.text,
                            backgroundColor: checked ? colors.primarySoft : 'transparent',
                            opacity: option.disabled ? 0.45 : 1,
                          },
                          onClick: () => choose(option),
                        },
                        [
                          h(
                            'span',
                            {
                              style: {
                                flex: '1 1 min-content',
                                minWidth: 0,
                                overflowWrap: 'break-word',
                                maxWidth: '100%',
                              },
                            },
                            [
                              h(
                                'span',
                                {
                                  style: {
                                    display: 'block',
                                    fontWeight: 600,
                                    fontSize: `${typography.body.fontSize}px`,
                                    lineHeight: 1.5,
                                  },
                                },
                                option.label,
                              ),
                              option.helperText
                                ? h(
                                    'span',
                                    {
                                      id: `${optionId(key)}-help`,
                                      style: {
                                        display: 'block',
                                        color: colors.muted,
                                        fontSize: `${typography.caption.fontSize}px`,
                                        lineHeight: 1.5,
                                        marginTop: '4px',
                                      },
                                    },
                                    option.helperText,
                                  )
                                : null,
                            ],
                          ),
                          checked
                            ? h(MIcon, { name: 'check', tone: 'primary', style: { flexShrink: 0 } })
                            : null,
                        ],
                      )
                    }),
                  ),
                  options.value.length ? null : h(MText, { text: props.emptyText, tone: 'muted' }),
                ],
              },
            ),
          ],
        },
      )
    }
  },
})
