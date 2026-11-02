import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
} from 'nativescript-vue'
import type { EventData, View, ImageSource } from '@nativescript/core'
import { imageProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { resolveRadius } from '@getcortexlabs/mavis-core'
import { loadAvatarImage } from '../../native/avatar-image'
import { MBox } from './layout.js'
import { MText } from './MText.js'

export const MImage = defineComponent({
  name: 'MImage',
  inheritAttrs: false,
  props: imageProps,
  emits: { load: (_src: string) => true, error: (_src: string) => true },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const image = shallowRef<ImageSource | null>(null)
    const status = ref<'loading' | 'ready' | 'error'>('loading')
    const width = ref(typeof props.width === 'number' ? props.width : 0)
    let generation = 0,
      loaded = false
    async function load() {
      const current = ++generation,
        src = props.src
      image.value = null
      status.value = src.trim() ? 'loading' : 'error'
      if (!loaded || !src.trim()) return
      try {
        const result = await loadAvatarImage(src.trim())
        if (current !== generation || !loaded) return
        if (!result || result.width <= 0 || result.height <= 0)
          throw new Error('Image could not be decoded.')
        image.value = result
        status.value = 'ready'
        emit('load', src)
      } catch {
        if (current !== generation || !loaded) return
        status.value = 'error'
        emit('error', src)
      }
    }
    function unload() {
      loaded = false
      generation++
      image.value = null
    }
    watch(
      () => props.src,
      () => {
        void load()
      },
    )
    onBeforeUnmount(unload)
    return () => {
      if (!Number.isFinite(props.aspectRatio) || props.aspectRatio <= 0)
        throw new RangeError('aspectRatio must be finite and positive.')
      const radius = resolveRadius(theme.value, props.radius)
      return h(
        MBox,
        mergeProps(attrs, {
          ...props,
          width: props.width ?? '100%',
          height: props.height ?? width.value / props.aspectRatio,
          backgroundColor: props.backgroundColor || theme.value.colors.elevated,
          accessible: Boolean(props.alt),
          accessibilityRole: 'image',
          accessibilityLabel: props.alt,
          accessibilityHint:
            status.value === 'ready'
              ? ''
              : status.value === 'error'
                ? props.errorLabel
                : props.loadingLabel,
          accessibilityHidden: props.accessibilityHidden || !props.alt,
          onLoaded: () => {
            loaded = true
            void load()
          },
          onUnloaded: unload,
          onLayoutChanged: (event: EventData) => {
            const next = (event.object as View).getActualSize().width
            if (next > 0 && Math.abs(next - width.value) > 0.1) width.value = next
          },
        }),
        () =>
          image.value
            ? [
                h('Image', {
                  imageSource: image.value,
                  width: '100%',
                  height: '100%',
                  stretch: props.fit === 'cover' ? 'aspectFill' : 'aspectFit',
                  borderRadius: radius,
                  accessible: false,
                  accessibilityHidden: true,
                }),
              ]
            : [
                h(MText, {
                  text: status.value === 'error' ? props.errorLabel : props.loadingLabel,
                  tone: 'muted',
                  variant: 'caption',
                  accessibilityHidden: true,
                  style: { textAlignment: 'center', verticalAlignment: 'middle', padding: 16 },
                }),
              ],
      )
    }
  },
})
