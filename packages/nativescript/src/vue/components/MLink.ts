import { defineComponent, h, mergeProps, onBeforeUnmount, ref } from 'nativescript-vue'
import { type EventData, type View } from '@nativescript/core'
import { nativeDestination, navigateNative } from '../navigation.js'
import {
  linkProps,
  linkEmits,
  textContent,
  useMavisTheme,
  useNavigationOptions,
} from '@getcortexlabs/mavis-core/vue'
import { MRow } from './layout.js'
import { MText } from './MText.js'
import { ActionChildren, useNativeViewAttrs } from '../accessibility.js'
import { observeComposedButton } from '../../native/composed-button'

export const MLink = defineComponent({
  name: 'MLink',
  inheritAttrs: false,
  props: linkProps,
  emits: linkEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const navigation = useNavigationOptions(props)
    const nativeAttrs = useNativeViewAttrs(props)
    const focused = ref(false)
    let release: (() => void) | undefined
    const clear = () => {
      release?.()
      release = undefined
      focused.value = false
    }
    onBeforeUnmount(clear)
    const activate = async () => {
      if (props.disabled) return
      emit('click')
      try {
        await navigateNative(navigation())
      } catch (error) {
        emit('error', error)
      }
    }
    return () => {
      nativeDestination(navigation())
      const text = props.text ?? textContent(slots.default?.())
      const label = props.accessibilityLabel ?? text
      if (!label.trim()) throw new TypeError('MLink requires a name.')
      return h(
        MRow,
        mergeProps(
          {
            align: 'center',
            justify: 'center',
            grow: props.grow,
            shrink: props.shrink,
            style: {
              minHeight: props.inline ? 0 : 44,
              opacity: props.disabled ? 0.45 : 1,
              borderWidth: focused.value ? 1 : 0,
              borderColor: theme.value.colors.primary,
            },
          },
          nativeAttrs(),
          attrs,
          {
            accessible: true,
            accessibilityRole: 'link',
            accessibilityLabel: label,
            accessibilityState: props.disabled ? 'disabled' : '',
            isEnabled: !props.disabled,
            onTap: activate,
            onLoaded(event: EventData) {
              clear()
              release = observeComposedButton(
                event.object as View,
                (value) => {
                  focused.value = value
                },
                activate,
                () => {},
              )
            },
            onUnloaded: clear,
          },
        ),
        {
          default: () =>
            h(
              ActionChildren,
              { hidden: true },
              {
                default: () =>
                  h(MText, { text, tone: 'primary', style: { textDecoration: 'underline' } }),
              },
            ),
        },
      )
    }
  },
})
