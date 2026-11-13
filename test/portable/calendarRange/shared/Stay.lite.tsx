import { useStore } from '@builder.io/mitosis'
export default function Stay() {
  const state = useStore({ range: { start: '2024-02-01', end: null } as DateRange, errors: 0 })
  return (
    <MCalendar
      label="Stay"
      mode="range"
      value={state.range}
      onChange={(value) => (state.range = value)}
      onInvalid={() => state.errors++}
      initialMonth="2024-02"
      unavailableDates={['2024-02-03']}
      slotFooter={
        <MColumn>
          <MText>{`Range: ${state.range.start ?? 'none'} to ${state.range.end ?? 'none'}`}</MText>
          <MText>{`Errors: ${state.errors}`}</MText>
        </MColumn>
      }
    />
  )
}
