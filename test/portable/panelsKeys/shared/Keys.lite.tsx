import { useStore } from '@builder.io/mitosis'

export default function Keys() {
  const state = useStore({ split: 40, settled: 0 })

  return (
    <MColumn gap="md">
      <MResizablePanels
        label="Workspace split"
        value={state.split}
        onChange={(value) => (state.split = value)}
        onResize={(value) => (state.settled = value)}
        collapsible
        height={160}
        slotPrimary={<MText>Shelves</MText>}
        slotSecondary={<MText>Pages</MText>}
      />
      <MText>{`Split ${state.split}`}</MText>
      <MText>{`Settled ${state.settled}`}</MText>
    </MColumn>
  )
}
