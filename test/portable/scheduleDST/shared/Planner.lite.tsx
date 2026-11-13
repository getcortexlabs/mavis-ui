import { useStore } from '@builder.io/mitosis'
type Session = { id: string; title: string; start: number; end: number; note: string }
export default function Planner() {
  const state = useStore({
    events: [
      {
        id: 'design',
        title: 'Design',
        start: 1772951400000,
        end: 1772958600000,
        note: 'Keep metadata',
      },
    ] as Session[],
    date: '2026-03-08' as CivilDate,
    last: 'none',
    selected: 'none',
    error: '',
    disabled: false,
  })
  return (
    <MColumn gap="md">
      <MScheduler
        label="Studio schedule"
        value={state.events}
        onValueChange={(value) => (state.events = value)}
        date={state.date}
        onDateChange={(value) => (state.date = value)}
        timeZone="America/New_York"
        days={1}
        startHour={0}
        endHour={5}
        slotMinutes={30}
        disabled={state.disabled}
        onChange={(value) => (state.last = value.kind)}
        onSelect={(value) => (state.selected = value)}
        onError={(value) => (state.error = value)}
      />
      <MText>{`Start: ${state.events[0]?.start ?? 0}`}</MText>
      <MText>{`End: ${state.events[0]?.end ?? 0}`}</MText>
      <MText>{state.events[0]?.note ?? 'missing'}</MText>
      <MText>{`Last: ${state.last}`}</MText>
      <MText>{`Selected: ${state.selected}`}</MText>
      <MText>{`Error: ${state.error}`}</MText>
      <MButton
        text={state.disabled ? 'Unlock' : 'Lock'}
        onClick={() => (state.disabled = !state.disabled)}
      />
    </MColumn>
  )
}
