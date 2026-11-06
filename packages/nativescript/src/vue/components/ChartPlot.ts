import {
  animate,
  motionValue,
  set,
  stop,
  onReducedMotion,
  reducedMotion,
  type MotionValue,
} from '@rafaelaugusto/jolt'
import { defineComponent, h, ref, watch, nextTick, onBeforeUnmount } from 'nativescript-vue'
import type { EventData, TapGestureEventData, View } from '@nativescript/core'
import { chartPlotProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  chartHitTest,
  interpolateChart,
  componentMotion,
  type ChartGeometry,
  type ChartPoint,
} from '@getcortexlabs/mavis-core'

/** Bounded native geometry, without a WebView or a second animation scheduler. */
export const ChartPlot = defineComponent({
  name: 'MChartPlot',
  props: chartPlotProps,
  emits: { select: (_category: number, _series: number) => true },
  setup(props, { emit }) {
    const { theme } = useMavisTheme()
    const width = ref(0)
    let progress: MotionValue | undefined
    let playback: ReturnType<typeof animate> | undefined
    let off: (() => void) | undefined
    let releaseReduced: (() => void) | undefined
    let generation = 0
    let loaded = false
    const settle = () => {
      if (reducedMotion() && progress) {
        generation++
        stop(progress)
        set(progress, 1)
        paint(destination)
      }
    }
    let presentation: ChartGeometry | undefined
    let origin: ChartGeometry | undefined
    let destination = props.geometry
    const marks = new Map<string, View>()
    function paint(geometry: ChartGeometry) {
      presentation = geometry
      const height = props.height
      const x = (point: ChartPoint) => point.x * width.value
      const y = (point: ChartPoint) => 8 + point.y * (height - 16)
      const zero = 8 + geometry.zero * (height - 16)
      const group = (width.value / Math.max(1, geometry.series[0]?.points.length ?? 0)) * 0.7
      const bar = group / Math.max(1, geometry.series.length)
      const write = (key: string, values: Record<string, number>) => {
        const view = marks.get(key)
        if (view?.isLoaded) Object.assign(view, values)
      }
      geometry.series.forEach((series, seriesIndex) =>
        series.points.forEach((point, index) => {
          if (!point) return
          if (props.type === 'bar')
            write(`bar:${seriesIndex}:${index}`, {
              left: x(point) - group / 2 + seriesIndex * bar,
              top: Math.min(y(point), zero),
              width: Math.max(1, bar * 0.82),
              height: Math.max(1, Math.abs(zero - y(point))),
            })
          else {
            const radius =
              props.selected?.category === index && props.selected.series === seriesIndex ? 5 : 3
            write(`point:${seriesIndex}:${index}`, {
              left: x(point) - radius,
              top: y(point) - radius,
            })
            const previous = series.points[index - 1]
            if (previous) {
              const dx = x(point) - x(previous),
                dy = y(point) - y(previous)
              const length = Math.hypot(dx, dy)
              write(`line:${seriesIndex}:${index}`, {
                left: (x(point) + x(previous)) / 2 - length / 2,
                top: (y(point) + y(previous)) / 2 - 1.25,
                width: length,
                rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
              })
            }
          }
        }),
      )
    }
    function update() {
      destination = props.geometry
      if (!progress) {
        presentation = destination
        return
      }
      origin = presentation
      const token = ++generation
      if (reducedMotion()) {
        settle()
        return
      }
      playback?.stop()
      set(progress, 0)
      paint(interpolateChart(origin, destination, 0))
      const current = animate(progress, 1, componentMotion(theme.value, 'data'))
      playback = current
      void current.finished.then((completed) => {
        if (completed && playback === current && progress && token === generation)
          paint(destination)
      })
    }
    function connect() {
      if (progress) return
      progress = motionValue(0)
      releaseReduced = onReducedMotion(settle)
      off = progress.subscribe((value) => paint(interpolateChart(origin, destination, value)), {
        immediate: false,
      })
      update()
    }
    function disconnect() {
      generation++
      releaseReduced?.()
      releaseReduced = undefined
      off?.()
      off = undefined
      playback?.stop()
      playback = undefined
      if (progress) stop(progress)
      progress = undefined
      presentation = props.geometry
    }
    watch(() => props.geometry, update, { flush: 'post' })
    watch(
      () => [props.height, props.type, props.selected],
      () => {
        if (presentation) paint(presentation)
      },
      { flush: 'post' },
    )
    onBeforeUnmount(() => {
      loaded = false
      disconnect()
    })

    return () => {
      const height = props.height
      const x = (point: ChartPoint) => point.x * width.value
      const y = (point: ChartPoint) => 8 + point.y * (height - 16)
      const zero = 8 + props.geometry.zero * (height - 16)
      const count = props.geometry.series[0]?.points.length ?? 0
      const groupWidth = (width.value / Math.max(1, count)) * 0.7
      const barWidth = groupWidth / Math.max(1, props.geometry.series.length)
      const shape = (key: string, values: Record<string, unknown>) =>
        h('ContentView', {
          key,
          accessibilityHidden: true,
          isUserInteractionEnabled: false,
          ...values,
          onLoaded: (event: EventData) => {
            marks.set(key, event.object as View)
          },
          onUnloaded: () => marks.delete(key),
        })
      return h(
        'AbsoluteLayout',
        {
          class: 'm-chart-plot',
          onLoaded: () => {
            loaded = true
            void nextTick(() => {
              if (loaded) connect()
            })
          },
          onUnloaded: () => {
            loaded = false
            disconnect()
          },
          height,
          accessibilityHidden: true,
          onLayoutChanged: (event: EventData) => {
            const size = (event.object as View).getActualSize()
            if (width.value !== size.width) {
              width.value = size.width
              void nextTick(() => {
                if (presentation) paint(presentation)
              })
            }
          },
          onTap: (event: TapGestureEventData) => {
            if (props.disabled || !width.value || !count) return
            const hit = chartHitTest(
              props.geometry,
              props.type,
              event.getX() / width.value,
              (event.getY() - 8) / (height - 16),
            )
            if (hit) emit('select', hit.category, hit.series)
          },
        },
        width.value <= 0
          ? []
          : [
              ...props.geometry.ticks.map((_, i) =>
                shape(`grid:${i}`, {
                  left: 0,
                  top: 8 + ((height - 16) * i) / 4,
                  width: width.value,
                  height: 1,
                  backgroundColor: theme.value.colors.border,
                }),
              ),
              ...props.geometry.series.flatMap((series, seriesIndex) =>
                series.points.flatMap((point, index) => {
                  if (!point) return []
                  const color = props.colors[seriesIndex]
                  const selected =
                    props.selected?.category === index && props.selected.series === seriesIndex
                  const previous = series.points[index - 1]
                  const line =
                    props.type === 'line' && previous
                      ? (() => {
                          const dx = x(point) - x(previous),
                            dy = y(point) - y(previous)
                          const length = Math.hypot(dx, dy)
                          return shape(`line:${seriesIndex}:${index}`, {
                            left: (x(point) + x(previous)) / 2 - length / 2,
                            top: (y(point) + y(previous)) / 2 - 1.25,
                            width: length,
                            height: 2.5,
                            rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
                            backgroundColor: color,
                            borderRadius: 1.25,
                          })
                        })()
                      : null
                  const radius = selected ? 5 : 3
                  return [
                    line,
                    props.type === 'bar'
                      ? shape(`bar:${seriesIndex}:${index}`, {
                          left: x(point) - groupWidth / 2 + seriesIndex * barWidth,
                          top: Math.min(y(point), zero),
                          width: Math.max(1, barWidth * 0.82),
                          height: Math.max(1, Math.abs(zero - y(point))),
                          borderRadius: 3,
                          backgroundColor: color,
                          opacity: props.selected && !selected ? 0.45 : 1,
                        })
                      : shape(`point:${seriesIndex}:${index}`, {
                          left: x(point) - radius,
                          top: y(point) - radius,
                          width: radius * 2,
                          height: radius * 2,
                          borderRadius: radius,
                          backgroundColor: color,
                        }),
                  ]
                }),
              ),
            ],
      )
    }
  },
})
