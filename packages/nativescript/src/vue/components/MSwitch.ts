import { isAndroid } from '@nativescript/core'
import { defineComponent, h, mergeProps, nextTick, onBeforeUnmount } from 'nativescript-vue'
import type {
  EventData,
  PropertyChangeData,
  Switch,
  TouchGestureEventData,
} from '@nativescript/core'
import {
  useButtonAction,
  switchProps,
  switchEmits,
  useMavisTheme,
} from '@getcortexlabs/mavis-core/vue'
import { MRow, MColumn } from './layout.js'
import { MText } from './MText.js'
import { useNativeViewAttrs } from '../accessibility.js'
import { usePressFeedback } from '../use-press.js'

export const MSwitch = defineComponent({
  name: 'MSwitch',
  inheritAttrs: false,
  props: switchProps,
  emits: switchEmits,
  setup(props, { attrs, emit }) {
    useButtonAction()
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const feedback = usePressFeedback(() => !props.disabled, theme)
    let control: Switch | undefined
    let restoring = false
    let revision = 0
    let start: { x: number; y: number } | undefined
    let verticalDrag = false
    let touchEnd: ReturnType<typeof setTimeout> | undefined

    function resetTouch() {
      clearTimeout(touchEnd)
      touchEnd = undefined
      start = undefined
      verticalDrag = false
    }
    function touch(event: TouchGestureEventData) {
      if (event.action === 'down') {
        resetTouch()
        start = { x: event.getX(), y: event.getY() }
      } else {
        if (start) {
          const x = Math.abs(event.getX() - start.x)
          const y = Math.abs(event.getY() - start.y)
          if (y > 8 && y > x) verticalDrag = true
        }
        if (event.action === 'cancel') verticalDrag = true
        if (event.action === 'up' || event.action === 'cancel') {
          // UIKit can send valueChanged after touch-up in the same dispatch.
          // Keep the decision until dispatch finishes, then allow keyboard/AT.
          clearTimeout(touchEnd)
          touchEnd = setTimeout(resetTouch, 0)
        }
      }
    }

    function release() {
      resetTouch()
      control = undefined
      revision++
    }
    onBeforeUnmount(release)

    function change(event: PropertyChangeData) {
      if (restoring) return
      const view = event.object as Switch
      const value = Boolean(event.value)
      if (!props.disabled && !verticalDrag && value !== props.modelValue)
        emit('update:modelValue', value)
      const current = ++revision
      // Native controls update themselves before Vue. Restore a rejected change,
      // without treating that restoration as another user activation.
      void nextTick(() => {
        if (current !== revision || control !== view || view.checked === props.modelValue) return
        restoring = true
        try {
          view.checked = props.modelValue
        } finally {
          restoring = false
        }
      })
    }

    return () => {
      const { colors } = theme.value
      return h(
        MRow,
        mergeProps(
          {
            width: props.width,
            grow: props.grow,
            shrink: props.shrink,
            gap: 'md',
            justify: 'between',
            style: { minHeight: 48, opacity: props.disabled ? 0.45 : 1 },
          },
          attrs,
          { accessibilityHidden: props.accessibilityHidden },
        ),
        {
          default: () => [
            h(
              MColumn,
              {
                gap: 'xs',
                paddingY: 'sm',
                justify: 'center',
                style: { minHeight: 48 },
                accessibilityHidden: true,
                isUserInteractionEnabled: !props.disabled,
                ...feedback,
                onTap: () => {
                  if (!props.disabled) emit('update:modelValue', !props.modelValue)
                },
              },
              {
                default: () => [
                  h(MText, {
                    text: props.label,
                    accessibilityHidden: true,
                    style: { fontWeight: '600' },
                  }),
                  props.helperText
                    ? h(MText, {
                        text: props.helperText,
                        accessibilityHidden: true,
                        variant: 'caption',
                        tone: 'muted',
                      })
                    : null,
                ],
              },
            ),
            h(
              MColumn,
              { width: 64, shrink: 0, align: 'center', justify: 'center' },
              {
                default: () =>
                  h('Switch', {
                    ...nativeAttrs(),
                    checked: props.modelValue,
                    isEnabled: !props.disabled,
                    accessible: true,
                    accessibilityRole: 'switch',
                    accessibilityState: props.modelValue ? 'checked' : 'unchecked',
                    accessibilityLabel: props.label,
                    accessibilityHint: props.helperText || undefined,
                    // Android's thumb extends beyond the narrow track: a light
                    // thumb disappears against a light settings surface.
                    color: isAndroid
                      ? props.modelValue
                        ? colors.primary
                        : colors.muted
                      : props.modelValue
                        ? colors.onPrimary
                        : colors.surface,
                    backgroundColor: isAndroid ? colors.primarySoft : colors.primary,
                    offBackgroundColor: isAndroid ? colors.border : colors.muted,
                    margin: 0,
                    onTouch: touch,
                    onCheckedChange: change,
                    onLoaded: (event: EventData) => {
                      control = event.object as Switch
                      // A retained page can unload before a pending restoration.
                      restoring = true
                      try {
                        control.checked = props.modelValue
                      } finally {
                        restoring = false
                      }
                    },
                    onUnloaded: release,
                  }),
              },
            ),
          ],
        },
      )
    }
  },
})
