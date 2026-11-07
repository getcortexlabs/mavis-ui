import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onMounted,
  onActivated,
  onDeactivated,
  onScopeDispose,
  ref,
  shallowRef,
  watch,
  type Component,
} from '@vue/runtime-core'
import { createMotionSurface } from '../experimental.js'
import { componentMotion } from '../motion.js'
import {
  fitImageCrop,
  validateImageCrop,
  moveImageCrop,
  zoomImageCrop,
  cropPresentation,
  type ImageCrop,
  type CropSource,
  type CropExport,
  type CropRotation,
} from '../image-crop.js'
import { imageCropperProps, type AdvancedGesture } from './advanced-props.js'
import type { AdvancedUI } from './advanced-collections.js'
import { useMavisTheme } from './theme.js'
export function createImageCropper(
  ui: AdvancedUI & { CropPreview: Component },
  platform: 'web' | 'native',
  load: (src: string) => Promise<CropSource>,
) {
  return defineComponent({
    name: 'MImageCropper',
    inheritAttrs: false,
    props: imageCropperProps,
    emits: {
      'update:modelValue': (_v: ImageCrop) => true,
      export: (_v: CropExport) => true,
      load: (_v: { width: number; height: number }) => true,
      error: (_v: { stage: 'load' | 'export'; message: string }) => true,
    },
    setup(props, { attrs, emit, expose }) {
      const source = shallowRef<CropSource>(),
        width = ref(320),
        error = ref(''),
        loading = ref(false),
        exporting = ref(false),
        draft = ref<ImageCrop>(),
        surface = markRaw(createMotionSurface()),
        { theme } = useMavisTheme()
      let active = false,
        epoch = 0,
        gestureBase: ImageCrop | undefined,
        gestureWidth = 0
      const effective = computed(() => {
        if (!source.value) return undefined
        const value =
          draft.value ?? props.modelValue ?? fitImageCrop(source.value, props.aspectRatio)
        return validateImageCrop(source.value, value, props.aspectRatio)
      })
      const zoom = computed(() =>
        source.value && effective.value
          ? fitImageCrop(source.value, props.aspectRatio, effective.value.rotation).width /
            effective.value.width
          : 1,
      )
      function fail(stage: 'load' | 'export', failure: unknown) {
        error.value = failure instanceof Error ? failure.message : String(failure)
        emit('error', { stage, message: error.value })
      }
      function discard() {
        epoch++
        source.value?.dispose()
        source.value = undefined
        draft.value = undefined
        gestureBase = undefined
        loading.value = false
        exporting.value = false
      }
      async function fetchSource() {
        discard()
        if (!active || !props.src) return
        const request = epoch
        loading.value = true
        error.value = ''
        try {
          const result = await load(props.src)
          if (!active || request !== epoch) {
            result.dispose()
            return
          }
          if (result.width * result.height > 40000000) {
            result.dispose()
            throw new RangeError('ImageCropper supports decoded images up to 40 megapixels.')
          }
          try {
            validateImageCrop(
              result,
              props.modelValue ?? fitImageCrop(result, props.aspectRatio),
              props.aspectRatio,
            )
          } catch (error) {
            result.dispose()
            throw error
          }
          source.value = markRaw(result)
          emit('load', { width: result.width, height: result.height })
        } catch (e) {
          if (request === epoch) fail('load', e)
        } finally {
          if (request === epoch) loading.value = false
        }
      }
      onMounted(() => {
        active = true
        void fetchSource()
      })
      onActivated(() => {
        if (!active) {
          active = true
          void fetchSource()
        }
      })
      onDeactivated(() => {
        active = false
        discard()
      })
      onScopeDispose(() => {
        active = false
        discard()
      })
      watch(
        () => props.src,
        () => {
          if (active) void fetchSource()
        },
      )
      watch(
        () => [props.disabled, props.modelValue, props.aspectRatio],
        () => {
          draft.value = undefined
          gestureBase = undefined
        },
        { flush: 'sync', deep: true },
      )
      onScopeDispose(
        surface.use((owner) => {
          let initialized = false
          return watch(
            () => [effective.value, width.value, props.animated, draft.value],
            () => {
              const crop = effective.value,
                image = source.value
              if (!crop || !image) return
              const presentation = cropPresentation(image, crop, width.value),
                values = { x: presentation.x, y: presentation.y, rotate: presentation.rotation }
              if (initialized && props.animated && !draft.value)
                owner.animate(values, componentMotion(theme.value, 'selection'))
              else owner.set(values)
              initialized = true
            },
            { immediate: true, flush: 'post' },
          )
        }),
      )
      function choose(value: ImageCrop) {
        if (!props.disabled && source.value) {
          validateImageCrop(source.value, value, props.aspectRatio)
          emit('update:modelValue', value)
        }
      }
      function gesture(event: AdvancedGesture) {
        const image = source.value,
          crop = effective.value
        if (!image || !crop || props.disabled) return
        if (event.phase === 'start') {
          gestureBase = { ...crop }
          gestureWidth = width.value
        }
        if (event.phase === 'move' && gestureBase) {
          const base = gestureBase
          const z = zoomImageCrop(
            image,
            base,
            Math.min(
              8,
              Math.max(
                1,
                (fitImageCrop(image, props.aspectRatio, base.rotation).width / base.width) *
                  event.scale,
              ),
            ),
          )
          draft.value = moveImageCrop(
            image,
            z,
            (-event.x * base.width) / gestureWidth,
            (-event.y * base.width) / gestureWidth,
          )
        }
        if (event.phase === 'end') {
          const value = draft.value
          gestureBase = undefined
          draft.value = undefined
          if (value) choose(value)
        }
        if (event.phase === 'cancel') {
          gestureBase = undefined
          draft.value = undefined
        }
      }
      function pan(x: number, y: number) {
        if (source.value && effective.value)
          choose(
            moveImageCrop(
              source.value,
              effective.value,
              (x * effective.value.width) / 20,
              (y * effective.value.height) / 20,
            ),
          )
      }
      async function exportImage() {
        if (props.disabled || exporting.value || !source.value || !effective.value) return
        const request = epoch,
          image = source.value,
          crop = { ...effective.value }
        exporting.value = true
        error.value = ''
        try {
          const result = await image.export(crop, props.output)
          if (!active || request !== epoch || props.disabled) {
            await result.dispose()
            return
          }
          emit('export', result)
          return result
        } catch (e) {
          if (request === epoch) fail('export', e)
        } finally {
          if (request === epoch) exporting.value = false
        }
      }
      expose({ export: exportImage })
      return () =>
        h(
          ui.Host,
          mergeProps(attrs, {
            id: props.id,
            label: props.label,
            ...(platform === 'web' ? { class: 'm-image-cropper' } : {}),
          }),
          () =>
            h(ui.Column, { gap: 'md' }, () => [
              h(ui.Text, { text: props.label, variant: 'heading' }),
              h(
                ui.Measure,
                {
                  onWidth: (v: number) => {
                    if (v > 0 && Math.abs(width.value - v) > 0.5) {
                      gestureBase = undefined
                      draft.value = undefined
                      width.value = v
                    }
                  },
                },
                () =>
                  h(
                    ui.Gesture,
                    {
                      label: props.moveLabel,
                      disabled: props.disabled || !source.value,
                      onGesture: gesture,
                      onStep: (v: { x: number; y: number }) => pan(-v.x, -v.y),
                    },
                    () =>
                      h(
                        ui.Box,
                        {
                          backgroundColor: '#20232A',
                          radius: 'lg',
                          clipToBounds: true,
                          height: width.value / props.aspectRatio,
                          width: '100%',
                          ...(platform === 'web'
                            ? { style: { overflow: 'hidden', position: 'relative' } }
                            : {}),
                        },
                        () => {
                          const crop = effective.value,
                            image = source.value
                          if (!crop || !image)
                            return [
                              h(ui.Text, {
                                text: loading.value
                                  ? props.loadingLabel
                                  : error.value || props.loadingLabel,
                                tone: 'muted',
                              }),
                            ]
                          const presentation = cropPresentation(image, crop, width.value)
                          return [
                            h(ui.CropPreview, {
                              source: image,
                              width: presentation.width,
                              height: presentation.height,
                              motionSurface: surface,
                            }),
                            h(ui.Box, {
                              width: '100%',
                              height: '100%',
                              borderWidth: 1,
                              borderColor: '#FFFFFF',
                              accessibilityHidden: true,
                              isUserInteractionEnabled: false,
                              ...(platform === 'web'
                                ? {
                                    style: {
                                      position: 'absolute',
                                      inset: 0,
                                      pointerEvents: 'none',
                                      border: '1px solid #FFFFFF',
                                      boxSizing: 'border-box',
                                      backgroundImage:
                                        'linear-gradient(90deg, transparent 33%, #ffffff50 33%, #ffffff50 33.4%, transparent 33.4%, transparent 66%, #ffffff50 66%, #ffffff50 66.4%, transparent 66.4%)',
                                    },
                                  }
                                : {}),
                            }),
                          ]
                        },
                      ),
                  ),
              ),
              error.value
                ? h(ui.Text, {
                    text: error.value,
                    ...(platform === 'web' ? { role: 'alert' } : {}),
                  })
                : null,
              h(ui.Slider, {
                label: props.zoomLabel,
                min: 1,
                max: 8,
                step: 0.1,
                modelValue: zoom.value,
                disabled: props.disabled || !source.value,
                'onUpdate:modelValue': (v: number) => {
                  if (source.value && effective.value)
                    choose(zoomImageCrop(source.value, effective.value, v))
                },
              }),
              h(ui.Row, { gap: 'xs', wrap: true }, () =>
                [
                  [props.leftLabel, -1, 0],
                  [props.rightLabel, 1, 0],
                  [props.upLabel, 0, -1],
                  [props.downLabel, 0, 1],
                ].map(([label, x, y]) =>
                  h(ui.Button, {
                    text: label,
                    variant: 'ghost',
                    size: 'sm',
                    disabled: props.disabled || !source.value,
                    onClick: () => pan(x as number, y as number),
                  }),
                ),
              ),
              h(
                ui.Stack,
                { direction: 'column', responsive: { at: 520, direction: 'row' }, gap: 'sm' },
                () => [
                  h(ui.Button, {
                    text: props.rotateLabel,
                    variant: 'secondary',
                    disabled: props.disabled || !source.value,
                    onClick: () => {
                      if (source.value && effective.value)
                        choose(
                          fitImageCrop(
                            source.value,
                            props.aspectRatio,
                            ((effective.value.rotation + 90) % 360) as CropRotation,
                          ),
                        )
                    },
                  }),
                  h(ui.Button, {
                    text: props.resetLabel,
                    variant: 'ghost',
                    disabled: props.disabled || !source.value,
                    onClick: () => {
                      if (source.value) choose(fitImageCrop(source.value, props.aspectRatio))
                    },
                  }),
                  h(ui.Button, {
                    text: props.exportLabel,
                    loading: exporting.value,
                    disabled: props.disabled || !source.value || exporting.value,
                    onClick: () => void exportImage(),
                  }),
                ],
              ),
            ]),
        )
    },
  })
}
