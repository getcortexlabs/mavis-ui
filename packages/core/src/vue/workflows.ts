import { useComponentLayout, useComponentContent } from './component-motion.js'
import {
  defineComponent,
  h,
  mergeProps,
  shallowRef,
  watch,
  onScopeDispose,
  onBeforeUpdate,
  onUpdated,
  nextTick,
  useId,
  type Component,
} from '@vue/runtime-core'
import { choiceKey, type ChoiceValue } from '../choice.js'
import { pagination, validateSteps } from '../navigation.js'
import { formErrorsProps, formGroupProps, stepsProps, paginationProps } from './workflow-props.js'
import { useMavisTheme } from './theme.js'

interface Primitives {
  Column: Component
  Row: Component
  Text: Component
  Button: Component
  preserveFocus?: (root: unknown, currentId: string) => () => void
}

/** Composed controls share behavior; each supplied primitive owns its platform rendering. */
export function createWorkflows(ui: Primitives, platform: 'web' | 'native') {
  const MFormGroup = defineComponent({
    name: 'MFormGroup',
    inheritAttrs: false,
    props: formGroupProps,
    setup(props, { attrs, slots }) {
      const generatedId = `m-form-group-${useId()}`
      const layout = useComponentLayout(() => props.description, false)
      return () => {
        if (!props.label.trim()) throw new TypeError('Form groups require a visible label.')
        const id = props.id ?? generatedId
        return h(
          ui.Column,
          mergeProps(
            { gap: 'md', id, motionRegion: layout },
            attrs,
            platform === 'web'
              ? {
                  role: 'group',
                  'aria-labelledby': `${id}-label`,
                  'aria-describedby': props.description ? `${id}-description` : undefined,
                }
              : {},
          ),
          () => [
            h(ui.Text, { id: `${id}-label`, as: 'h2', variant: 'heading', text: props.label }),
            props.description
              ? h(ui.Text, { id: `${id}-description`, tone: 'muted', text: props.description })
              : null,
            slots.default?.(),
          ],
        )
      }
    },
  })
  const MFormErrors = defineComponent({
    name: 'MFormErrors',
    inheritAttrs: false,
    props: formErrorsProps,
    emits: { focus: (_field: string, _focused: boolean) => true },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme()
      const id = `m-form-errors-${useId()}`
      const revision = shallowRef(0)
      const layout = useComponentLayout(() => revision.value)
      const arrival = useComponentContent(undefined, true)
      let release: (() => void) | undefined
      watch(
        () => props.form,
        (form) => {
          release?.()
          release = form.subscribe(() => {
            revision.value++
          })
          revision.value++
        },
        { immediate: true },
      )
      onScopeDispose(() => release?.())
      return () => {
        void revision.value
        const { errors } = props.form.state
        if (!errors.length) return null
        return h(
          ui.Column,
          mergeProps(
            {
              gap: 'sm',
              padding: 'md',
              radius: 'md',
              backgroundColor: theme.value.colors.surface,
              motionRegion: layout,
              motionSurface: arrival,
            },
            attrs,
            platform === 'web'
              ? { role: props.announce ? 'alert' : 'region', 'aria-labelledby': id }
              : {},
          ),
          () => [
            h(ui.Text, { id, as: 'h2', variant: 'heading', tone: 'danger', text: props.title }),
            ...errors.map((error, index) =>
              h(ui.Button, {
                key: `${error.field}:${index}`,
                variant: 'ghost',
                disabled: !props.form.has(error.field),
                text: props.form.label(error.field)
                  ? `${props.form.label(error.field)}: ${error.message}`
                  : error.message,
                onClick: async () => {
                  emit('focus', error.field, await props.form.focusError(error.field))
                },
              }),
            ),
          ],
        )
      }
    },
  })
  const MSteps = defineComponent({
    name: 'MSteps',
    inheritAttrs: false,
    props: stepsProps,
    emits: { 'update:modelValue': (_value: ChoiceValue) => true },
    setup(props, { attrs, emit }) {
      const layout = useComponentLayout(() => [props.steps, props.modelValue])
      return () => {
        if (!props.label.trim()) throw new TypeError('Steps require a navigation label.')
        validateSteps(props.steps, props.modelValue)
        return h(
          ui.Row,
          mergeProps(
            { gap: 'sm', wrap: true, motionRegion: layout },
            attrs,
            platform === 'web' ? { role: 'navigation', 'aria-label': props.label } : {},
          ),
          () =>
            props.steps.map((step, index) => {
              const current = step.value === props.modelValue
              const status = [
                current ? props.currentLabel : '',
                step.status === 'error'
                  ? props.errorLabel
                  : step.status === 'complete'
                    ? props.completeLabel
                    : '',
              ]
                .filter(Boolean)
                .join(' · ')
              return h(ui.Column, { key: choiceKey(step.value), gap: 'xs', grow: 1 }, () => [
                h(ui.Button, {
                  text: `${index + 1}. ${step.label}`,
                  variant: current ? 'primary' : 'secondary',
                  disabled: props.disabled || step.disabled || (props.loading && !current),
                  loading: props.loading && current,
                  accessibilityLabel: `${index + 1}. ${step.label}${status ? `. ${status}` : ''}`,
                  ...(platform === 'web' ? { 'aria-current': current ? 'step' : undefined } : {}),
                  onClick: () => {
                    if (!props.disabled && !props.loading && !step.disabled && !current)
                      emit('update:modelValue', step.value)
                  },
                }),
                status
                  ? h(ui.Text, {
                      variant: 'caption',
                      tone: step.status === 'error' ? 'danger' : 'muted',
                      text: status,
                    })
                  : null,
              ])
            }),
        )
      }
    },
  })
  const MPagination = defineComponent({
    name: 'MPagination',
    inheritAttrs: false,
    props: paginationProps,
    emits: { 'update:modelValue': (_page: number) => true },
    setup(props, { attrs, emit }) {
      const root = shallowRef<unknown>()
      const layout = useComponentLayout(() => [props.modelValue, props.total, props.pageSize])
      const id = `m-pagination-${useId()}`
      let restore = () => {}
      onBeforeUpdate(() => {
        restore = ui.preserveFocus?.(root.value, `${id}-page-${props.modelValue}`) ?? (() => {})
      })
      onUpdated(() => {
        const apply = restore
        void nextTick(apply)
      })
      const request = (page: number | null) => {
        if (page !== null && page !== props.modelValue && !props.disabled && !props.loading)
          emit('update:modelValue', page)
      }
      return () => {
        if (!props.label.trim()) throw new TypeError('Pagination requires a navigation label.')
        const state = pagination(props.total, props.pageSize, props.modelValue, props.siblingCount)
        return h(
          ui.Column,
          mergeProps(
            { gap: 'sm', ref: root },
            attrs,
            platform === 'web' ? { role: 'navigation', 'aria-label': props.label } : {},
          ),
          () => [
            props.statusText
              ? h(ui.Text, {
                  text: props.statusText,
                  variant: 'caption',
                  tone: 'muted',
                  ...(platform === 'web'
                    ? { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }
                    : { accessibilityLiveRegion: 'polite' }),
                })
              : null,
            state.count === 0 ? h(ui.Text, { tone: 'muted', text: props.emptyLabel }) : null,
            state.outOfRange ? h(ui.Text, { tone: 'danger', text: props.invalidPageLabel }) : null,
            h(ui.Row, { gap: 'sm', wrap: true, motionRegion: layout }, () => [
              h(ui.Button, {
                variant: 'secondary',
                text: props.previousLabel,
                disabled: props.disabled || state.previous === null,
                loading: props.loading,
                loadingText: props.previousLabel,
                onClick: () => request(state.previous),
              }),
              ...state.items.map((item) =>
                item.kind === 'gap'
                  ? h(ui.Text, { key: item.key, text: '…', accessibilityHidden: true })
                  : h(ui.Button, {
                      key: item.page,
                      text: String(item.page),
                      accessibilityLabel: `${props.pageLabel} ${item.page}${platform === 'native' && item.page === props.modelValue ? `. ${props.currentLabel}` : ''}`,
                      variant: item.page === props.modelValue ? 'primary' : 'ghost',
                      id: `${id}-page-${item.page}`,
                      disabled: props.disabled,
                      loading: props.loading,
                      loadingText: String(item.page),
                      ...(platform === 'web'
                        ? { 'aria-current': item.page === props.modelValue ? 'page' : undefined }
                        : {}),
                      onClick: () => request(item.page),
                    }),
              ),
              h(ui.Button, {
                variant: 'secondary',
                text: props.nextLabel,
                disabled: props.disabled || state.next === null,
                loading: props.loading,
                loadingText: props.nextLabel,
                onClick: () => request(state.next),
              }),
            ]),
          ],
        )
      }
    },
  })
  return { MFormGroup, MFormErrors, MSteps, MPagination }
}
