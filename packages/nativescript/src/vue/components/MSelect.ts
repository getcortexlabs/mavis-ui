import {
  computed,
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  ref,
  watch,
} from 'nativescript-vue'
import { Utils, isAndroid, type EventData, type View } from '@nativescript/core'
import { canChoose, choiceKey, validateChoices, type ChoiceOption } from '@getcortexlabs/mavis-core'
import { selectProps, selectEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { observeCheckbox } from '../../native/checkbox'
import { MColumn, MBox } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MIcon } from './MIcon.js'
import { MSheet } from './MSheet.js'
import { ChoiceControl } from './ChoiceControl.js'

export const MSelect = defineComponent({
  name: 'MSelect',
  inheritAttrs: false,
  props: selectProps,
  emits: selectEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const open = ref(false)
    const focused = ref(false)
    let observer: ReturnType<typeof observeCheckbox> | undefined
    const options = computed(() => {
      validateChoices(props.options, props.modelValue)
      return props.options
    })
    function unload() {
      open.value = false
      observer?.dispose()
      observer = undefined
      focused.value = false
    }
    onBeforeUnmount(unload)
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) open.value = false
      },
    )
    function show() {
      if (props.disabled || open.value) return
      Utils.dismissKeyboard()
      open.value = true
    }
    function choose(option: ChoiceOption) {
      // Resolve the live option again: removal or disabling while open must win over an old tap.
      const current = options.value.find((item) => item.value === option.value)
      if (!open.value || props.disabled || !current || current.disabled) return
      if (canChoose(current, props.modelValue)) emit('update:modelValue', current.value)
      open.value = false
    }
    return () => {
      const { colors, typography } = theme.value
      const selected = options.value.find((option) => option.value === props.modelValue)
      const message = props.error || props.helperText
      const active = open.value || focused.value
      return h(
        MColumn,
        mergeProps(attrs, {
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          gap: 'sm',
          accessibilityHidden: props.accessibilityHidden,
          onUnloaded: unload,
        }),
        {
          default: () => [
            h(MText, {
              text: props.label,
              variant: 'caption',
              style: { fontWeight: '600' },
              accessibilityHidden: true,
              onTap: show,
            }),
            h(
              MBox,
              {},
              {
                default: () => [
                  h(MButton, {
                    id: props.id,
                    text: selected?.label ?? props.placeholder,
                    variant: 'secondary',
                    disabled: props.disabled,
                    accessibilityLabel: props.label,
                    accessibilityHint: message,
                    style: {
                      textAlignment: 'left',
                      fontSize: typography.body.fontSize,
                      fontWeight: '400',
                      paddingLeft: 16,
                      paddingRight: 48,
                      paddingTop: 14,
                      paddingBottom: 14,
                      backgroundColor: colors.surface,
                      color: selected ? colors.text : colors.muted,
                      borderWidth: 2,
                      borderColor: props.error
                        ? colors.danger
                        : active
                          ? colors.primary
                          : colors.border,
                    },
                    onClick: show,
                    onLoaded: (event: EventData) => {
                      observer?.dispose()
                      observer = observeCheckbox(event.object as View, (value) => {
                        focused.value = value
                      })
                    },
                    onUnloaded: unload,
                  }),
                  h(MIcon, {
                    name: 'chevron-down',
                    tone: props.error ? 'danger' : active ? 'primary' : 'muted',
                    isUserInteractionEnabled: false,
                    style: {
                      horizontalAlignment: 'right',
                      verticalAlignment: 'middle',
                      marginRight: 16,
                      opacity: props.disabled ? 0.45 : 1,
                    },
                  }),
                ],
              },
            ),
            message
              ? h(MText, {
                  text: message,
                  variant: 'caption',
                  tone: props.error ? 'danger' : 'muted',
                })
              : null,
            h(
              MSheet,
              {
                open: open.value,
                title: props.label,
                closeLabel: props.closeLabel,
                gap: 'sm',
                'onUpdate:open': (value: boolean) => {
                  open.value = value && !props.disabled
                },
              },
              {
                default: () =>
                  options.value.length
                    ? options.value.map((option) =>
                        h(ChoiceControl, {
                          key: choiceKey(option.value),
                          radio: true,
                          // Mark feedback blocks drags from reaching the nested Android ScrollView.
                          // Keep the native button gesture there; the field and Sheet still animate.
                          pressFeedback: !isAndroid,
                          label: option.label,
                          helperText: option.helperText,
                          modelValue: option.value === props.modelValue,
                          disabled: props.disabled || option.disabled,
                          onActivate: () => choose(option),
                        }),
                      )
                    : h(MText, { text: props.emptyText, tone: 'muted' }),
              },
            ),
          ],
        },
      )
    }
  },
})
