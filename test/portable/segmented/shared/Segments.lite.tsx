import { useStore } from '@builder.io/mitosis'

export default function Segments() {
  const state = useStore({
    view: 'week' as ChoiceValue | undefined,
    size: undefined as ChoiceValue | undefined,
    views: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year', disabled: true },
    ] as SegmentedOption[],
    sizes: [
      { value: 's', label: 'Small' },
      { value: 'l', label: 'Large' },
    ] as SegmentedOption[],
    modes: [
      { value: 'auto', label: 'Automatic' },
      { value: 'manual', label: 'Manual' },
    ] as SegmentedOption[],
    // The source keeps the day view out.
    pick(next: ChoiceValue) {
      if (next !== 'day') state.view = next
    },
  })

  return (
    <MColumn gap="md">
      <MSegmentedControl
        id="views"
        label="Calendar view"
        options={state.views}
        value={state.view}
        onChange={(next) => state.pick(next)}
      />
      <MText id="view-text">{`View ${state.view ?? 'none'}`}</MText>
      <MRow gap="md">
        <MSegmentedControl
          id="sizes"
          label="Size"
          options={state.sizes}
          value={state.size}
          onChange={(value) => (state.size = value)}
          width={240}
        />
        <MText id="size-text" grow={1}>{`Size ${state.size ?? 'none'}`}</MText>
      </MRow>
      <MButton text="Clear size" onClick={() => (state.size = undefined)} />
      <MSegmentedControl
        label="Mode"
        options={state.modes}
        value="auto"
        onChange={(value) => (state.size = value)}
        disabled
      />
    </MColumn>
  )
}
