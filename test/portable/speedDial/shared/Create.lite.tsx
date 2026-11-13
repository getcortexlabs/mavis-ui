import { useStore } from '@builder.io/mitosis'

export default function Create() {
  const state = useStore({
    open: false,
    selected: 'none',
    actions: [
      { value: 'note', label: 'New note', icon: 'plus' },
      { value: 'folder', label: 'New folder', disabled: true },
    ] as SpeedDialAction[],
  })
  return (
    <MColumn padding="lg" gap="md">
      <MSpeedDial
        open={state.open}
        onUpdateOpen={(value) => (state.open = value)}
        label="Create"
        actions={state.actions}
        direction="down"
        onSelect={(value) => (state.selected = value)}
      />
      <MText>Selected: {state.selected}</MText>
    </MColumn>
  )
}
