import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  provide,
  ref,
  watch,
} from 'nativescript-vue'
import { isAndroid, type EventData, type Image, type View } from '@nativescript/core'
import { zoomable, type Zoomable } from '@rafaelaugusto/jolt'
import { sharedLayout, type SharedLayout } from '@rafaelaugusto/jolt/shared-layout'
import {
  choiceKey,
  validateViewer,
  type ChoiceValue,
  type ViewerImage,
} from '@getcortexlabs/mavis-core'
import { imageViewerProps, useCachedActivity, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useLayerHost } from '../layers.js'
import { systemBackKey } from '../system-back.js'
import { watchBack, setModal, safeAreaOf, contentInsets } from '../../native/sheet'
import { notifyAccessibilityLayout } from '../../native/accessibility-layout'
import { MColumn, MRow } from './layout.js'
import { MButton } from './MButton.js'
import { MText } from './MText.js'

export const MImageViewer = defineComponent({
  name: 'MImageViewer',
  inheritAttrs: false,
  props: imageViewerProps,
  emits: {
    'update:modelValue': (_key: ChoiceValue) => true,
    'update:open': (_open: boolean) => true,
    close: (_reason: 'button' | 'back' | 'gesture') => true,
    error: (_image: ViewerImage) => true,
  },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const activity = useCachedActivity()
    const host = useLayerHost('MImageViewer')
    const claimBack = inject(systemBackKey, undefined)
    const provides = (getCurrentInstance() as unknown as { provides: Record<PropertyKey, unknown> })
      .provides
    const selected = computed(() => {
      validateViewer(props.images)
      return props.images.find((image) => image.key === props.modelValue) ?? props.images[0]
    })
    const requested = computed(
      () => props.open && !props.disabled && activity.value && !!selected.value,
    )
    const presented = ref(false),
      displayed = ref<ViewerImage>(),
      scale = ref(1),
      ready = ref(false),
      failed = ref(false)
    const thumbs = new Map<string, Image>()
    let viewport: View | undefined,
      photo: Image | undefined,
      panel: View | undefined,
      opener: View | undefined
    let shared: SharedLayout | undefined, zoom: Zoomable | undefined
    let detachPhoto = () => {},
      offBack = () => {},
      releaseClaim = () => {}
    let generation = 0,
      flying = false,
      pendingClose = false,
      disposed = false
    function attachImage(image: Image | undefined) {
      detachPhoto()
      detachPhoto = () => {}
      if (image?.isLoaded && shared)
        detachPhoto = shared.attach(image, 'photo', { content: 'image', radius: 12 })
    }
    function releaseZoom() {
      zoom?.dispose()
      zoom = undefined
      ready.value = false
      scale.value = 1
    }
    async function refreshZoomReady() {
      // Android can decode the image after the first layout. Jolt creates its
      // native driver in a microtask after that source/layout notification.
      await nextTick()
      await Promise.resolve()
      ready.value = !!zoom?.ready
    }
    function startZoom() {
      if (
        disposed ||
        !requested.value ||
        !photo?.isLoaded ||
        !photo.imageSource ||
        !viewport?.isLoaded ||
        flying ||
        zoom
      )
        return
      zoom = zoomable(photo, {
        viewport,
        scale: [1, props.maxZoom],
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
      void refreshZoomReady()
    }
    function releaseBack() {
      offBack()
      releaseClaim()
      offBack = releaseClaim = () => {}
    }
    function focus(view: View | undefined) {
      if (!view?.isLoaded) return
      view.focus()
      if (isAndroid) view.android?.performAccessibilityAction(64, null)
      else notifyAccessibilityLayout(view)
    }
    function finishClose() {
      if (requested.value || !presented.value) {
        pendingClose = false
        return
      }
      pendingClose = false
      releaseZoom()
      releaseBack()
      const token = ++generation
      const thumb = displayed.value ? thumbs.get(choiceKey(displayed.value.key)) : undefined
      const change = () => {
        if (panel) setModal(panel, false)
        presented.value = false
        attachImage(thumb)
      }
      const flight = shared?.transition(change)
      if (!flight) change()
      void (flight?.finished ?? nextTick()).then(() => {
        if (!disposed && token === generation && !requested.value)
          focus(opener?.isLoaded ? opener : (thumb?.parent as View | undefined))
      })
    }
    function sync() {
      if (disposed) return
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
          ready.value = failed.value = false
          displayed.value = selected.value
        }
        return
      }
      const thumb = selected.value ? thumbs.get(choiceKey(selected.value.key)) : undefined
      if (!thumb?.isLoaded) return
      if (!shared && thumb.page?.content)
        shared = sharedLayout(thumb.page.content, {
          transition: { type: 'spring', duration: 460, bounce: 0.06 },
        })
      opener = thumb.parent as View | undefined
      attachImage(thumb)
      displayed.value = selected.value
      ready.value = failed.value = false
      const token = ++generation
      flying = true
      const change = () => {
        presented.value = true
      }
      const flight = shared?.transition(change)
      if (!flight) change()
      offBack = watchBack((event) => {
        if (presented.value) {
          event.cancel = true
          request('back')
        }
      })
      releaseClaim =
        claimBack?.({ owns: () => presented.value, back: () => request('back') }) ?? (() => {})
      void (flight?.finished ?? nextTick()).then(() => {
        if (token === generation && !disposed) {
          flying = false
          startZoom()
        }
      })
    }
    function request(reason: 'button' | 'back' | 'gesture') {
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
    const Layer = defineComponent({
      name: 'MImageViewerLayer',
      setup() {
        const seen = new Set<PropertyKey>()
        for (
          let source: object | null = provides;
          source && source !== Object.prototype;
          source = Object.getPrototypeOf(source)
        ) {
          for (const key of Reflect.ownKeys(source)) {
            if (!seen.has(key)) {
              seen.add(key)
              provide(key as string | symbol, (source as Record<PropertyKey, unknown>)[key])
            }
          }
        }
        const insets = ref({ top: 16, right: 16, bottom: 16, left: 16 })
        return () => {
          const image = displayed.value
          if (!image) return null
          const index = props.images.findIndex((entry) => entry.key === image.key)
          return h(
            'GridLayout',
            {
              rows: 'auto,*,auto',
              backgroundColor: theme.value.colors.background,
              paddingTop: insets.value.top,
              paddingRight: insets.value.right,
              paddingBottom: insets.value.bottom,
              paddingLeft: insets.value.left,
              accessibilityLabel: props.label,
              onLoaded: (event: EventData) => {
                panel = event.object as View
                const safe = safeAreaOf(panel),
                  content = contentInsets(panel)
                insets.value = {
                  top: Math.max(16, safe.top),
                  right: Math.max(16, content.right),
                  bottom: Math.max(16, content.bottom, safe.bottom),
                  left: Math.max(16, content.left),
                }
                setModal(panel, true)
                focus(panel)
              },
              onUnloaded: () => {
                if (panel) setModal(panel, false)
                panel = undefined
                releaseZoom()
              },
            },
            [
              h(
                MRow,
                { row: 0, justify: 'between', gap: 'md', paddingBottom: theme.value.space.sm },
                () => [
                  h(MText, {
                    text: `${index + 1} / ${props.images.length} · ${image.alt}`,
                    shrink: 1,
                    accessibilityLiveRegion: 'polite',
                  }),
                  h(MButton, {
                    text: props.closeLabel,
                    variant: 'secondary',
                    onClick: () => request('button'),
                  }),
                ],
              ),
              h(
                'GridLayout',
                {
                  row: 1,
                  clipToBounds: true,
                  borderRadius: 12,
                  onLoaded: (event: EventData) => {
                    viewport = event.object as View
                    startZoom()
                  },
                  onUnloaded: () => {
                    viewport = undefined
                    releaseZoom()
                  },
                },
                [
                  h('Image', {
                    key: `${choiceKey(image.key)}:${image.src}`,
                    src: image.src,
                    stretch: 'aspectFit',
                    accessibilityLabel: image.alt,
                    onLoaded: (event: EventData) => {
                      photo = event.object as Image
                      attachImage(photo)
                      startZoom()
                    },
                    onLayoutChanged: () => {
                      startZoom()
                      void refreshZoomReady()
                    },
                    onImageSourceChange: () => {
                      if (photo?.imageSource) {
                        failed.value = false
                        startZoom()
                        void refreshZoomReady()
                      }
                    },
                    onIsLoadingChange: () => {
                      if (photo?.isLoaded && !photo.isLoading && !photo.imageSource) {
                        failed.value = true
                        emit('error', image)
                      }
                    },
                    onUnloaded: () => {
                      releaseZoom()
                      photo = undefined
                    },
                  }),
                  failed.value
                    ? h(MText, {
                        text: props.errorLabel,
                        align: 'center',
                        verticalAlignment: 'middle',
                      })
                    : null,
                ],
              ),
              h(MColumn, { row: 2, gap: 'sm', paddingTop: theme.value.space.md }, () => [
                h(MRow, { gap: 'xs', justify: 'center', wrap: true }, () => [
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
                    disabled: !ready.value || scale.value <= 1,
                    onClick: () => zoomBy(-0.5),
                  }),
                  h(MButton, {
                    text: `${Math.round(scale.value * 100)}%`,
                    accessibilityLabel: `${Math.round(scale.value * 100)}% · ${props.resetLabel}`,
                    variant: 'ghost',
                    disabled: !ready.value,
                    onClick: () => zoom?.reset(),
                  }),
                  h(MButton, {
                    icon: 'zoom-in',
                    accessibilityLabel: props.zoomInLabel,
                    variant: 'ghost',
                    disabled: !ready.value || scale.value >= props.maxZoom,
                    onClick: () => zoomBy(0.5),
                  }),
                  h(MButton, {
                    icon: 'chevron-right',
                    accessibilityLabel: props.nextLabel,
                    variant: 'secondary',
                    disabled: index >= props.images.length - 1,
                    onClick: () => move(1),
                  }),
                ]),
                image.caption
                  ? h(MText, {
                      text: image.caption,
                      variant: 'caption',
                      tone: 'muted',
                      align: 'center',
                    })
                  : null,
              ]),
            ],
          )
        }
      },
    })
    const remove = host.add({ component: Layer, props: {}, presented })
    watch([requested, selected], sync, { flush: 'post' })
    watch(
      () => props.maxZoom,
      () => {
        releaseZoom()
        startZoom()
      },
    )
    watch(activity, (enabled) => {
      if (!enabled) {
        ++generation
        releaseZoom()
        shared?.cancel()
        presented.value = false
        releaseBack()
      } else sync()
    })
    onBeforeUnmount(() => {
      disposed = true
      ++generation
      releaseZoom()
      releaseBack()
      detachPhoto()
      shared?.dispose()
      remove()
    })
    return () => {
      if (!Number.isFinite(props.maxZoom) || props.maxZoom < 1)
        throw new RangeError('maxZoom must be at least 1.')
      validateViewer(props.images)
      return h(MRow, mergeProps(attrs, { gap: 'md', wrap: true }), () =>
        props.images.map((image) =>
          h(
            'StackLayout',
            {
              key: choiceKey(image.key),
              width: 152,
              marginBottom: 12,
              borderRadius: 14,
              clipToBounds: true,
              backgroundColor: theme.value.colors.surface,
              accessible: true,
              accessibilityRole: 'button',
              accessibilityLabel: image.alt,
              isEnabled: !props.disabled,
              onTap: () => {
                if (!props.disabled) {
                  emit('update:modelValue', image.key)
                  emit('update:open', true)
                }
              },
            },
            [
              h('Image', {
                src: image.thumbnail ?? image.src,
                height: 152 / (image.aspectRatio ?? 1.5),
                stretch: 'aspectFill',
                accessibilityHidden: true,
                onLoaded: (event: EventData) => {
                  thumbs.set(choiceKey(image.key), event.object as Image)
                  void nextTick(sync)
                },
                onUnloaded: () => {
                  thumbs.delete(choiceKey(image.key))
                  if (!thumbs.size) {
                    releaseZoom()
                    shared?.dispose()
                    shared = undefined
                  }
                },
              }),
              h(MText, {
                text: image.alt,
                variant: 'caption',
                padding: theme.value.space.sm,
                accessibilityHidden: true,
              }),
            ],
          ),
        ),
      )
    }
  },
})
