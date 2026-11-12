import { useStore } from '@builder.io/mitosis'

export default function Guests() {
  const state = useStore({
    guests: ['ana'] as string[],
    people: [
      { value: 'ana', label: 'Ana' },
      { value: 'bia', label: 'Bia' },
      { value: 'caio', label: 'Caio' },
      { value: 'duda', label: 'Duda', disabled: true },
    ] as SelectOption[],
    locked: false,
    get summary(): string {
      return state.guests.length === 0 ? 'Nobody invited' : `Invited: ${state.guests.join(', ')}`
    },
  })

  return (
    <MColumn gap="md">
      <MMultiSelect
        id="guests"
        label="Guests"
        value={state.guests}
        options={state.people}
        onChange={(value) => (state.guests = value)}
        maxSelected={2}
        placeholder="Choose guests"
        helperText="Up to two people"
        disabled={state.locked}
      />
      <MText id="summary">{state.summary}</MText>
      <MButton
        id="lock"
        text={state.locked ? 'Unlock' : 'Lock'}
        variant="ghost"
        onClick={() => (state.locked = !state.locked)}
      />
    </MColumn>
  )
}
