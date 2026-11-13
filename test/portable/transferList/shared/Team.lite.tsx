import { useStore } from '@builder.io/mitosis'

export default function Team() {
  const state = useStore({
    team: ['ana'] as ChoiceValue[],
    people: [
      { value: 'ana', label: 'Ana' },
      { value: 'bia', label: 'Bia' },
      { value: 'caio', label: 'Caio' },
      { value: 'duda', label: 'Duda', disabled: true },
    ] as SelectOption[],
    locked: false,
    // The source keeps the team to three people.
    choose(value: ChoiceValue[]) {
      if (value.length <= 3) state.team = value
    },
    get summary(): string {
      return state.team.length === 0 ? 'Nobody yet' : `On the team: ${state.team.join(', ')}`
    },
  })

  return (
    <MColumn gap="md">
      <MTransferList
        id="team"
        label="Team"
        options={state.people}
        value={state.team}
        onChange={(value) => state.choose(value)}
        disabled={state.locked}
        availableLabel="People"
        selectedLabel="Team members"
        addLabel="Add to team"
        removeLabel="Take off team"
        emptyLabel="Nobody here"
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
