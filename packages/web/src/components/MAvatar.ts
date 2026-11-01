import { fontFamily } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps, ref, watch } from 'vue'
import { avatarProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { avatarSizes, avatarInitials } from '@getcortexlabs/mavis-core'
import { webAttrs } from '../style.js'
import { MIcon } from './MIcon.js'

export const MAvatar = defineComponent({
  name: 'MAvatar',
  inheritAttrs: false,
  props: avatarProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const ready = ref(false)
    let revision = 0
    watch(
      () => props.src,
      () => {
        revision++
        ready.value = false
      },
      { flush: 'sync' },
    )
    return () => {
      const size = avatarSizes[props.size]
      const current = revision
      const label = props.accessibilityLabel ?? props.name.trim()
      const hidden = props.accessibilityHidden || !label
      const initials = avatarInitials(props.name)
      return h(
        'span',
        mergeProps(webAttrs(attrs), {
          id: props.id,
          class: 'm-avatar',
          role: hidden ? undefined : 'img',
          'aria-label': hidden ? undefined : label,
          'aria-hidden': hidden ? 'true' : undefined,
          style: {
            display: 'inline-grid',
            position: 'relative',
            overflow: 'hidden',
            width: `${size}px`,
            height: `${size}px`,
            flexShrink: 0,
            alignSelf: 'flex-start',
            borderRadius: props.shape === 'circle' ? '50%' : `${size / 4}px`,
            placeItems: 'center',
            color: theme.value.colors.primary,
            backgroundColor: theme.value.colors.primarySoft,
            fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
            fontSize: `${Math.round(size * 0.34)}px`,
            fontWeight: 600,
            lineHeight: 1,
          },
        }),
        [
          h(
            'span',
            {
              'aria-hidden': 'true',
              style: { gridArea: '1 / 1', visibility: ready.value ? 'hidden' : 'visible' },
            },
            initials ||
              h(MIcon, { name: 'user-round', size: Math.round(size * 0.46), tone: 'primary' }),
          ),
          props.src.trim()
            ? h('img', {
                key: revision,
                src: props.src.trim(),
                alt: '',
                'aria-hidden': 'true',
                draggable: false,
                ref: (element) => {
                  const image = element as HTMLImageElement | null
                  if (current === revision && image?.complete) ready.value = image.naturalWidth > 0
                },
                style: {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  visibility: ready.value ? 'visible' : 'hidden',
                },
                onLoad: () => {
                  if (current === revision) ready.value = true
                },
                onError: () => {
                  if (current === revision) ready.value = false
                },
              })
            : null,
        ],
      )
    }
  },
})
