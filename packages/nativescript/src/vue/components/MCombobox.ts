import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  nextTick,
  ref,
  watch,
} from 'nativescript-vue'
import { TextField, isAndroid, type EventData, type View } from '@nativescript/core'
import { choiceKey, type InputHandle } from '@getcortexlabs/mavis-core'
import {
  comboboxProps,
  comboboxEmits,
  useCombobox,
  useButtonAction,
} from '@getcortexlabs/mavis-core/vue'
import { comboboxComposing } from '../../native/combobox-editor'
import { MColumn, MRow } from './layout.js'
import { MInput } from './MInput.js'
import { MButton } from './MButton.js'
import { MText } from './MText.js'
import { ChoiceControl } from './ChoiceControl.js'

const Combobox = defineComponent({
  name: 'MCombobox',
  inheritAttrs: false,
  props: comboboxProps,
  emits: comboboxEmits,
  setup(props, { attrs, emit, expose }) {
    useButtonAction()
    const combo = useCombobox(props, emit)
    const input = ref<InputHandle>()
    let nativeEditor: TextField | undefined
    let compositionTimer: ReturnType<typeof setTimeout> | undefined
    let editTimer: ReturnType<typeof setTimeout> | undefined
    let blurTimer: ReturnType<typeof setTimeout> | undefined
    function clearTimers() {
      clearTimeout(compositionTimer)
      clearTimeout(blurTimer)
      clearTimeout(editTimer)
      compositionTimer = blurTimer = editTimer = undefined
    }
    function close() {
      clearTimers()
      combo.close()
    }
    function unload() {
      close()
      nativeEditor = undefined
    }
    onBeforeUnmount(unload)
    watch(combo.open, (open) => {
      if (!open) clearTimers()
    })
    function finishComposition() {
      clearTimeout(compositionTimer)
      compositionTimer = undefined
      if (!combo.open.value || !nativeEditor?.isLoaded) return
      if (comboboxComposing(nativeEditor)) compositionTimer = setTimeout(finishComposition, 30)
      else applyEdit(nativeEditor.text ?? '')
    }
    function applyEdit(value: string) {
      if (comboboxComposing(nativeEditor)) {
        combo.startComposition()
        combo.edit(value)
        clearTimeout(compositionTimer)
        compositionTimer = setTimeout(finishComposition, 30)
      } else if (combo.composing.value) combo.endComposition(value)
      else combo.edit(value)
      const field = nativeEditor
      void nextTick(() => {
        // Native text is mutable before Vue receives textChange. A rejected query
        // can leave equal old/new props, so only rejection needs an explicit repair.
        if (
          field &&
          nativeEditor === field &&
          field.isLoaded &&
          !combo.composing.value &&
          props.query !== value &&
          field.text === value
        )
          field.text = props.query
      })
    }
    function edit(value: string) {
      // Native text notifications can precede the IME attaching its composing span.
      // Inspect on the next turn, before even a zero-debounce search is allowed to start.
      clearTimeout(editTimer)
      editTimer = setTimeout(() => {
        editTimer = undefined
        if (nativeEditor?.isLoaded) applyEdit(value)
      }, 0)
    }
    function findEditor(view: View) {
      if (view instanceof TextField) {
        nativeEditor = view
        return
      }
      view.eachChild?.((child) => {
        findEditor(child as View)
        return !nativeEditor
      })
    }
    const focus = () => {
      if (!props.disabled) input.value?.focus()
    }
    const blur = () => {
      close()
      input.value?.blur()
    }
    expose({ focus, blur } satisfies InputHandle)
    return () => {
      const state = combo.state.value
      const selected = combo.selected.value
      const status =
        state.status === 'loading' || state.status === 'debouncing'
          ? props.loadingText
          : state.status === 'error'
            ? props.searchErrorText
            : state.status === 'empty'
              ? props.emptyText
              : state.status === 'idle'
                ? props.idleText
                : state.limited
                  ? props.limitedText
                  : ''
      void combo.revision.value
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
            h(MInput, {
              ref: input,
              id: props.id,
              label: props.label,
              modelValue: props.query,
              placeholder: props.placeholder,
              helperText: props.helperText,
              error: props.error,
              disabled: props.disabled,
              type: 'search',
              returnKey: 'search',
              autocapitalize: 'none',
              autocorrect: false,
              trailingAction:
                props.clearable && (props.query || props.modelValue !== null)
                  ? { icon: 'x', label: props.clearLabel }
                  : undefined,
              onAction: () => {
                close()
                combo.clear()
                focus()
              },
              'onUpdate:modelValue': edit,
              onLoaded: (event: EventData) => {
                nativeEditor = undefined
                findEditor(event.object as View)
              },
              onFocus: () => {
                clearTimeout(blurTimer)
                combo.show()
                emit('focus')
              },
              onBlur: () => {
                emit('blur')
                // Let a result's tap commit before closing the results on an unrelated focus move.
                blurTimer = setTimeout(close, 0)
              },
              onSubmit: () => {
                if (!combo.composing.value) {
                  combo.show()
                  combo.retry()
                }
              },
            }),
            selected && props.query !== selected.label
              ? h(MText, { text: selected.label, variant: 'caption', tone: 'primary' })
              : null,
            combo.open.value
              ? h(
                  MColumn,
                  { gap: 'xs' },
                  {
                    default: () => [
                      ...state.options.map((option) =>
                        h(ChoiceControl, {
                          key: choiceKey(option.value),
                          radio: true,
                          pressFeedback: !isAndroid,
                          label: option.label,
                          helperText: option.helperText,
                          modelValue: option.value === props.modelValue,
                          disabled: props.disabled || option.disabled,
                          onActivate: () => {
                            clearTimers()
                            combo.choose(option)
                            if (!combo.open.value) input.value?.blur()
                          },
                        }),
                      ),
                      status
                        ? h(MText, {
                            text: status,
                            variant: 'caption',
                            tone: state.status === 'error' ? 'danger' : 'muted',
                          })
                        : null,
                      h(
                        MRow,
                        { gap: 'sm', wrap: true },
                        {
                          default: () => [
                            state.status === 'error'
                              ? h(MButton, {
                                  text: props.retryLabel,
                                  variant: 'ghost',
                                  onClick: () => {
                                    clearTimers()
                                    combo.show()
                                    combo.retry()
                                    focus()
                                  },
                                })
                              : null,
                            h(MButton, {
                              text: props.closeLabel,
                              variant: 'ghost',
                              onClick: () => {
                                combo.cancel()
                                blur()
                              },
                            }),
                          ],
                        },
                      ),
                    ],
                  },
                )
              : null,
          ],
        },
      )
    }
  },
})
export const MCombobox = Combobox as typeof Combobox & {
  new (): InstanceType<typeof Combobox> & InputHandle
}
