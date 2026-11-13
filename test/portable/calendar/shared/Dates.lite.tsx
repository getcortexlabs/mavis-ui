import { useStore } from '@builder.io/mitosis'
export default function Dates() {
  const state = useStore({ selected: '2024-02-28' as CivilDate, locked: false })
  return (
    <MColumn gap="md">
      <MCalendar
        label="Choose a day"
        value={state.selected}
        onChange={(value) => (state.selected = value)}
        min="2024-02-01"
        max="2024-03-31"
        unavailableDates={['2024-02-29']}
        initialMonth="2024-02"
        disabled={state.locked}
      />
      <MText>{`Selected: ${state.selected}`}</MText>
      <MButton
        text={state.locked ? 'Unlock' : 'Lock'}
        onClick={() => (state.locked = !state.locked)}
      />
    </MColumn>
  )
}
