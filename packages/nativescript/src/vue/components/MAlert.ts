import { defineComponent, h, mergeProps, onBeforeUnmount, watch } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { alertProps, alertEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { alertAppearance, checkAlertLabels } from '@getcortexlabs/mavis-core'
import { announceToast as announceMessage } from '../../native/toast'
import { ActionChildren, useNativeViewAttrs } from '../accessibility.js'
import { MBox, MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'
import { MButton } from './MButton.js'

export const MAlert = defineComponent({
  name: 'MAlert',
  inheritAttrs: false,
  props: alertProps,
  emits: alertEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    let content: View | undefined
    let pending: ReturnType<typeof setTimeout> | undefined
    let announced = ''
    const message = () => [props.title, props.description].filter(Boolean).join('\n')
    function announce() {
      clearTimeout(pending)
      if (!props.announce) {
        announced = ''
        return
      }
      pending = setTimeout(() => {
        pending = undefined
        if (!content?.isLoaded || nativeAttrs().accessibilityHidden) return
        const text = message()
        if (text === announced) return
        announceMessage(content, text)
        announced = text
      }, 0)
    }
    function release() {
      clearTimeout(pending)
      pending = undefined
      content = undefined
    }
    watch(
      () => [props.announce, props.title, props.description, nativeAttrs().accessibilityHidden],
      announce,
      { flush: 'post' },
    )
    onBeforeUnmount(release)
    return () => {
      checkAlertLabels(props.title, props.dismissible, props.closeLabel)
      const { colors } = theme.value
      const appearance = alertAppearance[props.tone]
      return h(
        MColumn,
        mergeProps(
          {
            width: props.width,
            grow: props.grow,
            shrink: props.shrink,
            padding: 'md',
            gap: 'md',
            radius: 'md',
            backgroundColor: colors.surface,
            style: {
              borderWidth: 1,
              borderColor: colors[appearance.tone],
            },
          },
          attrs,
          nativeAttrs(),
          { accessible: false },
        ),
        {
          default: () => [
            h(
              MRow,
              { gap: 'sm', align: 'start' },
              {
                default: () => [
                  h(
                    MBox,
                    {
                      width: 32,
                      height: 32,
                      radius: 'sm',
                      shrink: 0,
                      backgroundColor: colors.elevated,
                    },
                    {
                      default: () =>
                        h(MIcon, {
                          name: appearance.icon,
                          tone: appearance.tone,
                          size: 20,
                          horizontalAlignment: 'center',
                          verticalAlignment: 'middle',
                        }),
                    },
                  ),
                  h(
                    MColumn,
                    {
                      width: 0,
                      grow: 1,
                      gap: 'xs',
                      accessible: true,
                      accessibilityRole: 'text',
                      accessibilityLabel: message(),
                      accessibilityHidden: nativeAttrs().accessibilityHidden,
                      onLoaded: (event: EventData) => {
                        content = event.object as View
                        announce()
                      },
                      onUnloaded: release,
                    },
                    {
                      default: () =>
                        h(
                          ActionChildren,
                          { hidden: true },
                          {
                            default: () => [
                              h(MText, { text: props.title, style: { fontWeight: '600' } }),
                              props.description
                                ? h(MText, { text: props.description, tone: 'muted' })
                                : null,
                            ],
                          },
                        ),
                    },
                  ),
                  props.dismissible
                    ? h(MButton, {
                        icon: 'x',
                        variant: 'ghost',
                        size: 'sm',
                        accessibilityLabel: props.closeLabel,
                        width: 44,
                        shrink: 0,
                        style: { paddingLeft: 0, paddingRight: 0 },
                        onClick: () => emit('close'),
                      })
                    : null,
                ],
              },
            ),
            slots.actions
              ? h(MRow, { gap: 'sm', wrap: true, align: 'start' }, { default: slots.actions })
              : null,
          ],
        },
      )
    }
  },
})
