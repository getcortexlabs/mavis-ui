import { Show } from '@builder.io/mitosis'
import { usePanelPreferences } from './preferences'
export default function Home() {
  const layout = usePanelPreferences()
  return (
    <MColumn gap="sm">
      <Show when={layout.opened.value}>
        <MResizablePanels
          label="Saved columns"
          value={layout.horizontal.value}
          onChange={(value) => layout.resizeHorizontal(value)}
          step={5}
          height={120}
          primaryLabel="Library"
          secondaryLabel="Reader"
          slotPrimary={<MText>Shelves</MText>}
          slotSecondary={<MText>Pages</MText>}
        />
        <MResizablePanels
          label="Saved rows"
          orientation="vertical"
          value={layout.vertical.value}
          onChange={(value) => layout.resizeVertical(value)}
          step={5}
          height={160}
          primaryLabel="Top"
          secondaryLabel="Bottom"
          slotPrimary={<MText>Above</MText>}
          slotSecondary={<MText>Below</MText>}
        />
      </Show>
      <MText>{`Columns ${layout.horizontal.value}`}</MText>
      <MText>{`Rows ${layout.vertical.value}`}</MText>
      <MText>{layout.status.value}</MText>
      <MButton text="Save layout" onClick={() => layout.save()} />
      <MButton text="Close panels" onClick={() => layout.close()} />
      <MButton text="Restore layout" onClick={() => layout.open()} />
    </MColumn>
  )
}
