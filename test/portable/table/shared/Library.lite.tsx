import { Show, useStore } from '@builder.io/mitosis'
import type { Book, Heading } from './types'

export default function Library() {
  const state = useStore({
    books: [
      { id: 'b1', title: 'Dune', author: 'Herbert', pages: 612, lent: false },
      { id: 'b2', title: 'Emma', author: 'Austen', pages: 474, note: 'Gift', lent: true },
      { id: 'b3', title: 'Ulysses', author: 'Joyce', pages: 730, lent: false },
    ] as Book[],
    none: [] as Book[],
    columns: [
      { key: 'title', label: 'Title', sortable: true },
      { key: 'author', label: 'Author' },
      { key: 'pages', label: 'Pages', sortable: true, width: 96, align: 'end' },
      { key: 'note', label: 'Note' },
    ] as DataColumn[],
    short: [
      { key: 'title', label: 'Title' },
      { key: 'mark', label: 'Mark', width: 96 },
    ] as Heading[],
    sort: undefined as DataSort | undefined,
    selected: ['elsewhere'],
    busy: false,
    get ordered(): Book[] {
      const key = state.sort?.key ?? ''
      const sign = state.sort?.direction === 'descending' ? -1 : 1
      return key === 'pages'
        ? state.books.toSorted((a, b) => (a.pages - b.pages) * sign)
        : key === 'title'
          ? state.books.toSorted((a, b) => (a.title < b.title ? -sign : sign))
          : state.books
    },
  })

  return (
    <MColumn gap="lg">
      <MDataTable
        id="books"
        label="Library"
        items={state.ordered}
        columns={state.columns}
        sort={state.sort}
        onSortChange={(value) => (state.sort = value)}
        selected={state.selected}
        onSelectedChange={(value) => (state.selected = value)}
        selectable
        loading={state.busy}
        rowDisabled={(item) => item.lent}
        rowLabel={(item) => item.title}
        slotActions={
          <MButton
            text={state.busy ? 'Stop' : 'Reload'}
            variant="secondary"
            onClick={() => (state.busy = !state.busy)}
          />
        }
        slotFooter={<MText variant="caption">{`${state.selected.length} selected`}</MText>}
      />
      <MDataTable
        label="Marks"
        items={state.books}
        columns={state.short}
        selected={['b1']}
        selectable
        selectLabel="Mark"
        selectAllLabel="Mark all"
        slotCell={({ item, column, index }) => (
          <Show when={column.key === 'title'} else={<MColumn id={`mark-${item.id}`} height={16} />}>
            <MText id={`title-${item.id}`} weight="600">{`${index + 1}. ${item.title}`}</MText>
          </Show>
        )}
      />
      <MDataTable
        label="Returned"
        items={state.none}
        columns={state.short}
        emptyLabel="Nothing yet"
      />
    </MColumn>
  )
}
