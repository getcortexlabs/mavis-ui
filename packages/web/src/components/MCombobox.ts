import { useComponentLayout } from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from '../motion-region.js'
import { useComponentTransition } from '../component-motion.js'
import {
  defineComponent,
  Teleport,
  Transition,
  shallowRef,
  type CSSProperties,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useId,
  watch,
} from 'vue'
import {
  choiceKey,
  fontFamily,
  resolveRadius,
  resolveDimension,
  nonNegative,
  type InputHandle,
} from '@getcortexlabs/mavis-core'
import {
  comboboxProps,
  comboboxEmits,
  useCombobox,
  useMavisTheme,
  useButtonAction,
  useLayoutShrink,
} from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MIcon } from './MIcon.js'
import { describedBy, inputAttrs, type InputEditorAttributes } from '../input-attrs.js'
import { length } from '../style.js'
import { useHydrationEdit } from '../hydration.js'

const Combobox = defineComponent({
  name: 'MCombobox',
  inheritAttrs: false,
  props: comboboxProps,
  emits: comboboxEmits,
  setup(props, { attrs, emit, expose }) {
    useButtonAction()
    const { theme } = useMavisTheme()
    const combo = useCombobox(props, emit)
    const resultLayout = useComponentLayout(
      () => combo.state.value.options.map((option) => option.value),
      false,
    )
    const resultMotion = useMotionRegion(() => resultLayout)
    const popupMotion = {
      ...useComponentTransition(4),
      onBeforeLeave: (element: Element) => {
        element.setAttribute('inert', '')
        element.setAttribute('aria-hidden', 'true')
      },
      onBeforeEnter: (element: Element) => {
        element.removeAttribute('inert')
        element.removeAttribute('aria-hidden')
      },
    }
    const shrink = useLayoutShrink()
    const generatedId = `m-combobox-${useId()}`
    const root = ref<HTMLElement>()
    const editor = ref<HTMLInputElement>()
    const focused = ref(false)
    const popup = ref<HTMLElement>()
    const popupHost = shallowRef<HTMLElement>()
    const placement = shallowRef<CSSProperties>({ visibility: 'hidden' })
    let placementObserver: ResizeObserver | undefined
    let placementMotion: MutationObserver | undefined
    function ownsFocus(target: EventTarget | null) {
      return (
        target instanceof Node && (root.value?.contains(target) || popup.value?.contains(target))
      )
    }
    function positionPopup() {
      if (!combo.open.value || !editor.value) return
      const rect = editor.value.getBoundingClientRect()
      const viewport = window.visualViewport
      const top = viewport?.offsetTop ?? 0
      const left = viewport?.offsetLeft ?? 0
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      const below = top + height - rect.bottom - 8
      const above = rect.top - top - 8
      const down = below >= Math.min(240, above)
      popupHost.value = editor.value.closest('dialog') ?? document.body
      placement.value = {
        left: `${Math.max(left + 8, Math.min(rect.left, left + width - Math.min(rect.width, width - 16) - 8))}px`,
        width: `${Math.max(0, Math.min(rect.width, width - 16))}px`,
        maxHeight: `${Math.max(48, Math.min(320, down ? below : above))}px`,
        top: down ? `${rect.bottom + 4}px` : undefined,
        bottom: down ? undefined : `${window.innerHeight - rect.top + 4}px`,
      }
    }
    function outsidePointer(event: PointerEvent) {
      if (!ownsFocus(event.target)) combo.close()
    }
    function focusout() {
      void nextTick(() => {
        if (alive && !ownsFocus(document.activeElement)) combo.close()
      })
    }
    function releasePlacement() {
      placementObserver?.disconnect()
      placementObserver = undefined
      placementMotion?.disconnect()
      placementMotion = undefined
      if (typeof window === 'undefined') return
      window.removeEventListener('resize', positionPopup)
      document.removeEventListener('scroll', positionPopup, true)
      document.removeEventListener('pointerdown', outsidePointer, true)
      window.visualViewport?.removeEventListener('resize', positionPopup)
      window.visualViewport?.removeEventListener('scroll', positionPopup)
    }
    watch(
      combo.open,
      (open) => {
        releasePlacement()
        if (!open || typeof window === 'undefined') return
        positionPopup()
        window.addEventListener('resize', positionPopup)
        document.addEventListener('scroll', positionPopup, true)
        document.addEventListener('pointerdown', outsidePointer, true)
        window.visualViewport?.addEventListener('resize', positionPopup)
        window.visualViewport?.addEventListener('scroll', positionPopup)
        if (typeof ResizeObserver !== 'undefined' && root.value) {
          placementObserver = new ResizeObserver(positionPopup)
          placementObserver.observe(root.value)
        }
        // A sheet transform changes screen coordinates without resizing the editor.
        // Observe its presentation while the popup is open; Jolt still owns all motion.
        const sheet = editor.value?.closest('.m-sheet-panel')
        if (sheet && typeof MutationObserver !== 'undefined') {
          placementMotion = new MutationObserver(positionPopup)
          placementMotion.observe(sheet, { attributes: true, attributeFilter: ['style'] })
        }
      },
      { flush: 'post' },
    )
    const rows = new Map<string, HTMLElement>()
    let alive = true
    const hydrationEdit = useHydrationEdit(
      (element) => {
        const field = element.querySelector<HTMLInputElement>('.m-combobox-editor')
        if (
          field &&
          !props.disabled &&
          field.defaultValue === props.query &&
          field.value !== field.defaultValue
        ) {
          field.defaultValue = field.value
          return field.value
        }
      },
      (value) => combo.edit(value),
    )
    const focus = () => {
      if (!props.disabled) editor.value?.focus({ preventScroll: true })
    }
    const blur = () => {
      combo.close()
      editor.value?.blur()
    }
    expose({ focus, blur } satisfies InputHandle)
    function leave() {
      combo.close()
    }
    function visibility() {
      if (document.hidden) leave()
    }
    onMounted(() => {
      if (typeof document === 'undefined') return
      if (editor.value) editor.value.defaultValue = props.query
      if (editor.value === document.activeElement) {
        focused.value = true
        combo.show()
      }
      document.addEventListener('visibilitychange', visibility)
      window.addEventListener('pagehide', leave)
    })
    onUpdated(() => {
      if (editor.value) editor.value.defaultValue = props.query
    })
    onBeforeUnmount(() => {
      alive = false
      releasePlacement()
      rows.clear()
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', visibility)
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', leave)
    })
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) blur()
      },
    )
    watch(combo.active, () => {
      void nextTick(() => {
        if (alive && combo.open.value && combo.active.value)
          rows.get(combo.active.value)?.scrollIntoView?.({ block: 'nearest' })
      })
    })
    function keydown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.keyCode === 229 ||
        combo.composing.value ||
        props.disabled
      )
        return
      if (event.key === 'Enter') {
        // This field commits a discrete value; editing never implicitly submits a form.
        event.preventDefault()
        if (combo.state.value.status === 'error') combo.retry()
        else combo.commit()
      } else if (event.key === 'Escape' && combo.open.value) {
        event.preventDefault()
        event.stopPropagation()
        combo.cancel()
      } else if (
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        event.preventDefault()
        combo.move(event.key === 'ArrowDown' ? 1 : -1)
      }
    }
    return () => {
      const { colors, typography, radius, control } = theme.value
      const tokens = theme.value.components.input
      const id = props.id ?? generatedId
      const open = combo.open.value && !props.disabled
      const state = combo.state.value
      const selected = combo.selected.value
      const message = props.error || props.helperText
      const forwarded = inputAttrs(attrs)
      const optionId = (key: string) => `${id}-option-${encodeURIComponent(key)}`
      const status =
        state.status === 'loading' || state.status === 'debouncing'
          ? props.loadingText
          : state.status === 'error'
            ? props.searchErrorText
            : state.status === 'empty'
              ? props.emptyText
              : state.status === 'idle'
                ? props.idleText
                : state.limited
                  ? props.limitedText
                  : ''
      // Reading the revision restores the controlled DOM value even if the parent rejects an edit.
      void combo.revision.value
      return h(
        'div',
        mergeProps(forwarded.wrapper, {
          ref: root,
          onFocusout: focusout,
          class: 'm-combobox',
          style: {
            position: 'relative',
            minWidth: 0,
            width: length(resolveDimension(props.width)),
            flexGrow: nonNegative(props.grow, 'grow'),
            flexShrink: nonNegative(props.shrink ?? shrink.value, 'shrink'),
          },
        }),
        [
          h(
            MColumn,
            { gap: 'sm', accessibilityHidden: props.accessibilityHidden },
            {
              default: () => [
                h(
                  'label',
                  {
                    for: id,
                    style: {
                      color: colors.text,
                      fontFamily: fontFamily(typography.body.fontFamily, 'web'),
                      fontSize: `${typography.caption.fontSize}px`,
                      fontWeight: 600,
                      lineHeight: 1.4,
                    },
                  },
                  props.label,
                ),
                h('div', { style: { display: 'flex', position: 'relative' } }, [
                  h(
                    'input',
                    mergeProps(forwarded.editor, {
                      ref: editor,
                      id,
                      class: 'm-input-editor m-combobox-editor',
                      type: 'text',
                      role: 'combobox',
                      autocomplete: 'off',
                      value: hydrationEdit() ?? props.query,
                      disabled: props.disabled,
                      placeholder: props.placeholder,
                      'aria-autocomplete': 'list',
                      'aria-expanded': open,
                      'aria-haspopup': 'listbox',
                      'aria-controls': open ? `${id}-results` : undefined,
                      'aria-activedescendant':
                        open && combo.active.value ? optionId(combo.active.value) : undefined,
                      'aria-invalid': props.error ? 'true' : forwarded.editor['aria-invalid'],
                      'aria-describedby': describedBy(
                        forwarded.editor['aria-describedby'],
                        [
                          message ? `${id}-message` : '',
                          selected && props.query !== selected.label ? `${id}-selection` : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined,
                      ),
                      style: {
                        boxSizing: 'border-box',
                        width: '100%',
                        minWidth: 0,
                        minHeight: `${Math.max(control.md.height, 56)}px`,
                        margin: 0,
                        padding: `var(--m-input-padding-y, ${tokens.paddingY}px) var(--m-input-padding-x, ${tokens.paddingX}px)`,
                        paddingRight: props.clearable ? '60px' : undefined,
                        border: `1px solid ${props.error ? colors.danger : focused.value ? colors.primary : colors.border}`,
                        borderRadius: `var(--m-input-radius, ${resolveRadius(theme.value, tokens.radius)}px)`,
                        outline: 'none',
                        boxShadow: focused.value
                          ? `0 0 0 2px ${props.error ? colors.danger : colors.primary}`
                          : undefined,
                        color: colors.text,
                        backgroundColor: colors.surface,
                        opacity: props.disabled ? 0.5 : 1,
                        fontFamily: `var(--m-input-font-family, ${fontFamily(tokens.fontFamily ?? typography.body.fontFamily, 'web')})`,
                        fontSize: `var(--m-input-font-size, ${tokens.fontSize ?? typography.body.fontSize}px)`,
                        lineHeight: `var(--m-input-line-height, ${tokens.lineHeight})`,
                        fontWeight: `var(--m-input-font-weight, ${tokens.fontWeight})`,
                      },
                      onInput: (event: Event) =>
                        combo.edit((event.target as HTMLInputElement).value),
                      onCompositionstart: combo.startComposition,
                      onCompositionend: (event: CompositionEvent) =>
                        combo.endComposition((event.target as HTMLInputElement).value),
                      onKeydown: keydown,
                      onFocus: () => {
                        focused.value = true
                        combo.show()
                        emit('focus')
                      },
                      onClick: () => {
                        if (!open) combo.show()
                      },
                      onBlur: () => {
                        focused.value = false
                        emit('blur')
                        void nextTick(() => {
                          if (alive && !ownsFocus(document.activeElement)) combo.close()
                        })
                      },
                    }),
                  ),
                  props.clearable && (props.query || props.modelValue !== null)
                    ? h(MButton, {
                        icon: 'x',
                        variant: 'ghost',
                        accessibilityLabel: props.clearLabel,
                        disabled: props.disabled,
                        style: {
                          position: 'absolute',
                          right: '4px',
                          top: 'calc(50% - 24px)',
                          width: '48px',
                          height: '48px',
                          padding: 0,
                        },
                        onPointerdown: (event: PointerEvent) => {
                          if (event.button === 0 && document.activeElement === editor.value)
                            event.preventDefault()
                        },
                        onClick: () => {
                          combo.clear()
                          focus()
                        },
                      })
                    : null,
                ]),
                message
                  ? h(MText, {
                      id: `${id}-message`,
                      text: message,
                      variant: 'caption',
                      tone: props.error ? 'danger' : 'muted',
                    })
                  : null,
                selected && props.query !== selected.label
                  ? h(MText, {
                      id: `${id}-selection`,
                      text: selected.label,
                      variant: 'caption',
                      tone: 'primary',
                    })
                  : null,
                popupHost.value
                  ? h(Teleport, { to: popupHost.value }, [
                      h(Transition, popupMotion, {
                        default: () =>
                          open
                            ? h(
                                'div',
                                {
                                  class: 'm-combobox-popup',
                                  ref: popup,
                                  onFocusout: focusout,
                                  style: {
                                    position: 'fixed',
                                    zIndex: 40,
                                    boxSizing: 'border-box',
                                    overflowY: 'auto',
                                    overscrollBehavior: 'contain',
                                    ...placement.value,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: `${radius.md}px`,
                                    padding: '4px',
                                    backgroundColor: colors.surface,
                                  },
                                },
                                [
                                  h(
                                    'div',
                                    {
                                      ...resultMotion,
                                      id: `${id}-results`,
                                      role: 'listbox',
                                      'aria-label': props.label,
                                      'aria-busy':
                                        state.status === 'loading' || state.status === 'debouncing',
                                      style: { minHeight: 0 },
                                    },
                                    state.options.map((option) => {
                                      const key = choiceKey(option.value)
                                      const highlighted = combo.active.value === key
                                      const checked = props.modelValue === option.value
                                      return h(
                                        'div',
                                        {
                                          key,
                                          id: optionId(key),
                                          role: 'option',
                                          'aria-selected': highlighted,
                                          'aria-disabled': option.disabled || undefined,
                                          'aria-label': option.label,
                                          'data-selected': checked,
                                          'data-active': highlighted,
                                          ref: (element: unknown) => {
                                            if (element) rows.set(key, element as HTMLElement)
                                            else rows.delete(key)
                                          },
                                          style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            minHeight: '48px',
                                            boxSizing: 'border-box',
                                            padding: '10px 12px',
                                            color: colors.text,
                                            backgroundColor: highlighted
                                              ? colors.primarySoft
                                              : 'transparent',
                                            border: `2px solid ${highlighted ? colors.primary : 'transparent'}`,
                                            borderRadius: `${radius.sm}px`,
                                            opacity: option.disabled ? 0.45 : 1,
                                            cursor: option.disabled ? 'default' : 'pointer',
                                          },
                                          onPointerdown: (event: PointerEvent) => {
                                            if (event.button === 0) event.preventDefault()
                                          },
                                          onClick: () => combo.choose(option),
                                        },
                                        [
                                          h(
                                            'div',
                                            {
                                              style: {
                                                minWidth: 0,
                                                flex: 1,
                                                overflowWrap: 'break-word',
                                              },
                                            },
                                            [
                                              h(MText, { text: option.label }),
                                              option.helperText
                                                ? h(MText, {
                                                    text: option.helperText,
                                                    variant: 'caption',
                                                    tone: 'muted',
                                                  })
                                                : null,
                                            ],
                                          ),
                                          checked
                                            ? h(MIcon, { name: 'check', tone: 'primary' })
                                            : null,
                                        ],
                                      )
                                    }),
                                  ),
                                  h(
                                    'div',
                                    { role: 'status', 'aria-live': 'polite' },
                                    status
                                      ? h(MText, {
                                          text: status,
                                          tone: state.status === 'error' ? 'danger' : 'muted',
                                          variant: 'caption',
                                          style: { padding: '12px' },
                                        })
                                      : undefined,
                                  ),
                                  state.status === 'error'
                                    ? h(MButton, {
                                        text: props.retryLabel,
                                        variant: 'ghost',
                                        onPointerdown: (event: PointerEvent) =>
                                          event.preventDefault(),
                                        onClick: combo.retry,
                                      })
                                    : null,
                                ],
                              )
                            : null,
                      }),
                    ])
                  : null,
              ],
            },
          ),
        ],
      )
    }
  },
})
export const MCombobox = Combobox as typeof Combobox & {
  new (): InstanceType<typeof Combobox> & InputHandle & { $props: InputEditorAttributes }
}
