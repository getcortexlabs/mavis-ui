import { useStore } from '@builder.io/mitosis'

export default function Results() {
  const state = useStore({
    page: 1,
    total: 95,
    busy: false,
  })

  return (
    <MColumn gap="md">
      <MColumn id="pager">
        <MPagination
          total={state.total}
          pageSize={10}
          value={state.page}
          onChange={(value) => (state.page = value)}
          statusText={`Page ${state.page} of ${state.total} results`}
          loading={state.busy}
        />
      </MColumn>
      <MRow id="tools" gap="sm" wrap>
        <MButton text="Fewer" variant="ghost" onClick={() => (state.total = 25)} />
        <MButton text="None" variant="ghost" onClick={() => (state.total = 0)} />
        <MButton text="Busy" variant="ghost" onClick={() => (state.busy = !state.busy)} />
      </MRow>
      <MPagination total={45} pageSize={10} siblingCount={0} previousLabel="Back" nextLabel="On" />
    </MColumn>
  )
}
