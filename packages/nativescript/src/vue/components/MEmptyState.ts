import { defineComponent, h, mergeProps, type SlotsType, type VNode } from 'nativescript-vue'
import { checkEmptyStateTitle } from '@getcortexlabs/mavis-core'
import { emptyStateProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { ActionChildren } from '../accessibility.js'
import { MColumn, MRow, MBox } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'

export const MEmptyState = defineComponent({
  name: 'MEmptyState',
  inheritAttrs: false,
  props: emptyStateProps,
  slots: Object as SlotsType<{ illustration?: () => VNode[]; actions?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const { theme } = useMavisTheme()
    return () => {
      checkEmptyStateTitle(props.title)
      const { colors } = theme.value
      const size = props.compact ? 64 : 88
      const illustration = () =>
        slots.illustration?.() ??
        h(
          MBox,
          {
            width: size,
            height: size,
          },
          {
            default: () => [
              h(MBox, {
                width: size,
                height: size,
                radius: 'full',
                backgroundColor: colors[props.tone === 'primary' ? 'primarySoft' : 'accentSoft'],
              }),
              h(MIcon, {
                name: props.icon,
                size: props.compact ? 28 : 36,
                tone: props.tone,
                style: { horizontalAlignment: 'center', verticalAlignment: 'middle' },
              }),
              h(MBox, {
                width: 18,
                height: 18,
                radius: 'full',
                backgroundColor: colors[props.tone === 'primary' ? 'accent' : 'primary'],
                style: { horizontalAlignment: 'right', verticalAlignment: 'top' },
              }),
            ],
          },
        )
      return h(
        MColumn,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          gap: props.compact ? 'md' : 'lg',
          padding: props.compact ? 'lg' : '2xl',
          align: 'stretch',
        }),
        {
          default: () => [
            h(
              MColumn,
              { align: 'center', accessibilityHidden: true },
              { default: () => h(ActionChildren, { hidden: true }, { default: illustration }) },
            ),
            h(
              MColumn,
              { gap: 'sm' },
              {
                default: () => [
                  h(MText, {
                    text: props.title,
                    variant: props.compact ? 'heading' : 'title',
                    as: props.titleAs,
                    align: 'center',
                  }),
                  props.description
                    ? h(MText, { text: props.description, tone: 'muted', align: 'center' })
                    : null,
                ],
              },
            ),
            slots.actions
              ? h(MRow, { gap: 'sm', wrap: true, justify: 'center' }, { default: slots.actions })
              : null,
          ],
        },
      )
    }
  },
})
