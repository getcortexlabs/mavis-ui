import { useStore } from '@builder.io/mitosis'

export default function Filters() {
  const state = useStore({
    open: false,
    query: 'Mavis',
    reason: 'none',
  })
  return (
    <MColumn padding="lg" gap="md">
      <MPopover
        open={state.open}
        onUpdateOpen={(value) => (state.open = value)}
        label="Refine results"
        triggerLabel="Filters"
        placement="bottom-end"
        width={320}
        onClose={(next) => (state.reason = next)}
      >
        <MInput label="Search" value={state.query} onChange={(value) => (state.query = value)} />
        <MButton text="Apply filters" onClick={() => (state.open = false)} />
      </MPopover>
      <MText>{state.query}</MText>
      <MText>Closed: {state.reason}</MText>
    </MColumn>
  )
}
