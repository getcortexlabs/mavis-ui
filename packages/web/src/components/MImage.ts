import { defineComponent, h, mergeProps, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { imageProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { resolveRadius, resolveDimension } from '@getcortexlabs/mavis-core'
import { boxStyle, webAttrs, length } from '../style.js'
import { useMotionSurface } from '../use-motion-surface.js'
import { registerMotionImage } from '../image-effects.js'

export const MImage = defineComponent({
  name: 'MImage',
  inheritAttrs: false,
  props: imageProps,
  emits: {
    load: (_src: string) => true,
    error: (_src: string) => true,
    'update:src': (_src: string) => true,
  },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const status = ref<'loading' | 'ready' | 'error'>('loading')
    let generation = 0,
      alive = true
    let currentImage: HTMLImageElement | undefined,
      releaseImage: (() => void) | undefined,
      committing: string | undefined
    const motion = useMotionSurface(() =>
      status.value === 'ready' ? props.motionSurface : undefined,
    )
    watch(
      () => props.src,
      () => {
        if (props.src === committing) {
          committing = undefined
          return
        }
        generation++
        status.value = props.src.trim() ? 'loading' : 'error'
      },
      { flush: 'sync', immediate: true },
    )
    onBeforeUnmount(() => {
      alive = false
      generation++
      releaseImage?.()
    })
    return () => {
      if (!Number.isFinite(props.aspectRatio) || props.aspectRatio <= 0)
        throw new RangeError('aspectRatio must be finite and positive.')
      const current = generation,
        src = props.src
      const settle = (success: boolean) => {
        if (!alive || current !== generation || status.value !== 'loading') return
        status.value = success ? 'ready' : 'error'
        if (success) emit('load', src)
        else emit('error', src)
      }
      const radius = resolveRadius(theme.value, props.radius)
      return h(
        'div',
        mergeProps(webAttrs(attrs), {
          id: props.id,
          class: 'm-image',
          'data-state': status.value,
          'aria-hidden': props.accessibilityHidden || !props.alt || undefined,
          role: status.value === 'ready' ? undefined : 'img',
          'aria-label':
            status.value === 'ready'
              ? undefined
              : `${props.alt}: ${status.value === 'error' ? props.errorLabel : props.loadingLabel}`,
          style: {
            ...boxStyle(theme.value, props),
            position: 'relative',
            overflow: 'hidden',
            width: length(resolveDimension(props.width)) ?? '100%',
            aspectRatio: String(props.aspectRatio),
            borderRadius: `${radius}px`,
            backgroundColor: props.backgroundColor || theme.value.colors.elevated,
          },
        }),
        [
          src.trim()
            ? h('img', {
                key: current,
                src,
                alt: props.alt,
                onLoad: (event: Event) => {
                  const target = event.target as HTMLImageElement
                  if (target?.decode)
                    void target.decode().then(
                      () => settle(true),
                      () => settle(false),
                    )
                  else settle(true)
                },
                onError: () => settle(false),
                onVnodeMounted: (node) => {
                  const image = node.el as HTMLImageElement
                  currentImage = image
                  releaseImage?.()
                  releaseImage = registerMotionImage(image, {
                    current: () => alive && current === generation && currentImage === image,
                    async commit(destination) {
                      if (!alive || current !== generation || currentImage !== image) return false
                      const previous = props.src
                      committing = destination
                      emit('update:src', destination)
                      await nextTick()
                      const accepted =
                        alive &&
                        current === generation &&
                        currentImage === image &&
                        props.src === destination
                      committing = undefined
                      if (!accepted && current === generation && currentImage === image)
                        image.src = previous
                      return accepted
                    },
                  })
                  motion.onVnodeMounted(node)
                  if (image.complete) {
                    if (image.naturalWidth && image.decode)
                      void image.decode().then(
                        () => settle(true),
                        () => settle(false),
                      )
                    else settle(image.naturalWidth > 0)
                  }
                },
                onVnodeBeforeUnmount: () => {
                  motion.onVnodeBeforeUnmount()
                  releaseImage?.()
                  releaseImage = undefined
                  currentImage = undefined
                },
                style: {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: props.fit,
                  opacity: status.value === 'ready' ? 1 : 0,
                },
              })
            : null,
          status.value !== 'ready'
            ? h(
                'span',
                {
                  'aria-hidden': 'true',
                  style: {
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    color: theme.value.colors.muted,
                    fontSize: `${theme.value.typography.caption.fontSize}px`,
                    textAlign: 'center',
                  },
                },
                status.value === 'error' ? props.errorLabel : props.loadingLabel,
              )
            : null,
        ],
      )
    }
  },
})
