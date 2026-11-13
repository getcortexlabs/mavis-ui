import { useStore } from '@builder.io/mitosis'

export default function Actions() {
  const state = useStore({
    open: false,
    selected: 'none',
    reason: 'none',
    items: [
      { type: 'group', key: 'edit', label: 'Editing' },
      { value: 'edit', label: 'Edit', icon: 'pencil' },
      { value: 'delete', label: 'Delete', disabled: true },
      { type: 'separator', key: 'more' },
      { value: 'duplicate', label: 'Duplicate', icon: 'copy' },
    ] as MenuItem[],
  })
  return (
    <MColumn padding="lg" gap="md">
      <MMenu
        open={state.open}
        onUpdateOpen={(value) => (state.open = value)}
        label="Document actions"
        triggerLabel="Actions"
        items={state.items}
        onSelect={(value) => (state.selected = value)}
        onClose={(value) => (state.reason = value)}
      />
      <MText>Selected: {state.selected}</MText>
      <MText>Closed: {state.reason}</MText>
    </MColumn>
  )
}
