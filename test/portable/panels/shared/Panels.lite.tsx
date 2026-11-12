import { useStore } from '@builder.io/mitosis'

export default function Panels() {
  const state = useStore({
    split: 40,
    rows: 50,
    // The source keeps the library from growing past 44 percent.
    choose(value: number) {
      if (value <= 44) state.split = value
    },
  })

  return (
    <MColumn gap="md">
      <MResizablePanels
        id="workspace"
        label="Workspace split"
        value={state.split}
        onChange={(value) => state.choose(value)}
        collapsible
        height={160}
        primaryLabel="Library"
        secondaryLabel="Reader"
        slotPrimary={
          <MBox id="library-pane" height={40}>
            <MText>Shelves</MText>
          </MBox>
        }
        slotSecondary={
          <MBox id="reader-pane" height={40}>
            <MText>Pages</MText>
          </MBox>
        }
      />
      <MText>{`Split ${state.split}`}</MText>
      <MResizablePanels
        label="Stacked split"
        value={state.rows}
        onChange={(value) => (state.rows = value)}
        orientation="vertical"
        height={240}
        step={5}
        primaryLabel="Top"
        secondaryLabel="Bottom"
        slotPrimary={<MText id="top-text">Above</MText>}
        slotSecondary={<MText id="bottom-text">Below</MText>}
      />
      <MText>{`Rows ${state.rows}`}</MText>
    </MColumn>
  )
}
