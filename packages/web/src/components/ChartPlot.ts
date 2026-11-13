import { useMotionContext } from '../motion-context.js'
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  onActivated,
  onDeactivated,
  watch,
  ref,
} from 'vue'
import { chartPlotProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  chartHitTest,
  interpolateChart,
  componentMotion,
  type ChartGeometry,
  type ChartPoint,
} from '@getcortexlabs/mavis-core'

/** SVG is presentation only; the shared selects and data list own assistive interaction. */
export const ChartPlot = defineComponent({
  name: 'MChartPlot',
  props: chartPlotProps,
  emits: {
    select: (_category: number, _series: number) => true,
    preview: (_hit: { category: number; series: number } | null) => true,
  },
  setup(props, { emit }) {
    const { theme } = useMavisTheme()
    const plot = ref<SVGSVGElement>()
    const measuredWidth = ref(600)
    const context = useMotionContext()
    let lease: ReturnType<typeof context.acquire> | undefined
    let progress:
      ReturnType<ReturnType<typeof context.acquire>['runtime']['motionValue']> | undefined
    let off: (() => void) | undefined
    let unfollow: (() => void) | undefined
    let generation = 0
    const settle = () => {
      if (lease && progress) {
        generation++
        lease.runtime.stop(progress)
        lease.runtime.set(progress, 1)
        paint(destination)
      }
    }
    let presentation: ChartGeometry | undefined
    let startGeometry: ChartGeometry | undefined
    let destination = props.geometry
    const marks = new Map<string, SVGElement>()
    const remember = (key: string) => (element: unknown) => {
      if (element) marks.set(key, element as SVGElement)
      else marks.delete(key)
    }
    function paint(geometry: ChartGeometry) {
      presentation = geometry
      const width = measuredWidth.value,
        height = props.height
      const x = (point: ChartPoint) => point.x * width
      const y = (point: ChartPoint) => 8 + point.y * (height - 16)
      const zero = 8 + geometry.zero * (height - 16)
      const count = geometry.series[0]?.points.length ?? 0
      const group = (width / Math.max(1, count)) * 0.7
      const bar = group / Math.max(1, geometry.series.length)
      const write = (key: string, values: Record<string, number | string>) => {
        const element = marks.get(key)
        if (element)
          for (const [name, value] of Object.entries(values))
            element.setAttribute(name, String(value))
      }
      geometry.series.forEach((series, seriesIndex) => {
        let path = '',
          segment = 0
        for (const point of series.points) {
          if (!point) {
            if (path) write(`path:${seriesIndex}:${segment++}`, { d: path })
            path = ''
            continue
          }
          path += `${path ? ' L' : 'M'}${x(point)} ${y(point)}`
          if (props.type === 'bar')
            write(`bar:${seriesIndex}:${point.index}`, {
              x: x(point) - group / 2 + seriesIndex * bar,
              y: Math.min(y(point), zero),
              width: bar * 0.82,
              height: Math.max(1, Math.abs(zero - y(point))),
            })
          else write(`point:${seriesIndex}:${point.index}`, { cx: x(point), cy: y(point) })
        }
        if (path) write(`path:${seriesIndex}:${segment}`, { d: path })
      })
    }
    function update() {
      destination = props.geometry
      if (!lease || !progress) {
        presentation = destination
        return
      }
      startGeometry = presentation
      const token = ++generation
      if (lease.runtime.reducedMotion()) {
        settle()
        return
      }
      lease.runtime.stop(progress)
      lease.runtime.set(progress, 0)
      paint(interpolateChart(startGeometry, destination, 0))
      const playback = lease.runtime.animate(progress, 1, componentMotion(theme.value, 'data'))
      void playback.finished.then((completed) => {
        if (completed && lease && token === generation) paint(destination)
      })
    }
    function connect() {
      if (lease || !plot.value) return
      lease = context.acquire(plot.value.ownerDocument)
      unfollow = lease.runtime.onReducedMotion((reduced) => {
        if (reduced) settle()
      })
      progress = lease.runtime.motionValue(0)
      off = progress.subscribe((value) =>
        paint(interpolateChart(startGeometry, destination, value)),
      )
      update()
    }
    function disconnect() {
      emit('preview', null)
      generation++
      unfollow?.()
      unfollow = undefined
      off?.()
      off = undefined
      progress?.dispose()
      progress = undefined
      lease?.release()
      lease = undefined
      presentation = props.geometry
    }
    watch(() => props.geometry, update, { flush: 'post' })
    watch(
      () => [measuredWidth.value, props.height, props.type, props.selected],
      () => {
        if (presentation) paint(presentation)
      },
      { flush: 'post' },
    )
    onMounted(connect)
    onActivated(connect)
    onDeactivated(disconnect)
    onBeforeUnmount(disconnect)

    let observer: ResizeObserver | undefined
    onMounted(() => {
      const element = plot.value
      if (!element) return
      const measure = () => {
        const width = element.getBoundingClientRect().width
        if (width > 0 && width !== measuredWidth.value) measuredWidth.value = width
      }
      measure()
      observer = new ResizeObserver(measure)
      observer.observe(element)
    })
    onBeforeUnmount(() => observer?.disconnect())
    return () => {
      const width = measuredWidth.value,
        height = props.height
      const x = (point: ChartPoint) => point.x * width
      const y = (point: ChartPoint) => 8 + point.y * (height - 16)
      const zero = 8 + props.geometry.zero * (height - 16)
      const count = props.geometry.series[0]?.points.length ?? 0
      const groupWidth = (width / Math.max(1, count)) * 0.7
      const barWidth = groupWidth / Math.max(1, props.geometry.series.length)
      return h(
        'svg',
        {
          ref: plot,
          class: 'm-chart-plot',
          viewBox: `0 0 ${width} ${height}`,
          preserveAspectRatio: 'none',
          'aria-hidden': 'true',
          focusable: 'false',
          onPointermove: (event: PointerEvent) => {
            if (props.disabled || event.pointerType === 'touch') {
              emit('preview', null)
              return
            }
            const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) {
              emit('preview', null)
              return
            }
            const x = (event.clientX - rect.left) / rect.width
            const y = (((event.clientY - rect.top) / rect.height) * height - 8) / (height - 16)
            emit('preview', chartHitTest(props.geometry, props.type, x, y))
          },
          onPointerleave: () => emit('preview', null),
          onPointercancel: () => emit('preview', null),
          style: { display: 'block', width: '100%', height: `${height}px`, overflow: 'visible' },
        },
        [
          ...props.geometry.ticks.map((_, i) =>
            h('line', {
              key: `grid:${i}`,
              x1: 0,
              x2: width,
              y1: 8 + ((height - 16) * i) / 4,
              y2: 8 + ((height - 16) * i) / 4,
              stroke: theme.value.colors.border,
              'stroke-dasharray': '3 6',
              'vector-effect': 'non-scaling-stroke',
            }),
          ),
          ...props.geometry.series.flatMap((series, seriesIndex) => {
            const color = props.colors[seriesIndex]
            const paths: string[] = []
            let path = ''
            for (const point of series.points) {
              if (!point) {
                if (path) paths.push(path)
                path = ''
              } else path += `${path ? ' L' : 'M'}${x(point)} ${y(point)}`
            }
            if (path) paths.push(path)
            return [
              ...(props.type === 'line'
                ? paths.map((d, i) =>
                    h('path', {
                      key: `path:${seriesIndex}:${i}`,
                      ref: remember(`path:${seriesIndex}:${i}`),
                      d,
                      fill: 'none',
                      stroke: color,
                      'stroke-width': 2.5,
                      'stroke-linecap': 'round',
                      'stroke-linejoin': 'round',
                      'vector-effect': 'non-scaling-stroke',
                    }),
                  )
                : []),
              ...series.points.map((point) => {
                if (!point) return null
                const selected =
                  props.selected?.category === point.index && props.selected.series === seriesIndex
                return props.type === 'bar'
                  ? h('rect', {
                      key: `bar:${seriesIndex}:${point.index}`,
                      ref: remember(`bar:${seriesIndex}:${point.index}`),
                      x: x(point) - groupWidth / 2 + seriesIndex * barWidth,
                      y: Math.min(y(point), zero),
                      width: barWidth * 0.82,
                      height: Math.max(1, Math.abs(zero - y(point))),
                      rx: 3,
                      fill: color,
                      opacity: props.selected && !selected ? 0.45 : 1,
                    })
                  : h('circle', {
                      key: `point:${seriesIndex}:${point.index}`,
                      ref: remember(`point:${seriesIndex}:${point.index}`),
                      cx: x(point),
                      cy: y(point),
                      r: selected ? 5 : 3,
                      fill: color,
                      stroke: theme.value.colors.surface,
                      'stroke-width': 2,
                      'vector-effect': 'non-scaling-stroke',
                    })
              }),
            ]
          }),
          // A full-height hit area works for short and zero-valued bars as well as points.
          ...Array.from({ length: count }, (_, index) =>
            h('rect', {
              key: `hit:${index}`,
              x: (index * width) / count,
              y: 0,
              width: width / count,
              height,
              fill: 'transparent',
              style: { cursor: props.disabled ? undefined : 'pointer' },
              onClick: (event: MouseEvent) => {
                if (props.disabled) return
                const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
                const localX = (index + (event.clientX - rect.left) / rect.width) / count
                const localY =
                  (((event.clientY - rect.top) / rect.height) * height - 8) / (height - 16)
                const hit = chartHitTest(props.geometry, props.type, localX, localY)
                if (hit) emit('select', hit.category, hit.series)
              },
            }),
          ),
        ],
      )
    }
  },
})
