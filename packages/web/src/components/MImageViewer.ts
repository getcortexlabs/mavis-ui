import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue'
import type { WebZoomable, WebSharedLayout } from '@rafaelaugusto/jolt/web'
import {
  choiceKey,
  validateViewer,
  type ChoiceValue,
  type ViewerImage,
} from '@getcortexlabs/mavis-core'
import { imageViewerProps, useCachedActivity, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useMotionContext } from '../motion-context.js'
import { MButton } from './MButton.js'

export const MImageViewer = defineComponent({
  name: 'MImageViewer',
  inheritAttrs: false,
  props: imageViewerProps,
  emits: {
    'update:modelValue': (_key: ChoiceValue) => true,
    'update:open': (_open: boolean) => true,
    close: (_reason: 'button' | 'escape' | 'gesture' | 'outside') => true,
    error: (_image: ViewerImage) => true,
  },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const active = useCachedActivity()
    const context = useMotionContext()
    const selected = computed(() => {
      validateViewer(props.images)
      return props.images.find((image) => image.key === props.modelValue) ?? props.images[0]
    })
    const requested = computed(
      () => props.open && !props.disabled && active.value && !!selected.value,
    )
    const presented = ref(false),
      displayed = ref<ViewerImage>(),
      loaded = ref(false),
      failed = ref(false),
      zoomReady = ref(false),
      scale = ref(1)
    const dialog = ref<HTMLDialogElement>(),
      viewport = ref<HTMLElement>(),
      photo = ref<HTMLImageElement>()
    const thumbs = new Map<string, HTMLImageElement>(),
      triggers = new Map<string, HTMLButtonElement>()
    let lease: ReturnType<typeof context.acquire> | undefined,
      shared: WebSharedLayout | undefined,
      zoom: WebZoomable | undefined
    let generation = 0,
      flying = false,
      pendingClose = false
    let detachPhoto = () => {},
      opener: HTMLElement | undefined,
      pendingOpener: HTMLElement | undefined
    let previousOverflow: string | undefined
    function attachImage(element: HTMLImageElement | undefined) {
      detachPhoto()
      detachPhoto = () => {}
      if (element && shared) detachPhoto = shared.attach(element, 'photo')
    }
    function releaseZoom() {
      zoom?.dispose()
      zoom = undefined
      zoomReady.value = false
      scale.value = 1
    }
    function startZoom() {
      if (
        !lease ||
        !requested.value ||
        !presented.value ||
        !photo.value ||
        !viewport.value ||
        !loaded.value ||
        flying ||
        zoom
      )
        return
      zoom = lease.runtime.zoomable(photo.value, {
        viewport: viewport.value,
        scale: [1, Math.max(1, props.maxZoom)],
        doubleTap: Math.min(2.5, props.maxZoom),
        dismiss: 'vertical',
        onSettled(state) {
          scale.value = state.scale
          if (pendingClose && state.scale <= 1.001) finishClose()
        },
        onDismiss(intent) {
          request('gesture')
          void nextTick(() => {
            if (requested.value) intent.cancel()
          })
        },
        onError() {
          if (displayed.value) emit('error', displayed.value)
        },
      })
      zoomReady.value = zoom.ready
    }
    function restorePage() {
      if (previousOverflow !== undefined && document.body.style.overflow === 'hidden')
        document.body.style.overflow = previousOverflow
      previousOverflow = undefined
    }
    function restoreFocus() {
      const target = opener?.isConnected
        ? opener
        : displayed.value
          ? triggers.get(choiceKey(displayed.value.key))
          : undefined
      if (
        target?.isConnected &&
        (!document.activeElement ||
          document.activeElement === document.body ||
          dialog.value?.contains(document.activeElement))
      )
        target.focus({ preventScroll: true })
      opener = undefined
    }
    function finishClose() {
      if (!presented.value || requested.value) {
        pendingClose = false
        return
      }
      pendingClose = false
      releaseZoom()
      const token = ++generation
      flying = false
      const thumb = displayed.value ? thumbs.get(choiceKey(displayed.value.key)) : undefined
      const change = () => {
        presented.value = false
        if (dialog.value?.open) dialog.value.close()
        attachImage(thumb)
        restorePage()
      }
      const flight = shared?.transition(change)
      if (!flight) change()
      void (flight?.finished ?? Promise.resolve()).then(() => {
        if (token === generation && !requested.value) restoreFocus()
      })
    }
    function sync() {
      if (!lease) return
      if (!requested.value) {
        if (presented.value && zoom && zoom.state.scale > 1.001) {
          pendingClose = true
          zoom.reset()
          return
        }
        finishClose()
        return
      }
      pendingClose = false
      if (presented.value) {
        if (
          displayed.value?.key !== selected.value?.key ||
          displayed.value?.src !== selected.value?.src
        ) {
          ++generation
          shared?.cancel()
          releaseZoom()
          flying = false
          loaded.value = failed.value = false
          displayed.value = selected.value
          void nextTick(() => {
            attachImage(photo.value)
            if (photo.value?.complete && photo.value.naturalWidth) {
              loaded.value = true
              startZoom()
            }
          })
        }
        return
      }
      const token = ++generation
      displayed.value = selected.value
      loaded.value = failed.value = false
      opener =
        pendingOpener ??
        (document.activeElement instanceof HTMLElement ? document.activeElement : undefined)
      pendingOpener = undefined
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      attachImage(displayed.value ? thumbs.get(choiceKey(displayed.value.key)) : undefined)
      flying = true
      const change = () => {
        presented.value = true
        void nextTick(() => {
          if (token !== generation || !presented.value) return
          dialog.value?.showModal()
          attachImage(photo.value)
          dialog.value
            ?.querySelector<HTMLButtonElement>('[data-viewer-close]')
            ?.focus({ preventScroll: true })
        })
      }
      const flight = shared?.transition(change)
      if (!flight) change()
      void (flight?.finished ?? nextTick()).then(() => {
        if (token === generation) {
          flying = false
          startZoom()
        }
      })
    }
    function request(reason: 'button' | 'escape' | 'gesture' | 'outside') {
      if (!requested.value) return
      emit('update:open', false)
      emit('close', reason)
    }
    function move(delta: number) {
      const index = props.images.findIndex((image) => image.key === selected.value?.key)
      const next = props.images[index + delta]
      if (next && !props.disabled) emit('update:modelValue', next.key)
    }
    function zoomBy(delta: number) {
      if (zoom) zoom.zoomTo(Math.max(1, Math.min(props.maxZoom, zoom.state.scale + delta)))
    }
    function key(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === 'Tab' && dialog.value) {
        const buttons = [
          ...dialog.value.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
        ]
        const first = buttons[0],
          last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
      if (event.target instanceof HTMLButtonElement) return
      if (
        (zoom?.state.scale ?? 1) <= 1.001 &&
        (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
      ) {
        event.preventDefault()
        move(event.key === 'ArrowRight' ? 1 : -1)
      }
    }
    function connect() {
      if (lease) return
      lease = context.acquire(document)
      shared = lease.runtime.sharedLayout(document.body, {
        transition: { type: 'spring', duration: 460, bounce: 0.06 },
      })
      sync()
    }
    function cleanup() {
      ++generation
      pendingClose = flying = false
      releaseZoom()
      detachPhoto()
      shared?.dispose()
      shared = undefined
      dialog.value?.close()
      presented.value = false
      if (typeof document !== 'undefined') {
        restorePage()
        restoreFocus()
      }
      lease?.release()
      lease = undefined
    }
    watch([requested, selected], sync, { flush: 'post' })
    watch(
      () => props.maxZoom,
      () => {
        releaseZoom()
        startZoom()
      },
    )
    onMounted(connect)
    onActivated(connect)
    onDeactivated(cleanup)
    onBeforeUnmount(cleanup)
    return () => {
      if (!Number.isFinite(props.maxZoom) || props.maxZoom < 1)
        throw new RangeError('maxZoom must be at least 1.')
      validateViewer(props.images)
      const index = props.images.findIndex((image) => image.key === displayed.value?.key)
      return h(
        'div',
        mergeProps(attrs, { class: 'm-image-viewer', role: 'group', 'aria-label': props.label }),
        [
          h(
            'div',
            {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))',
                gap: '12px',
              },
            },
            props.images.map((image) =>
              h(
                'button',
                {
                  key: choiceKey(image.key),
                  ref: (element: unknown) => {
                    if (element) triggers.set(choiceKey(image.key), element as HTMLButtonElement)
                    else triggers.delete(choiceKey(image.key))
                  },
                  type: 'button',
                  disabled: props.disabled,
                  'aria-label': image.alt,
                  'aria-haspopup': 'dialog',
                  style: {
                    padding: 0,
                    border: `1px solid ${theme.value.colors.border}`,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: theme.value.colors.surface,
                    cursor: props.disabled ? 'default' : 'zoom-in',
                  },
                  onClick: (event: MouseEvent) => {
                    pendingOpener = event.currentTarget as HTMLElement
                    emit('update:modelValue', image.key)
                    emit('update:open', true)
                  },
                },
                [
                  h('img', {
                    ref: (element: unknown) => {
                      if (element) thumbs.set(choiceKey(image.key), element as HTMLImageElement)
                      else thumbs.delete(choiceKey(image.key))
                    },
                    src: image.thumbnail ?? image.src,
                    alt: '',
                    loading: 'lazy',
                    style: {
                      display: 'block',
                      width: '100%',
                      aspectRatio: String(image.aspectRatio ?? 1.5),
                      objectFit: 'cover',
                    },
                  }),
                  h(
                    'span',
                    {
                      style: {
                        display: 'block',
                        padding: '10px 12px',
                        color: theme.value.colors.text,
                        textAlign: 'start',
                        font: 'inherit',
                      },
                    },
                    image.alt,
                  ),
                ],
              ),
            ),
          ),
          h(
            'dialog',
            {
              ref: dialog,
              'aria-label': props.label,
              onCancel: (event: Event) => {
                event.preventDefault()
                request('escape')
              },
              onClose: () => {
                if (dialog.value?.open) return
                if (requested.value) request('escape')
                else restoreFocus()
              },
              onKeydown: key,
              style: {
                boxSizing: 'border-box',
                width: '100vw',
                height: '100dvh',
                maxWidth: 'none',
                maxHeight: 'none',
                padding:
                  'max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))',
                margin: 0,
                border: 0,
                background: theme.value.colors.background,
                color: theme.value.colors.text,
                overflow: 'hidden',
              },
            },
            presented.value && displayed.value
              ? [
                  h(
                    'div',
                    {
                      style: {
                        display: 'grid',
                        gridTemplateRows: 'auto minmax(0,1fr) auto',
                        gap: '12px',
                        height: '100%',
                      },
                    },
                    [
                      h(
                        'div',
                        {
                          style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                          },
                        },
                        [
                          h(
                            'span',
                            { role: 'status', 'aria-live': 'polite' },
                            `${index + 1} / ${props.images.length} · ${displayed.value.alt}`,
                          ),
                          h(MButton, {
                            'data-viewer-close': '',
                            text: props.closeLabel,
                            variant: 'secondary',
                            onClick: () => request('button'),
                          }),
                        ],
                      ),
                      h(
                        'div',
                        {
                          ref: viewport,
                          tabindex: 0,
                          'aria-label': displayed.value.alt,
                          style: {
                            position: 'relative',
                            minHeight: 0,
                            overflow: 'hidden',
                            touchAction: 'none',
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: '12px',
                          },
                        },
                        [
                          h('img', {
                            key: `${choiceKey(displayed.value.key)}:${displayed.value.src}`,
                            ref: photo,
                            src: displayed.value.src,
                            alt: displayed.value.alt,
                            draggable: false,
                            style: {
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block',
                              minHeight: 0,
                            },
                            onLoad: (event: Event) => {
                              if (event.currentTarget !== photo.value) return
                              loaded.value = true
                              failed.value = false
                              startZoom()
                            },
                            onError: (event: Event) => {
                              if (event.currentTarget !== photo.value) return
                              failed.value = true
                              loaded.value = false
                              if (displayed.value) emit('error', displayed.value)
                            },
                          }),
                          failed.value
                            ? h(
                                'p',
                                { role: 'status', style: { position: 'absolute' } },
                                props.errorLabel,
                              )
                            : null,
                        ],
                      ),
                      h(
                        'div',
                        {
                          style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        },
                        [
                          h(MButton, {
                            icon: 'chevron-left',
                            accessibilityLabel: props.previousLabel,
                            variant: 'secondary',
                            disabled: index <= 0,
                            onClick: () => move(-1),
                          }),
                          h(MButton, {
                            icon: 'zoom-out',
                            accessibilityLabel: props.zoomOutLabel,
                            variant: 'ghost',
                            disabled: !zoomReady.value || scale.value <= 1,
                            onClick: () => zoomBy(-0.5),
                          }),
                          h(MButton, {
                            text: `${Math.round(scale.value * 100)}%`,
                            accessibilityLabel: `${Math.round(scale.value * 100)}% · ${props.resetLabel}`,
                            variant: 'ghost',
                            disabled: !zoomReady.value,
                            onClick: () => zoom?.reset(),
                          }),
                          h(MButton, {
                            icon: 'zoom-in',
                            accessibilityLabel: props.zoomInLabel,
                            variant: 'ghost',
                            disabled: !zoomReady.value || scale.value >= props.maxZoom,
                            onClick: () => zoomBy(0.5),
                          }),
                          h(MButton, {
                            icon: 'chevron-right',
                            accessibilityLabel: props.nextLabel,
                            variant: 'secondary',
                            disabled: index >= props.images.length - 1,
                            onClick: () => move(1),
                          }),
                          displayed.value.caption
                            ? h(
                                'p',
                                {
                                  style: {
                                    flexBasis: '100%',
                                    textAlign: 'center',
                                    margin: 0,
                                    color: theme.value.colors.muted,
                                  },
                                },
                                displayed.value.caption,
                              )
                            : null,
                        ],
                      ),
                    ],
                  ),
                ]
              : [],
          ),
        ],
      )
    }
  },
})
