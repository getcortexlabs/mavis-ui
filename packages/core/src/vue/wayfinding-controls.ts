import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  onScopeDispose,
  ref,
  watch,
  type Component,
  type PropType,
} from '@vue/runtime-core'
import { choiceKey } from '../choice.js'
import {
  breadcrumbParts,
  validateRail,
  validateTimeline,
  type TimelineItem,
} from '../wayfinding.js'
import { createMotionSurface } from '../experimental.js'
import { breadcrumbProps, navigationRailProps, timelineProps } from './wayfinding-props.js'
import { useMavisTheme } from './theme.js'

interface Primitives {
  focus(component: unknown): void
  Row: Component
  Column: Component
  Box: Component
  Text: Component
  Button: Component
  Link: Component
  Icon: Component
  Badge: Component
  Separator: Component
}
export function createWayfindingControls(ui: Primitives, platform: 'web' | 'native') {
  const web = platform === 'web'
  const Signal = defineComponent({
    props: { active: Boolean, color: String, size: { type: Number, default: 8 } },
    setup(props) {
      const { theme } = useMavisTheme()
      const motion = markRaw(createMotionSurface())
      const play = () => {
        if (motion.available)
          motion.animate(
            { scale: props.active ? [0.7, 1] : 1, opacity: props.active ? 1 : 0.45 },
            { type: 'spring', duration: theme.value.motion.enterDuration, bounce: 0.15 },
          )
      }
      onScopeDispose(motion.use(play))
      watch(() => props.active, play)
      return () =>
        h(ui.Box, {
          width: props.size,
          height: props.size,
          radius: 'full',
          backgroundColor: props.color,
          motionSurface: motion,
          accessibilityHidden: true,
        })
    },
  })
  const MNavigationRail = defineComponent({
    name: 'MNavigationRail',
    inheritAttrs: false,
    props: navigationRailProps,
    emits: { 'update:collapsed': (_collapsed: boolean) => true, error: (_error: unknown) => true },
    setup(props, { attrs, slots, emit }) {
      const { theme } = useMavisTheme()
      return () => {
        validateRail(props.groups)
        if (!props.label.trim()) throw new TypeError('Navigation rail requires a label.')
        return h(
          ui.Column,
          mergeProps(
            {
              id: props.id,
              gap: 'lg',
              padding: 'sm',
              radius: 'lg',
              width: props.collapsed ? 80 : 256,
              backgroundColor: theme.value.colors.surface,
            },
            attrs,
            web
              ? {
                  class: 'm-navigation-rail',
                  role: 'navigation',
                  'aria-label': props.label,
                  style: { maxWidth: '100%', border: `1px solid ${theme.value.colors.border}` },
                }
              : {
                  accessibilityLabel: props.label,
                  borderWidth: 1,
                  borderColor: theme.value.colors.border,
                },
          ),
          () => [
            slots.header?.({ collapsed: props.collapsed }),
            ...props.groups.map((group) =>
              h(
                ui.Column,
                {
                  key: group.key,
                  gap: 'xs',
                  ...(web ? { role: 'group', 'aria-label': group.label } : {}),
                },
                () => [
                  props.collapsed
                    ? h(ui.Separator, { accessibilityHidden: true })
                    : h(ui.Text, {
                        text: group.label,
                        variant: 'overline',
                        tone: 'muted',
                        paddingX: 'sm',
                      }),
                  ...group.items.map((item) => {
                    const current = item.value === props.modelValue
                    const badge = item.badge === undefined ? '' : ` ${item.badge}`
                    return h(
                      ui.Button,
                      {
                        key: choiceKey(item.value),
                        text: props.collapsed ? undefined : item.label,
                        icon: item.icon ?? (props.collapsed ? 'circle' : undefined),
                        href: item.href,
                        navigate: item.navigate,
                        disabled: props.disabled || item.disabled,
                        variant: current ? 'secondary' : 'ghost',
                        accessibilityLabel: `${item.label}${badge}${current && !web ? `. ${props.currentLabel}` : ''}`,
                        ...(web
                          ? {
                              'aria-current': current ? 'page' : undefined,
                              title: props.collapsed ? `${item.label}${badge}` : undefined,
                              style: {
                                justifyContent: props.collapsed ? 'center' : 'flex-start',
                                minWidth: 0,
                              },
                            }
                          : {}),
                        onError: (error: unknown) => emit('error', error),
                      },
                      {
                        leading: !props.collapsed
                          ? () =>
                              h(ui.Row, { gap: 'sm' }, () => [
                                h(Signal, {
                                  active: current,
                                  color: current
                                    ? theme.value.colors.primary
                                    : theme.value.colors.border,
                                  size: 6,
                                }),
                                item.icon ? h(ui.Icon, { name: item.icon, size: 18 }) : null,
                              ])
                          : undefined,
                        trailing:
                          !props.collapsed && item.badge !== undefined
                            ? () => [
                                web ? ' ' : null,
                                h(ui.Badge, {
                                  text: String(item.badge),
                                  tone: current ? 'primary' : 'neutral',
                                  accessibilityHidden: true,
                                }),
                              ]
                            : undefined,
                      },
                    )
                  }),
                ],
              ),
            ),
            slots.footer?.({ collapsed: props.collapsed }),
            props.collapsible
              ? h(ui.Button, {
                  text: props.collapsed ? undefined : props.collapseLabel,
                  icon: props.collapsed ? 'panel-left-open' : 'panel-left-close',
                  accessibilityLabel: props.collapsed ? props.expandLabel : props.collapseLabel,
                  variant: 'ghost',
                  disabled: props.disabled,
                  ...(web ? { 'aria-expanded': !props.collapsed } : {}),
                  onClick: () => emit('update:collapsed', !props.collapsed),
                })
              : null,
          ],
        )
      }
    },
  })
  const MBreadcrumb = defineComponent({
    name: 'MBreadcrumb',
    inheritAttrs: false,
    props: breadcrumbProps,
    emits: { error: (_error: unknown) => true },
    setup(props, { attrs, emit }) {
      const expanded = ref(false)
      const links = new Map<string, unknown>()
      watch(
        () => props.items.map((item) => choiceKey(item.key)).join('|'),
        () => {
          expanded.value = false
        },
      )
      return () => {
        if (!props.label.trim()) throw new TypeError('Breadcrumb requires a label.')
        const parts = breadcrumbParts(props.items, props.maxItems)
        const entries =
          expanded.value || !parts.hidden.length
            ? props.items
            : [...parts.before, null, ...parts.after]
        return h(
          ui.Row,
          mergeProps(
            { id: props.id, gap: 'xs', wrap: true },
            attrs,
            web
              ? { class: 'm-breadcrumb', role: 'navigation', 'aria-label': props.label }
              : { accessibilityLabel: props.label },
          ),
          () =>
            entries.flatMap((item, index) => [
              index
                ? h(ui.Icon, {
                    key: `separator:${index}`,
                    name: 'chevron-right',
                    size: 14,
                    tone: 'muted',
                    accessibilityHidden: true,
                  })
                : null,
              item === null
                ? h(ui.Button, {
                    key: 'expand',
                    icon: 'ellipsis',
                    accessibilityLabel: props.expandLabel,
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                      expanded.value = true
                      const first = parts.hidden[0]
                      if (first) void nextTick(() => ui.focus(links.get(choiceKey(first.key))))
                    },
                  })
                : item === props.items[props.items.length - 1]
                  ? h(ui.Text, {
                      key: choiceKey(item.key),
                      text: item.label,
                      weight: '600',
                      shrink: 1,
                      ...(web ? { 'aria-current': 'page' } : {}),
                    })
                  : h(ui.Link, {
                      ref: (value: unknown) => {
                        if (value) links.set(choiceKey(item.key), value)
                        else links.delete(choiceKey(item.key))
                      },
                      key: choiceKey(item.key),
                      text: item.label,
                      href: item.href,
                      navigate: item.navigate,
                      shrink: 1,
                      onError: (error: unknown) => emit('error', error),
                    }),
            ]),
        )
      }
    },
  })
  const Entry = defineComponent({
    props: {
      item: { type: Object as PropType<TimelineItem>, required: true },
      last: Boolean,
      statusText: String,
    },
    setup(props, { slots }) {
      const { theme } = useMavisTheme()
      const status = computed(() => props.item.status ?? 'complete')
      const color = computed(() =>
        status.value === 'error'
          ? theme.value.colors.danger
          : status.value === 'upcoming'
            ? theme.value.colors.muted
            : theme.value.colors.primary,
      )
      const motion = markRaw(createMotionSurface())
      onScopeDispose(
        motion.use((owner) => {
          owner.animate(
            { y: [10, 0] },
            { type: 'spring', duration: theme.value.motion.enterDuration, bounce: 0.1 },
          )
        }),
      )
      return () =>
        h(
          ui.Box,
          {
            motionSurface: motion,
            ...(web ? { role: 'listitem', class: 'm-timeline-entry' } : {}),
          },
          () =>
            h(ui.Row, { gap: 'md', align: 'stretch' }, () => [
              h(
                ui.Column,
                { width: 32, align: 'center', gap: 'xs', shrink: 0, accessibilityHidden: true },
                () => [
                  h(
                    ui.Box,
                    {
                      width: 32,
                      height: 32,
                      radius: 'full',
                      backgroundColor:
                        status.value === 'upcoming'
                          ? theme.value.colors.surface
                          : theme.value.colors.primarySoft,
                    },
                    () =>
                      h(ui.Row, { justify: 'center', height: 32 }, () =>
                        h(ui.Icon, {
                          name:
                            props.item.icon ??
                            (status.value === 'complete'
                              ? 'check'
                              : status.value === 'error'
                                ? 'circle-alert'
                                : 'circle-dot'),
                          size: 16,
                          tone:
                            status.value === 'error'
                              ? 'danger'
                              : status.value === 'upcoming'
                                ? 'muted'
                                : 'primary',
                        }),
                      ),
                  ),
                  !props.last
                    ? h(ui.Box, {
                        width: 2,
                        grow: 1,
                        backgroundColor: theme.value.colors.border,
                        height: 24,
                      })
                    : null,
                ],
              ),
              h(ui.Column, { grow: 1, shrink: 1, gap: 'sm', paddingY: 'xs' }, () => [
                h(ui.Row, { gap: 'sm', wrap: true, justify: 'between' }, () => [
                  h(ui.Text, { text: props.item.title, weight: '600', shrink: 1 }),
                  props.item.time
                    ? h(ui.Text, { text: props.item.time, variant: 'caption', tone: 'muted' })
                    : null,
                ]),
                h(ui.Row, { gap: 'xs' }, () => [
                  h(Signal, { color: color.value, active: status.value === 'current', size: 6 }),
                  h(ui.Text, {
                    text: props.statusText,
                    variant: 'caption',
                    tone: status.value === 'error' ? 'danger' : 'muted',
                  }),
                ]),
                props.item.description
                  ? h(ui.Text, { text: props.item.description, tone: 'muted' })
                  : null,
                slots.default?.(),
                !props.last ? h(ui.Box, { height: 16, accessibilityHidden: true }) : null,
              ]),
            ]),
        )
    },
  })
  const MTimeline = defineComponent({
    name: 'MTimeline',
    inheritAttrs: false,
    props: timelineProps,
    setup(props, { attrs, slots }) {
      return () => {
        validateTimeline(props.items)
        if (!props.label.trim()) throw new TypeError('Timeline requires a label.')
        return h(
          ui.Column,
          mergeProps(
            { id: props.id, gap: 'none' },
            attrs,
            web
              ? { class: 'm-timeline', role: 'list', 'aria-label': props.label }
              : { accessibilityLabel: props.label },
          ),
          () =>
            props.items.length
              ? props.items.map((item, index) =>
                  h(
                    Entry,
                    {
                      key: choiceKey(item.key),
                      item,
                      last: index === props.items.length - 1,
                      statusText: props.statusLabels[item.status ?? 'complete'],
                    },
                    () => slots.default?.({ item, index }),
                  ),
                )
              : h(ui.Text, { text: props.emptyLabel, tone: 'muted' }),
        )
      }
    },
  })
  return { MNavigationRail, MBreadcrumb, MTimeline }
}
