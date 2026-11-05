import type { DataTableComponent } from './discovery-components.js'
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  type Component,
  type VNodeChild,
} from '@vue/runtime-core'
import { choiceKey, type ChoiceValue } from '../choice.js'
import {
  collectionKeys,
  nextDataSort,
  selectPage,
  validateColumns,
  type DataColumn,
  type DataSort,
} from '../discovery.js'
import { dataTableProps } from './discovery-props.js'
import { useMavisTheme } from './theme.js'

export function createDataTable(
  ui: {
    Column: Component
    Row: Component
    Text: Component
    Button: Component
    Checkbox: Component
    Progress: Component
    table: (
      columns: readonly DataColumn[],
      header: VNodeChild[],
      rows: { key: string; cells: VNodeChild[]; selected: boolean }[],
      label: string,
      busy: boolean,
    ) => VNodeChild
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MDataTable',
    inheritAttrs: false,
    props: dataTableProps,
    emits: {
      'update:sort': (_sort: DataSort | null) => true,
      'update:selected': (_selected: ChoiceValue[]) => true,
    },
    setup(props, { attrs, slots, emit }) {
      const { theme } = useMavisTheme()
      const keys = computed(() => collectionKeys(props.items, props.itemKey))
      const selectable = computed(() =>
        keys.value.filter((_, index) => !props.rowDisabled?.(props.items[index]!)),
      )
      const selectedIds = computed(() => new Set(props.selected.map(choiceKey)))
      function select(page: readonly ChoiceValue[], checked: boolean) {
        if (!props.disabled && !props.loading)
          emit('update:selected', selectPage(props.selected, page, checked))
      }
      return () => {
        validateColumns(props.columns)
        if (
          props.sort &&
          !props.columns.some((column) => column.key === props.sort!.key && column.sortable)
        )
          throw new RangeError('Sort must identify a sortable column.')
        const count = selectable.value.filter((key) => selectedIds.value.has(choiceKey(key))).length
        const headers = props.columns.map((column) =>
          column.sortable
            ? h(ui.Button, {
                text: column.label,
                variant: 'ghost',
                disabled: props.disabled || props.loading,
                icon:
                  props.sort?.key !== column.key
                    ? 'arrow-up-down'
                    : props.sort.direction === 'ascending'
                      ? 'arrow-up'
                      : 'arrow-down',
                accessibilityLabel: `${column.label}${platform === 'native' && props.sort?.key === column.key ? `, ${props.sort.direction}` : ''}`,
                onClick: () => {
                  if (!props.disabled && !props.loading)
                    emit('update:sort', nextDataSort(props.sort, column.key))
                },
              })
            : h(ui.Text, { text: column.label, weight: '600', variant: 'caption' }),
        )
        const columns = props.columns.map((column) => ({
          ...column,
          sort: props.sort?.key === column.key ? props.sort.direction : undefined,
        }))
        if (props.selectable) {
          let selectionKey = '__mavis_selection'
          while (columns.some((column) => column.key === selectionKey))
            selectionKey = '_' + selectionKey
          columns.unshift({
            key: selectionKey,
            // The checkbox carries the accessible label; this column has no visible caption.
            label: '',
            width: 64,
            sort: undefined,
          })
          headers.unshift(
            h(ui.Checkbox, {
              label: props.selectAllLabel,
              modelValue: count > 0 && count === selectable.value.length,
              indeterminate: count > 0 && count < selectable.value.length,
              disabled: props.disabled || props.loading || !selectable.value.length,
              'onUpdate:modelValue': (value: boolean) => select(selectable.value, value),
              ...(platform === 'web' ? { class: 'm-data-table-selection' } : {}),
            }),
          )
        }
        const rows = props.items.map((item, index) => {
          const key = keys.value[index]!
          const cells = props.columns.map((column) => {
            const raw = column.value ? column.value(item) : item[column.key]
            const value =
              raw == null || typeof raw === 'string' || typeof raw === 'number' ? raw : String(raw)
            const slot = { item, itemKey: key, column, value, index }
            return (
              slots[`cell:${column.key}`]?.(slot) ??
              slots.cell?.(slot) ??
              h(ui.Text, {
                text: String(value ?? '—'),
                align: column.align === 'end' ? 'right' : 'left',
              })
            )
          })
          if (props.selectable)
            cells.unshift(
              h(ui.Checkbox, {
                label: `${props.selectLabel} ${props.rowLabel?.(item) ?? String(key)}`,
                modelValue: selectedIds.value.has(choiceKey(key)),
                disabled: props.disabled || props.loading || props.rowDisabled?.(item),
                'onUpdate:modelValue': (value: boolean) => {
                  if (!props.rowDisabled?.(item)) select([key], value)
                },
                ...(platform === 'web' ? { class: 'm-data-table-selection' } : {}),
              }),
            )
          return { key: choiceKey(key), cells, selected: selectedIds.value.has(choiceKey(key)) }
        })
        return h(
          ui.Column,
          mergeProps(
            { id: props.id, gap: 'md' },
            attrs,
            platform === 'web'
              ? {
                  class: 'm-data-table',
                  style: {
                    '--m-color-border': theme.value.colors.border,
                    '--m-color-primarySoft': theme.value.colors.primarySoft,
                  },
                }
              : {},
          ),
          () => [
            h(ui.Row, { justify: 'between', gap: 'md', wrap: true }, () => [
              h(ui.Text, { as: 'h2', variant: 'heading', text: props.label }),
              slots.actions?.(),
            ]),
            h(
              ui.Column,
              { radius: 'lg', backgroundColor: theme.value.colors.surface, gap: 'none' },
              () => [
                props.loading
                  ? h(ui.Progress, { indeterminate: true, label: props.loadingLabel, size: 'sm' })
                  : null,
                ui.table(columns, headers, rows, props.label, props.loading),
                !rows.length
                  ? (slots.empty?.() ??
                    h(ui.Text, {
                      text: props.loading ? props.loadingLabel : props.emptyLabel,
                      tone: 'muted',
                      style: { padding: 24 },
                      ...(platform === 'web'
                        ? { role: 'status' }
                        : { accessibilityLiveRegion: 'polite' }),
                    }))
                  : null,
              ],
            ),
            slots.footer?.(),
          ],
        )
      }
    },
  }) as unknown as DataTableComponent
}
