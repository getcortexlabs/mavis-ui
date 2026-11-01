import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  shallowRef,
  watch,
  registerElement,
} from 'nativescript-vue'
import { avatarProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { avatarSizes, avatarInitials, iconGlyph, iconFontFamily } from '@getcortexlabs/mavis-core'
import type { ImageSource } from '@nativescript/core'
import { loadAvatarImage } from '../../native/avatar-image'
import { useNativeViewAttrs } from '../accessibility.js'
import { MBox } from './layout.js'
import { MavisAvatarLabel } from '../../native/avatar-label'

registerElement('MavisAvatarLabel', () => MavisAvatarLabel)

export const MAvatar = defineComponent({
  name: 'MAvatar',
  inheritAttrs: false,
  props: avatarProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const image = shallowRef<ImageSource | null>(null)
    let request = 0
    watch(
      () => props.src,
      async (value) => {
        const current = ++request
        image.value = null
        if (!value.trim()) return
        try {
          const result = await loadAvatarImage(value.trim())
          if (current === request)
            image.value = result && result.width > 0 && result.height > 0 ? result : null
        } catch {
          // Missing files, network failures and decode errors all keep the fallback.
        }
      },
      { immediate: true },
    )
    onBeforeUnmount(() => {
      request++
      image.value = null
    })
    return () => {
      const size = avatarSizes[props.size]
      const radius = props.shape === 'circle' ? size / 2 : size / 4
      const initials = avatarInitials(props.name)
      const label = props.accessibilityLabel ?? props.name.trim()
      return h(
        MBox,
        mergeProps(attrs, nativeAttrs(), {
          width: size,
          height: size,
          radius,
          shrink: 0,
          backgroundColor: theme.value.colors.primarySoft,
          accessible: Boolean(label),
          accessibilityRole: 'image',
          accessibilityLabel: label,
          accessibilityHidden: nativeAttrs().accessibilityHidden || !label,
          style: { alignSelf: 'flex-start' },
        }),
        {
          default: () =>
            image.value
              ? [
                  h('Image', {
                    imageSource: image.value,
                    stretch: 'aspectFill',
                    width: size,
                    height: size,
                    borderRadius: radius,
                    accessible: false,
                    accessibilityHidden: true,
                  }),
                ]
              : [
                  h('MavisAvatarLabel', {
                    text: initials || iconGlyph('user-round'),
                    textWrap: false,
                    accessible: false,
                    accessibilityHidden: true,
                    iosAccessibilityAdjustsFontSize: false,
                    style: {
                      fontFamily: initials ? undefined : iconFontFamily,
                      fontSize: Math.round(size * (initials ? 0.34 : 0.46)),
                      fontWeight: '600',
                      color: theme.value.colors.primary,
                      textAlignment: 'center',
                      verticalAlignment: 'middle',
                    },
                  }),
                ],
        },
      )
    }
  },
})
