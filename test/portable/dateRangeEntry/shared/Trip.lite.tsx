import { useStore } from '@builder.io/mitosis'
export default function Trip() {
  const state = useStore({
    range: { start: '2024-02-01', end: '2024-02-02' } as DateRange,
    reason: 'none',
  })
  return (
    <MColumn gap="md">
      <MDateRangePicker
        label="Trip"
        value={state.range}
        onChange={(value) => (state.range = value)}
        onValidityChange={(value) => (state.reason = value.reason ?? 'valid')}
        startLabel="Arrival"
        endLabel="Departure"
        initialMonth="2024-02"
        unavailableDates={['2024-02-03']}
      />
      <MText>{`Range: ${state.range.start ?? 'none'} to ${state.range.end ?? 'none'}`}</MText>
      <MText>{`Reason: ${state.reason}`}</MText>
    </MColumn>
  )
}
